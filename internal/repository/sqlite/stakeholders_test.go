package sqlite_test

import (
	"log/slog"
	"os"
	"testing"

	"github.com/andreahall12/stakeholder-tool/internal/domain"
	"github.com/andreahall12/stakeholder-tool/internal/repository/sqlite"
)

func TestStakeholderCRUD(t *testing.T) {
	db := testDB(t)
	logger := slog.New(slog.NewTextHandler(os.Stderr, &slog.HandlerOptions{Level: slog.LevelWarn}))
	repo := sqlite.NewStakeholderRepo(db, logger)

	// Create
	s := &domain.Stakeholder{
		ID:             "test-uuid-1",
		Name:           "Alice Johnson",
		JobTitle:       "VP Engineering",
		Department:     "Engineering",
		Email:          "alice@example.com",
		Slack:          "@alice",
		InfluenceLevel: domain.InfluenceHigh,
		SupportLevel:   domain.SupportChampion,
		Notes:          "Key sponsor",
	}
	if err := repo.Create(s); err != nil {
		t.Fatalf("Create failed: %v", err)
	}

	// Get by ID
	got, err := repo.GetByID("test-uuid-1")
	if err != nil {
		t.Fatalf("GetByID failed: %v", err)
	}
	if got == nil {
		t.Fatal("expected stakeholder, got nil")
	}
	if got.Name != "Alice Johnson" {
		t.Fatalf("expected name 'Alice Johnson', got '%s'", got.Name)
	}
	if got.InfluenceLevel != domain.InfluenceHigh {
		t.Fatalf("expected influence 'high', got '%s'", got.InfluenceLevel)
	}

	// List
	list, err := repo.List(nil)
	if err != nil {
		t.Fatalf("List failed: %v", err)
	}
	if len(list) != 1 {
		t.Fatalf("expected 1 stakeholder, got %d", len(list))
	}

	// List with filter
	filtered, err := repo.List(map[string]string{"influence_level": "high"})
	if err != nil {
		t.Fatalf("List (filtered) failed: %v", err)
	}
	if len(filtered) != 1 {
		t.Fatalf("expected 1 filtered stakeholder, got %d", len(filtered))
	}

	// List with search
	searched, err := repo.List(map[string]string{"search": "alice"})
	if err != nil {
		t.Fatalf("List (search) failed: %v", err)
	}
	if len(searched) != 1 {
		t.Fatalf("expected 1 search result, got %d", len(searched))
	}

	// Update
	s.Name = "Alice M. Johnson"
	s.SupportLevel = domain.SupportSupporter
	if err := repo.Update(s); err != nil {
		t.Fatalf("Update failed: %v", err)
	}
	updated, _ := repo.GetByID("test-uuid-1")
	if updated.Name != "Alice M. Johnson" {
		t.Fatalf("expected updated name, got '%s'", updated.Name)
	}

	// Delete
	if err := repo.Delete("test-uuid-1"); err != nil {
		t.Fatalf("Delete failed: %v", err)
	}
	deleted, _ := repo.GetByID("test-uuid-1")
	if deleted != nil {
		t.Fatal("expected nil after delete")
	}
}

func TestStakeholderNotFound(t *testing.T) {
	db := testDB(t)
	logger := slog.New(slog.NewTextHandler(os.Stderr, &slog.HandlerOptions{Level: slog.LevelWarn}))
	repo := sqlite.NewStakeholderRepo(db, logger)

	s, err := repo.GetByID("nonexistent")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if s != nil {
		t.Fatal("expected nil for nonexistent stakeholder")
	}
}

func TestStakeholderDeleteNotFound(t *testing.T) {
	db := testDB(t)
	logger := slog.New(slog.NewTextHandler(os.Stderr, &slog.HandlerOptions{Level: slog.LevelWarn}))
	repo := sqlite.NewStakeholderRepo(db, logger)

	err := repo.Delete("nonexistent")
	if err == nil {
		t.Fatal("expected error deleting nonexistent stakeholder")
	}
}
