package service

import (
	"fmt"
	"log/slog"

	"github.com/google/uuid"

	"github.com/andreahall12/stakeholder-tool/internal/domain"
	"github.com/andreahall12/stakeholder-tool/internal/repository/sqlite"
)

// ProjectService provides business operations for projects.
type ProjectService struct {
	repo   *sqlite.ProjectRepo
	db     *sqlite.DB
	logger *slog.Logger
}

// NewProjectService creates a new ProjectService.
func NewProjectService(db *sqlite.DB, logger *slog.Logger) *ProjectService {
	return &ProjectService{
		repo:   sqlite.NewProjectRepo(db, logger),
		db:     db,
		logger: logger,
	}
}

// Create validates and creates a new project.
func (s *ProjectService) Create(p *domain.Project) error {
	p.ID = uuid.New().String()
	if p.Status == "" {
		p.Status = domain.ProjectActive
	}
	if err := validate.Struct(p); err != nil {
		return fmt.Errorf("validation: %w", err)
	}
	return s.repo.Create(p)
}

// GetByID retrieves a project by ID.
func (s *ProjectService) GetByID(id string) (*domain.Project, error) {
	return s.repo.GetByID(id)
}

// List returns all projects.
func (s *ProjectService) List() ([]domain.Project, error) {
	return s.repo.List()
}

// ListWithDetails returns projects with computed counts.
func (s *ProjectService) ListWithDetails() ([]domain.ProjectWithDetails, error) {
	return s.repo.ListWithDetails()
}

// Update validates and updates a project.
func (s *ProjectService) Update(p *domain.Project) error {
	if err := validate.Struct(p); err != nil {
		return fmt.Errorf("validation: %w", err)
	}
	return s.repo.Update(p)
}

// Delete removes a project.
func (s *ProjectService) Delete(id string) error {
	return s.repo.Delete(id)
}

// AssignStakeholder links a stakeholder to a project.
func (s *ProjectService) AssignStakeholder(projectID, stakeholderID, function string) error {
	ps := &domain.ProjectStakeholder{
		ID:              uuid.New().String(),
		ProjectID:       projectID,
		StakeholderID:   stakeholderID,
		ProjectFunction: function,
	}
	return s.repo.AssignStakeholder(ps)
}
