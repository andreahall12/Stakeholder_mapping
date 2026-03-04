// Package sqlite provides SQLite-backed repository implementations.
// It uses modernc.org/sqlite (pure Go, no CGo) for portability and security.
package sqlite

import (
	"database/sql"
	"fmt"
	"log/slog"
	"os"
	"path/filepath"

	_ "modernc.org/sqlite"
)

// schemaSQL holds the database schema. It's loaded at runtime from the db/ directory.
// Note: go:embed cannot use ../ paths, so we load from the filesystem instead.

// DB wraps a sql.DB connection with stakeholder-specific operations.
type DB struct {
	conn   *sql.DB
	logger *slog.Logger
}

// New opens (or creates) a SQLite database at the given path.
// It enables WAL mode, foreign keys, and runs the schema if needed.
func New(dbPath string, logger *slog.Logger) (*DB, error) {
	// Ensure the directory exists
	dir := filepath.Dir(dbPath)
	if dir != "" && dir != "." {
		if err := os.MkdirAll(dir, 0750); err != nil {
			return nil, fmt.Errorf("creating db directory: %w", err)
		}
	}

	conn, err := sql.Open("sqlite", dbPath)
	if err != nil {
		return nil, fmt.Errorf("opening database: %w", err)
	}

	// Configure SQLite for safety and performance
	pragmas := []string{
		"PRAGMA journal_mode=WAL",
		"PRAGMA foreign_keys=ON",
		"PRAGMA busy_timeout=5000",
		"PRAGMA synchronous=NORMAL",
		"PRAGMA cache_size=-20000", // 20MB cache
	}
	for _, p := range pragmas {
		if _, err := conn.Exec(p); err != nil {
			_ = conn.Close()
			return nil, fmt.Errorf("setting pragma %q: %w", p, err)
		}
	}

	db := &DB{conn: conn, logger: logger}

	// Initialize schema
	if err := db.initSchema(); err != nil {
		_ = conn.Close()
		return nil, fmt.Errorf("initializing schema: %w", err)
	}

	logger.Info("database opened", "path", dbPath)
	return db, nil
}

// NewInMemory creates an in-memory SQLite database for testing.
func NewInMemory(logger *slog.Logger) (*DB, error) {
	return New(":memory:", logger)
}

// Close gracefully shuts down the database connection.
// It runs a WAL checkpoint before closing to ensure all data is flushed.
func (db *DB) Close() error {
	db.logger.Info("closing database")
	// Checkpoint WAL to main database file
	if _, err := db.conn.Exec("PRAGMA wal_checkpoint(TRUNCATE)"); err != nil {
		db.logger.Warn("WAL checkpoint failed", "error", err)
	}
	return db.conn.Close()
}

// Conn returns the underlying sql.DB connection for use by repositories.
func (db *DB) Conn() *sql.DB {
	return db.conn
}

func (db *DB) initSchema() error {
	schema, err := os.ReadFile("db/schema.sql")
	if err != nil {
		return fmt.Errorf("reading schema (ensure db/schema.sql exists): %w", err)
	}

	if _, err := db.conn.Exec(string(schema)); err != nil {
		return fmt.Errorf("executing schema: %w", err)
	}

	db.logger.Info("schema initialized")
	return nil
}

// AuditLog records an action in the audit log table.
func (db *DB) AuditLog(action, entityType, entityID, details string) {
	_, err := db.conn.Exec(
		"INSERT INTO audit_log (action, entity_type, entity_id, details) VALUES (?, ?, ?, ?)",
		action, entityType, entityID, details,
	)
	if err != nil {
		db.logger.Error("failed to write audit log", "error", err, "action", action)
	}
}
