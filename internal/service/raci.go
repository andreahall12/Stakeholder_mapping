package service

import (
	"fmt"
	"log/slog"

	"github.com/google/uuid"

	"github.com/andreahall12/stakeholder-tool/internal/domain"
	"github.com/andreahall12/stakeholder-tool/internal/repository/sqlite"
)

// RACIService provides business operations for RACI assignments.
type RACIService struct {
	repo   *sqlite.RACIRepo
	logger *slog.Logger
}

// NewRACIService creates a new RACIService.
func NewRACIService(db *sqlite.DB, logger *slog.Logger) *RACIService {
	return &RACIService{
		repo:   sqlite.NewRACIRepo(db, logger),
		logger: logger,
	}
}

// Create validates and creates a new RACI assignment.
func (s *RACIService) Create(a *domain.RACIAssignment) error {
	a.ID = uuid.New().String()
	if err := validate.Struct(a); err != nil {
		return fmt.Errorf("validation: %w", err)
	}
	return s.repo.Create(a)
}

// ListByProject returns RACI assignments with names for a project.
func (s *RACIService) ListByProject(projectID string) ([]domain.RACIWithNames, error) {
	return s.repo.ListByProject(projectID)
}

// Update changes a RACI assignment's role.
func (s *RACIService) Update(a *domain.RACIAssignment) error {
	if err := validate.Struct(a); err != nil {
		return fmt.Errorf("validation: %w", err)
	}
	return s.repo.Update(a)
}

// Delete removes a RACI assignment.
func (s *RACIService) Delete(id string) error {
	return s.repo.Delete(id)
}
