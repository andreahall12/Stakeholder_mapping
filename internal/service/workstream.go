package service

import (
	"fmt"
	"log/slog"

	"github.com/google/uuid"

	"github.com/andreahall12/stakeholder-tool/internal/domain"
	"github.com/andreahall12/stakeholder-tool/internal/repository/sqlite"
)

// WorkstreamService provides business operations for workstreams.
type WorkstreamService struct {
	repo   *sqlite.WorkstreamRepo
	logger *slog.Logger
}

// NewWorkstreamService creates a new WorkstreamService.
func NewWorkstreamService(db *sqlite.DB, logger *slog.Logger) *WorkstreamService {
	return &WorkstreamService{
		repo:   sqlite.NewWorkstreamRepo(db, logger),
		logger: logger,
	}
}

// Create validates and creates a new workstream.
func (s *WorkstreamService) Create(w *domain.Workstream) error {
	w.ID = uuid.New().String()
	if err := validate.Struct(w); err != nil {
		return fmt.Errorf("validation: %w", err)
	}
	return s.repo.Create(w)
}

// GetByID retrieves a workstream by ID.
func (s *WorkstreamService) GetByID(id string) (*domain.Workstream, error) {
	return s.repo.GetByID(id)
}

// ListByProject returns workstreams for a project.
func (s *WorkstreamService) ListByProject(projectID string) ([]domain.Workstream, error) {
	return s.repo.ListByProject(projectID)
}

// Update validates and updates a workstream.
func (s *WorkstreamService) Update(w *domain.Workstream) error {
	if err := validate.Struct(w); err != nil {
		return fmt.Errorf("validation: %w", err)
	}
	return s.repo.Update(w)
}

// Delete removes a workstream.
func (s *WorkstreamService) Delete(id string) error {
	return s.repo.Delete(id)
}
