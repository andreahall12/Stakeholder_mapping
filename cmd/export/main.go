// Package main exports all data from the stakeholder tool database to a JSON file.
// Usage: go run ./cmd/export [output-file]
// Default output: stakeholder-export.json
package main

import (
	"fmt"
	"log/slog"
	"os"

	"github.com/andreahall12/stakeholder-tool/internal/config"
	"github.com/andreahall12/stakeholder-tool/internal/repository/sqlite"
	"github.com/andreahall12/stakeholder-tool/internal/service"
)

func main() {
	logger := slog.New(slog.NewTextHandler(os.Stdout, &slog.HandlerOptions{Level: slog.LevelInfo}))

	outputFile := "stakeholder-export.json"
	if len(os.Args) > 1 {
		outputFile = os.Args[1]
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

	f, err := os.Create(outputFile) // #nosec G703 -- CLI tool, path from user flag
	if err != nil {
		logger.Error("failed to create output file", "error", err)
		os.Exit(1)
	}
	defer f.Close()

	exportSvc := service.NewExportService(db, logger)
	if err := exportSvc.ExportFullJSON(f); err != nil {
		logger.Error("export failed", "error", err)
		os.Exit(1)
	}

	fmt.Println()
	fmt.Println("=== Export Complete ===")
	fmt.Printf("Your data has been saved to: %s\n", outputFile)
	fmt.Println()
	fmt.Println("You can share this file with others.")
	fmt.Println("They can import it with:  make import FILE=" + outputFile)
	fmt.Println()
}
