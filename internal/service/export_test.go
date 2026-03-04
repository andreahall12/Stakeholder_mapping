package service_test

import (
	"bytes"
	"encoding/json"
	"log/slog"
	"os"
	"strings"
	"testing"

	"github.com/andreahall12/stakeholder-tool/internal/domain"
	"github.com/andreahall12/stakeholder-tool/internal/service"
)

func TestExportStakeholdersCSV(t *testing.T) {
	db := testDB(t)
	logger := slog.New(slog.NewTextHandler(os.Stderr, &slog.HandlerOptions{Level: slog.LevelWarn}))

	// Create test data
	svc := service.NewStakeholderService(db, logger)
	svc.Create(&domain.Stakeholder{Name: "CSV Alice", Department: "Eng", InfluenceLevel: "high", SupportLevel: "champion"})
	svc.Create(&domain.Stakeholder{Name: "CSV Bob", Department: "Sales", InfluenceLevel: "low", SupportLevel: "neutral"})

	exportSvc := service.NewExportService(db, logger)

	var buf bytes.Buffer
	err := exportSvc.ExportStakeholdersCSV(&buf, "")
	if err != nil {
		t.Fatalf("ExportStakeholdersCSV failed: %v", err)
	}

	csv := buf.String()
	if !strings.Contains(csv, "CSV Alice") {
		t.Fatal("expected CSV to contain 'CSV Alice'")
	}
	if !strings.Contains(csv, "CSV Bob") {
		t.Fatal("expected CSV to contain 'CSV Bob'")
	}
	if !strings.Contains(csv, "Name") {
		t.Fatal("expected CSV to contain header 'Name'")
	}
}

func TestExportStakeholdersJSON(t *testing.T) {
	db := testDB(t)
	logger := slog.New(slog.NewTextHandler(os.Stderr, &slog.HandlerOptions{Level: slog.LevelWarn}))

	svc := service.NewStakeholderService(db, logger)
	svc.Create(&domain.Stakeholder{Name: "JSON User", InfluenceLevel: "medium", SupportLevel: "supporter"})

	exportSvc := service.NewExportService(db, logger)

	var buf bytes.Buffer
	err := exportSvc.ExportStakeholdersJSON(&buf, "")
	if err != nil {
		t.Fatalf("ExportStakeholdersJSON failed: %v", err)
	}

	var result []domain.Stakeholder
	if err := json.Unmarshal(buf.Bytes(), &result); err != nil {
		t.Fatalf("invalid JSON output: %v", err)
	}
	if len(result) != 1 || result[0].Name != "JSON User" {
		t.Fatalf("unexpected JSON result: %v", result)
	}
}

func TestImportStakeholdersCSV(t *testing.T) {
	db := testDB(t)
	logger := slog.New(slog.NewTextHandler(os.Stderr, &slog.HandlerOptions{Level: slog.LevelWarn}))

	csvData := `Name,Job Title,Department,Email,Influence Level,Support Level
Import Alice,CEO,Exec,alice@test.com,high,champion
Import Bob,CTO,Eng,bob@test.com,medium,supporter`

	exportSvc := service.NewExportService(db, logger)
	count, err := exportSvc.ImportStakeholdersCSV(strings.NewReader(csvData))
	if err != nil {
		t.Fatalf("ImportStakeholdersCSV failed: %v", err)
	}
	if count != 2 {
		t.Fatalf("expected 2 imported, got %d", count)
	}

	// Verify they exist
	svc := service.NewStakeholderService(db, logger)
	list, _ := svc.List(nil)
	if len(list) != 2 {
		t.Fatalf("expected 2 stakeholders, got %d", len(list))
	}
}
