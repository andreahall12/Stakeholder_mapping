package service_test

import (
	"log/slog"
	"os"
	"testing"

	"github.com/andreahall12/stakeholder-tool/internal/domain"
	"github.com/andreahall12/stakeholder-tool/internal/repository/sqlite"
	"github.com/andreahall12/stakeholder-tool/internal/service"
)

func testDB(t *testing.T) *sqlite.DB {
	t.Helper()
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
	dir, _ := os.Getwd()
	for i := 0; i < 10; i++ {
		if _, err := os.Stat(dir + "/go.mod"); err == nil {
			return dir
		}
		dir = dir + "/.."
	}
	t.Fatal("could not find project root")
	return ""
}

func TestStakeholderServiceCreate(t *testing.T) {
	db := testDB(t)
	logger := slog.New(slog.NewTextHandler(os.Stderr, &slog.HandlerOptions{Level: slog.LevelWarn}))
	svc := service.NewStakeholderService(db, logger)

	sh := &domain.Stakeholder{
		Name:       "Test User",
		Department: "Engineering",
	}

	if err := svc.Create(sh); err != nil {
		t.Fatalf("Create failed: %v", err)
	}

	// ID should be auto-generated
	if sh.ID == "" {
		t.Fatal("expected ID to be generated")
	}

	// Defaults should be set
	if sh.InfluenceLevel != domain.InfluenceMedium {
		t.Fatalf("expected default influence 'medium', got '%s'", sh.InfluenceLevel)
	}
	if sh.SupportLevel != domain.SupportNeutral {
		t.Fatalf("expected default support 'neutral', got '%s'", sh.SupportLevel)
	}

	// Fetch back
	got, err := svc.GetByID(sh.ID)
	if err != nil {
		t.Fatalf("GetByID failed: %v", err)
	}
	if got.Name != "Test User" {
		t.Fatalf("expected 'Test User', got '%s'", got.Name)
	}
}

func TestStakeholderServiceCreateValidation(t *testing.T) {
	db := testDB(t)
	logger := slog.New(slog.NewTextHandler(os.Stderr, &slog.HandlerOptions{Level: slog.LevelWarn}))
	svc := service.NewStakeholderService(db, logger)

	// Name is required
	sh := &domain.Stakeholder{Name: ""}
	err := svc.Create(sh)
	if err == nil {
		t.Fatal("expected validation error for empty name")
	}
}

func TestStakeholderServiceUpdateTracksHistory(t *testing.T) {
	db := testDB(t)
	logger := slog.New(slog.NewTextHandler(os.Stderr, &slog.HandlerOptions{Level: slog.LevelWarn}))
	svc := service.NewStakeholderService(db, logger)

	sh := &domain.Stakeholder{
		Name:           "Track Changes",
		InfluenceLevel: domain.InfluenceLow,
		SupportLevel:   domain.SupportNeutral,
	}
	svc.Create(sh)

	// Update influence level
	sh.InfluenceLevel = domain.InfluenceHigh
	if err := svc.Update(sh); err != nil {
		t.Fatalf("Update failed: %v", err)
	}

	// Check history was recorded
	var count int
	db.Conn().QueryRow("SELECT COUNT(*) FROM stakeholder_history WHERE stakeholder_id = ?", sh.ID).Scan(&count)
	if count < 1 {
		t.Fatalf("expected at least 1 history record, got %d", count)
	}
}

func TestStakeholderServiceBulkUpdate(t *testing.T) {
	db := testDB(t)
	logger := slog.New(slog.NewTextHandler(os.Stderr, &slog.HandlerOptions{Level: slog.LevelWarn}))
	svc := service.NewStakeholderService(db, logger)

	// Create two stakeholders
	sh1 := &domain.Stakeholder{Name: "Bulk 1", InfluenceLevel: domain.InfluenceLow, SupportLevel: domain.SupportNeutral}
	sh2 := &domain.Stakeholder{Name: "Bulk 2", InfluenceLevel: domain.InfluenceLow, SupportLevel: domain.SupportNeutral}
	svc.Create(sh1)
	svc.Create(sh2)

	// Bulk update department
	err := svc.BulkUpdateField([]string{sh1.ID, sh2.ID}, "department", "Sales")
	if err != nil {
		t.Fatalf("BulkUpdateField failed: %v", err)
	}

	// Verify
	got1, _ := svc.GetByID(sh1.ID)
	got2, _ := svc.GetByID(sh2.ID)
	if got1.Department != "Sales" || got2.Department != "Sales" {
		t.Fatalf("expected department 'Sales', got '%s' and '%s'", got1.Department, got2.Department)
	}
}
