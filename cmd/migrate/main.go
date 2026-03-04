// Package main provides a data migration tool for converting legacy
// stakeholder mapping data (exported from the React/TypeScript app)
// into the new file-based SQLite format.
package main

import (
	"database/sql"
	"encoding/base64"
	"flag"
	"fmt"
	"log/slog"
	"os"
	"path/filepath"
	"strings"

	_ "modernc.org/sqlite"

	"github.com/andreahall12/stakeholder-tool/internal/repository/sqlite"
)

// tables lists the tables to migrate in dependency order.
var tables = []string{
	"projects",
	"stakeholders",
	"workstreams",
	"project_stakeholders",
	"raci_assignments",
	"comm_plans",
	"engagement_logs",
	"stakeholder_history",
	"tags",
	"stakeholder_tags",
	"relationships",
}

func main() {
	logger := slog.New(slog.NewTextHandler(os.Stdout, &slog.HandlerOptions{
		Level: slog.LevelInfo,
	}))

	input := flag.String("input", "", "Path to legacy SQLite database export (.db file or base64 .txt)")
	output := flag.String("output", "stakeholder.db", "Path for the new database file")
	flag.Parse()

	if *input == "" {
		fmt.Fprintln(os.Stderr, "Usage: migrate --input <legacy.db|export.txt> --output <new.db>")
		fmt.Fprintln(os.Stderr, "")
		fmt.Fprintln(os.Stderr, "Supported input formats:")
		fmt.Fprintln(os.Stderr, "  .db   - Direct SQLite database file")
		fmt.Fprintln(os.Stderr, "  .txt  - Base64-encoded SQLite (from browser localStorage export)")
		os.Exit(1)
	}

	logger.Info("starting migration", "input", *input, "output", *output)

	// Verify input file exists
	if _, err := os.Stat(*input); os.IsNotExist(err) {
		logger.Error("input file not found", "path", *input)
		os.Exit(1)
	}

	// Handle base64-encoded input
	inputPath := *input
	if strings.HasSuffix(strings.ToLower(*input), ".txt") {
		decoded, err := decodeBase64DB(*input)
		if err != nil {
			logger.Error("failed to decode base64 input", "error", err)
			os.Exit(1)
		}
		inputPath = decoded
		defer os.Remove(decoded)
		logger.Info("decoded base64 input to temporary file", "path", decoded)
	}

	// Open legacy database for reading
	legacyConn, err := sql.Open("sqlite", inputPath+"?mode=ro")
	if err != nil {
		logger.Error("failed to open legacy database", "error", err)
		os.Exit(1)
	}
	defer legacyConn.Close()

	// Open the new database (creates schema)
	newDB, err := sqlite.New(*output, logger)
	if err != nil {
		logger.Error("failed to create new database", "error", err)
		os.Exit(1)
	}
	defer newDB.Close()

	// Migrate each table
	totalRows := 0
	for _, table := range tables {
		count, err := migrateTable(legacyConn, newDB.Conn(), table, logger)
		if err != nil {
			logger.Error("migration error", "table", table, "error", err)
			continue
		}
		if count > 0 {
			logger.Info("migrated table", "table", table, "rows", count)
		}
		totalRows += count
	}

	// Verify referential integrity
	if err := verifyIntegrity(newDB.Conn(), logger); err != nil {
		logger.Warn("integrity check found issues", "error", err)
	}

	logger.Info("migration complete", "total_rows", totalRows)
	logger.Info("output database", "path", *output)
}

func decodeBase64DB(path string) (string, error) {
	data, err := os.ReadFile(path) // #nosec G304 -- CLI tool, path comes from user flag
	if err != nil {
		return "", fmt.Errorf("reading file: %w", err)
	}

	// Trim whitespace and potential data URI prefix
	content := strings.TrimSpace(string(data))
	if idx := strings.Index(content, ","); idx > 0 && idx < 100 {
		content = content[idx+1:]
	}

	decoded, err := base64.StdEncoding.DecodeString(content)
	if err != nil {
		// Try URL-safe encoding
		decoded, err = base64.URLEncoding.DecodeString(content)
		if err != nil {
			return "", fmt.Errorf("base64 decode failed: %w", err)
		}
	}

	tmpFile := filepath.Join(os.TempDir(), "stakeholder-migrate-legacy.db")
	if err := os.WriteFile(tmpFile, decoded, 0600); err != nil { // #nosec G703 -- safe temp path
		return "", fmt.Errorf("writing temp file: %w", err)
	}

	return tmpFile, nil
}

func migrateTable(src, dst *sql.DB, table string, logger *slog.Logger) (int, error) {
	// Check if table exists in source
	var exists int
	err := src.QueryRow("SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name=?", table).Scan(&exists)
	if err != nil || exists == 0 {
		return 0, nil
	}

	// Get columns
	rows, err := src.Query(fmt.Sprintf("PRAGMA table_info(%s)", table))
	if err != nil {
		return 0, fmt.Errorf("getting table info: %w", err)
	}
	var cols []string
	for rows.Next() {
		var cid int
		var name, typ string
		var notNull, pk int
		var dflt sql.NullString
		if err := rows.Scan(&cid, &name, &typ, &notNull, &dflt, &pk); err != nil {
			continue
		}
		cols = append(cols, name)
	}
	_ = rows.Close()

	if len(cols) == 0 {
		return 0, nil
	}

	// Read all rows
	colList := strings.Join(cols, ", ")
	dataRows, err := src.Query(fmt.Sprintf("SELECT %s FROM %s", colList, table))
	if err != nil {
		return 0, fmt.Errorf("reading source data: %w", err)
	}
	defer dataRows.Close()

	// Prepare insert
	placeholders := strings.Repeat("?,", len(cols))
	placeholders = placeholders[:len(placeholders)-1]
	insertSQL := fmt.Sprintf("INSERT OR IGNORE INTO %s (%s) VALUES (%s)", table, colList, placeholders) // #nosec G201 -- table/cols from schema introspection, not user input

	count := 0
	for dataRows.Next() {
		values := make([]interface{}, len(cols))
		ptrs := make([]interface{}, len(cols))
		for i := range values {
			ptrs[i] = &values[i]
		}
		if err := dataRows.Scan(ptrs...); err != nil {
			logger.Warn("skipping row", "table", table, "error", err)
			continue
		}

		if _, err := dst.Exec(insertSQL, values...); err != nil {
			logger.Warn("insert failed", "table", table, "error", err)
			continue
		}
		count++
	}

	return count, nil
}

func verifyIntegrity(conn *sql.DB, logger *slog.Logger) error {
	var result string
	if err := conn.QueryRow("PRAGMA integrity_check").Scan(&result); err != nil {
		return err
	}
	if result != "ok" {
		return fmt.Errorf("integrity check: %s", result)
	}
	logger.Info("database integrity check passed")

	// Check foreign keys
	rows, err := conn.Query("PRAGMA foreign_key_check")
	if err != nil {
		return err
	}
	defer rows.Close()

	violations := 0
	for rows.Next() {
		violations++
	}
	if violations > 0 {
		logger.Warn("foreign key violations found", "count", violations)
	} else {
		logger.Info("foreign key check passed")
	}

	return nil
}
