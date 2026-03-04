package sqlite_test

import (
	"log/slog"
	"os"
	"testing"

	"github.com/andreahall12/stakeholder-tool/internal/repository/sqlite"
)

// testDB creates an in-memory database for testing.
// The caller must call db.Close() when done.
func testDB(t *testing.T) *sqlite.DB {
	t.Helper()

	// Change to project root so schema.sql can be found
	origDir, _ := os.Getwd()
	os.Chdir(findProjectRoot(t))
	t.Cleanup(func() { os.Chdir(origDir) })

	logger := slog.New(slog.NewTextHandler(os.Stderr, &slog.HandlerOptions{Level: slog.LevelWarn}))
	db, err := sqlite.NewInMemory(logger)
	if err != nil {
		t.Fatalf("failed to create test database: %v", err)
	}
	t.Cleanup(func() { db.Close() })
	return db
}

func findProjectRoot(t *testing.T) string {
	t.Helper()
	// Walk up from the current directory to find go.mod
	dir, _ := os.Getwd()
	for i := 0; i < 10; i++ {
		if _, err := os.Stat(dir + "/go.mod"); err == nil {
			return dir
		}
		dir = dir + "/.."
	}
	t.Fatal("could not find project root (go.mod)")
	return ""
}

func TestNewInMemory(t *testing.T) {
	db := testDB(t)
	if db == nil {
		t.Fatal("expected non-nil db")
	}

	// Verify schema was created
	var count int
	err := db.Conn().QueryRow("SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name='stakeholders'").Scan(&count)
	if err != nil {
		t.Fatalf("query error: %v", err)
	}
	if count != 1 {
		t.Fatalf("expected stakeholders table to exist, got count=%d", count)
	}
}

func TestAuditLog(t *testing.T) {
	db := testDB(t)

	db.AuditLog("test_action", "test_entity", "123", "test details")

	var action, entityType, entityID, details string
	err := db.Conn().QueryRow(
		"SELECT action, entity_type, entity_id, details FROM audit_log ORDER BY id DESC LIMIT 1",
	).Scan(&action, &entityType, &entityID, &details)
	if err != nil {
		t.Fatalf("query error: %v", err)
	}
	if action != "test_action" || entityType != "test_entity" || entityID != "123" {
		t.Fatalf("unexpected audit log: action=%s, entity_type=%s, entity_id=%s", action, entityType, entityID)
	}
}
