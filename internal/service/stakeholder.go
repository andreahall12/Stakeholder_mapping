// Package service contains business logic for the stakeholder tool.
// Services orchestrate repository calls, enforce validation, and compute derived data.
package service

import (
	"fmt"
	"log/slog"

	"github.com/go-playground/validator/v10"
	"github.com/google/uuid"

	"github.com/andreahall12/stakeholder-tool/internal/domain"
	"github.com/andreahall12/stakeholder-tool/internal/repository/sqlite"
)

var validate = validator.New()

// StakeholderService provides business operations for stakeholders.
type StakeholderService struct {
	repo   *sqlite.StakeholderRepo
	db     *sqlite.DB
	logger *slog.Logger
}

// NewStakeholderService creates a new StakeholderService.
func NewStakeholderService(db *sqlite.DB, logger *slog.Logger) *StakeholderService {
	return &StakeholderService{
		repo:   sqlite.NewStakeholderRepo(db, logger),
		db:     db,
		logger: logger,
	}
}

// Create validates and creates a new stakeholder.
func (s *StakeholderService) Create(sh *domain.Stakeholder) error {
	sh.ID = uuid.New().String()
	if sh.InfluenceLevel == "" {
		sh.InfluenceLevel = domain.InfluenceMedium
	}
	if sh.SupportLevel == "" {
		sh.SupportLevel = domain.SupportNeutral
	}
	if err := validate.Struct(sh); err != nil {
		return fmt.Errorf("validation: %w", err)
	}
	return s.repo.Create(sh)
}

// GetByID retrieves a stakeholder by ID.
func (s *StakeholderService) GetByID(id string) (*domain.Stakeholder, error) {
	return s.repo.GetByID(id)
}

// List returns stakeholders with optional filtering.
func (s *StakeholderService) List(filters map[string]string) ([]domain.Stakeholder, error) {
	return s.repo.List(filters)
}

// ListByProject returns stakeholders assigned to a project.
func (s *StakeholderService) ListByProject(projectID string) ([]domain.Stakeholder, error) {
	return s.repo.ListByProject(projectID)
}

// Update validates and updates a stakeholder, recording history for level changes.
func (s *StakeholderService) Update(sh *domain.Stakeholder) error {
	if err := validate.Struct(sh); err != nil {
		return fmt.Errorf("validation: %w", err)
	}

	// Check for influence/support level changes to record history
	existing, err := s.repo.GetByID(sh.ID)
	if err != nil {
		return fmt.Errorf("fetching existing: %w", err)
	}
	if existing == nil {
		return fmt.Errorf("stakeholder %s not found", sh.ID)
	}

	// Record history for level changes
	if existing.InfluenceLevel != sh.InfluenceLevel {
		s.recordHistory(sh.ID, "influenceLevel", string(existing.InfluenceLevel), string(sh.InfluenceLevel))
	}
	if existing.SupportLevel != sh.SupportLevel {
		s.recordHistory(sh.ID, "supportLevel", string(existing.SupportLevel), string(sh.SupportLevel))
	}

	return s.repo.Update(sh)
}

// Delete removes a stakeholder.
func (s *StakeholderService) Delete(id string) error {
	return s.repo.Delete(id)
}

// BulkUpdateField updates a single field for multiple stakeholders.
func (s *StakeholderService) BulkUpdateField(ids []string, field, value string) error {
	for _, id := range ids {
		sh, err := s.repo.GetByID(id)
		if err != nil || sh == nil {
			continue
		}
		switch field {
		case "influence_level":
			sh.InfluenceLevel = domain.InfluenceLevel(value)
		case "support_level":
			sh.SupportLevel = domain.SupportLevel(value)
		case "department":
			sh.Department = value
		default:
			return fmt.Errorf("unsupported bulk field: %s", field)
		}
		if err := s.Update(sh); err != nil {
			s.logger.Error("bulk update failed", "id", id, "error", err)
		}
	}
	return nil
}

func (s *StakeholderService) recordHistory(stakeholderID, field, oldVal, newVal string) {
	h := &domain.StakeholderHistory{
		ID:            uuid.New().String(),
		StakeholderID: stakeholderID,
		Field:         field,
		OldValue:      oldVal,
		NewValue:      newVal,
	}
	_, err := s.db.Conn().Exec(
		`INSERT INTO stakeholder_history (id, stakeholder_id, field, old_value, new_value) VALUES (?, ?, ?, ?, ?)`,
		h.ID, h.StakeholderID, h.Field, h.OldValue, h.NewValue,
	)
	if err != nil {
		s.logger.Error("failed to record history", "error", err)
	}
}
