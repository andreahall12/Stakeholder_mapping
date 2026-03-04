package sqlite_test

import (
	"log/slog"
	"os"
	"testing"

	"github.com/andreahall12/stakeholder-tool/internal/domain"
	"github.com/andreahall12/stakeholder-tool/internal/repository/sqlite"
)

func TestProjectCRUD(t *testing.T) {
	db := testDB(t)
	logger := slog.New(slog.NewTextHandler(os.Stderr, &slog.HandlerOptions{Level: slog.LevelWarn}))
	repo := sqlite.NewProjectRepo(db, logger)

	// Create
	p := &domain.Project{
		ID:          "proj-1",
		Name:        "Cloud Migration",
		Description: "Migrating to AWS",
		Status:      domain.ProjectActive,
	}
	if err := repo.Create(p); err != nil {
		t.Fatalf("Create failed: %v", err)
	}

	// Get by ID
	got, err := repo.GetByID("proj-1")
	if err != nil {
		t.Fatalf("GetByID failed: %v", err)
	}
	if got == nil || got.Name != "Cloud Migration" {
		t.Fatalf("unexpected project: %v", got)
	}

	// List
	list, err := repo.List()
	if err != nil {
		t.Fatalf("List failed: %v", err)
	}
	if len(list) != 1 {
		t.Fatalf("expected 1 project, got %d", len(list))
	}

	// ListWithDetails
	details, err := repo.ListWithDetails()
	if err != nil {
		t.Fatalf("ListWithDetails failed: %v", err)
	}
	if len(details) != 1 || details[0].StakeholderCount != 0 {
		t.Fatalf("unexpected details: %v", details)
	}

	// Update
	p.Status = domain.ProjectArchived
	if err := repo.Update(p); err != nil {
		t.Fatalf("Update failed: %v", err)
	}
	updated, _ := repo.GetByID("proj-1")
	if updated.Status != domain.ProjectArchived {
		t.Fatalf("expected archived status, got '%s'", updated.Status)
	}

	// Delete
	if err := repo.Delete("proj-1"); err != nil {
		t.Fatalf("Delete failed: %v", err)
	}
	deleted, _ := repo.GetByID("proj-1")
	if deleted != nil {
		t.Fatal("expected nil after delete")
	}
}

func TestProjectStakeholderAssignment(t *testing.T) {
	db := testDB(t)
	logger := slog.New(slog.NewTextHandler(os.Stderr, &slog.HandlerOptions{Level: slog.LevelWarn}))
	projRepo := sqlite.NewProjectRepo(db, logger)
	shRepo := sqlite.NewStakeholderRepo(db, logger)

	// Create project and stakeholder
	projRepo.Create(&domain.Project{ID: "proj-2", Name: "Test", Status: domain.ProjectActive})
	shRepo.Create(&domain.Stakeholder{
		ID: "sh-1", Name: "Bob", InfluenceLevel: domain.InfluenceMedium, SupportLevel: domain.SupportNeutral,
	})

	// Assign
	ps := &domain.ProjectStakeholder{
		ID: "ps-1", ProjectID: "proj-2", StakeholderID: "sh-1", ProjectFunction: "Sponsor",
	}
	if err := projRepo.AssignStakeholder(ps); err != nil {
		t.Fatalf("AssignStakeholder failed: %v", err)
	}

	// List by project
	stakeholders, err := shRepo.ListByProject("proj-2")
	if err != nil {
		t.Fatalf("ListByProject failed: %v", err)
	}
	if len(stakeholders) != 1 {
		t.Fatalf("expected 1 stakeholder in project, got %d", len(stakeholders))
	}

	// Verify ListWithDetails shows count
	details, _ := projRepo.ListWithDetails()
	if len(details) != 1 || details[0].StakeholderCount != 1 {
		t.Fatalf("expected stakeholder count 1, got %v", details)
	}

	// Unassign
	if err := projRepo.UnassignStakeholder("ps-1"); err != nil {
		t.Fatalf("UnassignStakeholder failed: %v", err)
	}
}
