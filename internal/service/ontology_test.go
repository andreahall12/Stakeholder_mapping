package service_test

import (
	"bytes"
	"log/slog"
	"os"
	"strings"
	"testing"

	"github.com/andreahall12/stakeholder-tool/internal/domain"
	"github.com/andreahall12/stakeholder-tool/internal/service"
)

func TestOntologyExportTurtle(t *testing.T) {
	db := testDB(t)
	logger := slog.New(slog.NewTextHandler(os.Stderr, &slog.HandlerOptions{Level: slog.LevelWarn}))

	// Create test data
	svc := service.NewStakeholderService(db, logger)
	svc.Create(&domain.Stakeholder{Name: "Onto Alice", Department: "Compliance", InfluenceLevel: "high", SupportLevel: "champion"})

	projSvc := service.NewProjectService(db, logger)
	proj := &domain.Project{Name: "Onto Project", Status: domain.ProjectActive}
	projSvc.Create(proj)

	ontSvc := service.NewOntologyService(db, logger)

	var buf bytes.Buffer
	err := ontSvc.ExportTurtle(&buf, "")
	if err != nil {
		t.Fatalf("ExportTurtle failed: %v", err)
	}

	turtle := buf.String()

	// Check prefixes
	if !strings.Contains(turtle, "@prefix co-bus:") {
		t.Fatal("expected co-bus prefix")
	}

	// Check stakeholder mapped to co-bus:Personnel
	if !strings.Contains(turtle, "co-bus:Personnel") {
		t.Fatal("expected co-bus:Personnel type")
	}

	// Check project mapped to co-bus:ComplianceProgram
	if !strings.Contains(turtle, "co-bus:ComplianceProgram") {
		t.Fatal("expected co-bus:ComplianceProgram type")
	}

	// Check stakeholder data
	if !strings.Contains(turtle, "Onto Alice") {
		t.Fatal("expected stakeholder name in output")
	}
}
