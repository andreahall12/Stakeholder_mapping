// Package main loads demo data into the stakeholder tool database.
// Usage: go run ./cmd/seed
package main

import (
	"fmt"
	"log/slog"
	"os"

	"github.com/andreahall12/stakeholder-tool/internal/config"
	"github.com/andreahall12/stakeholder-tool/internal/repository/sqlite"
)

func main() {
	logger := slog.New(slog.NewTextHandler(os.Stdout, &slog.HandlerOptions{Level: slog.LevelInfo}))

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

	seedSQL, err := os.ReadFile("db/seed_demo.sql")
	if err != nil {
		logger.Error("failed to read seed file", "error", err)
		os.Exit(1)
	}

	if _, err := db.Conn().Exec(string(seedSQL)); err != nil {
		logger.Error("failed to execute seed data", "error", err)
		os.Exit(1)
	}

	fmt.Println()
	fmt.Println("  Demo data loaded (Cloud Platform Migration scenario).")
	fmt.Println("  This is SAMPLE DATA — none of it is real.")
	fmt.Println()
}
