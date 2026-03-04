// Package main imports data from a JSON export file into the stakeholder tool database.
// Usage: go run ./cmd/importdata <input-file>
//
// WARNING: This replaces all existing data in the database.
package main

import (
	"bufio"
	"fmt"
	"log/slog"
	"os"
	"strings"

	"github.com/andreahall12/stakeholder-tool/internal/config"
	"github.com/andreahall12/stakeholder-tool/internal/repository/sqlite"
	"github.com/andreahall12/stakeholder-tool/internal/service"
)

func main() {
	logger := slog.New(slog.NewTextHandler(os.Stdout, &slog.HandlerOptions{Level: slog.LevelInfo}))

	if len(os.Args) < 2 {
		fmt.Println("Usage: go run ./cmd/importdata <file.json>")
		fmt.Println()
		fmt.Println("  Import a JSON export file into the Stakeholder Tool.")
		fmt.Println("  This will REPLACE all existing data.")
		fmt.Println()
		fmt.Println("Example:")
		fmt.Println("  make import FILE=stakeholder-export.json")
		os.Exit(1)
	}

	inputFile := os.Args[1]

	// Check the file exists before doing anything else
	if _, err := os.Stat(inputFile); os.IsNotExist(err) { // #nosec G703 -- CLI tool, path from user arg
		fmt.Printf("File not found: %s\n", inputFile)
		fmt.Println("Make sure the file path is correct and try again.")
		os.Exit(1)
	}

	// Confirm with the user
	fmt.Println()
	fmt.Printf("This will import data from: %s\n", inputFile)
	fmt.Println()
	fmt.Println("WARNING: This will REPLACE all existing data in your database.")
	fmt.Println("If you have data you want to keep, run 'make export' first.")
	fmt.Println()
	fmt.Print("Continue? (yes/no): ")

	scanner := bufio.NewScanner(os.Stdin)
	scanner.Scan()
	answer := strings.TrimSpace(strings.ToLower(scanner.Text()))
	if answer != "yes" && answer != "y" {
		fmt.Println("Import cancelled.")
		os.Exit(0)
	}

	cfg, err := config.Load()
	if err != nil {
		logger.Error("failed to load config", "error", err)
		os.Exit(1)
	}

	db, err := sqlite.New(cfg.DBPath, logger)
	if err != nil {
		logger.Error("failed to open database", "error", err)
		os.Exit(1)
	}
	defer db.Close()

	f, err := os.Open(inputFile) // #nosec G304 G703 -- CLI tool, path from user arg
	if err != nil {
		fmt.Printf("Could not open file: %s\n", err)
		os.Exit(1)
	}
	defer f.Close()

	exportSvc := service.NewExportService(db, logger)
	result, err := exportSvc.ImportFullJSON(f)
	if err != nil {
		fmt.Printf("Import failed: %s\n", err)
		fmt.Println()
		fmt.Println("Make sure the file is a valid Stakeholder Tool export.")
		os.Exit(1)
	}

	fmt.Println()
	fmt.Println("=== Import Complete ===")
	fmt.Printf("  Projects:       %d\n", result.Projects)
	fmt.Printf("  Stakeholders:   %d\n", result.Stakeholders)
	fmt.Printf("  Workstreams:    %d\n", result.Workstreams)
	fmt.Printf("  RACI entries:   %d\n", result.RACIAssignments)
	fmt.Printf("  Relationships:  %d\n", result.Relationships)
	fmt.Printf("  Tags:           %d\n", result.Tags)
	fmt.Printf("  Comm plans:     %d\n", result.CommPlans)
	fmt.Printf("  Engagements:    %d\n", result.EngagementLogs)
	fmt.Println()
	fmt.Println("Start the tool with:  make run")
	fmt.Println()
}
