package sqlite

import (
	"database/sql"
	"fmt"
	"log/slog"

	"github.com/andreahall12/stakeholder-tool/internal/domain"
)

// ProjectRepo provides CRUD operations for projects.
type ProjectRepo struct {
	db     *DB
	logger *slog.Logger
}

// NewProjectRepo creates a new ProjectRepo.
func NewProjectRepo(db *DB, logger *slog.Logger) *ProjectRepo {
	return &ProjectRepo{db: db, logger: logger}
}

// Create inserts a new project.
func (r *ProjectRepo) Create(p *domain.Project) error {
	_, err := r.db.Conn().Exec(
		`INSERT INTO projects (id, name, description, status) VALUES (?, ?, ?, ?)`,
		p.ID, p.Name, p.Description, p.Status,
	)
	if err != nil {
		return fmt.Errorf("creating project: %w", err)
	}
	r.db.AuditLog("create", "project", p.ID, p.Name)
	return nil
}

// GetByID retrieves a project by ID.
func (r *ProjectRepo) GetByID(id string) (*domain.Project, error) {
	row := r.db.Conn().QueryRow(
		`SELECT id, name, description, status, created_at FROM projects WHERE id = ?`, id,
	)
	p := &domain.Project{}
	var createdAt string
	err := row.Scan(&p.ID, &p.Name, &p.Description, &p.Status, &createdAt)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("getting project %s: %w", id, err)
	}
	return p, nil
}

// List returns all projects ordered by creation date.
func (r *ProjectRepo) List() ([]domain.Project, error) {
	rows, err := r.db.Conn().Query(
		`SELECT id, name, description, status, created_at FROM projects ORDER BY created_at DESC`,
	)
	if err != nil {
		return nil, fmt.Errorf("listing projects: %w", err)
	}
	defer rows.Close()

	var result []domain.Project
	for rows.Next() {
		var p domain.Project
		var createdAt string
		if err := rows.Scan(&p.ID, &p.Name, &p.Description, &p.Status, &createdAt); err != nil {
			return nil, fmt.Errorf("scanning project: %w", err)
		}
		result = append(result, p)
	}
	return result, rows.Err()
}

// ListWithDetails returns projects with workstream and stakeholder counts.
func (r *ProjectRepo) ListWithDetails() ([]domain.ProjectWithDetails, error) {
	rows, err := r.db.Conn().Query(`
		SELECT p.id, p.name, p.description, p.status, p.created_at,
		       (SELECT COUNT(*) FROM workstreams WHERE project_id = p.id) as ws_count,
		       (SELECT COUNT(*) FROM project_stakeholders WHERE project_id = p.id) as sh_count
		FROM projects p ORDER BY p.created_at DESC`,
	)
	if err != nil {
		return nil, fmt.Errorf("listing projects with details: %w", err)
	}
	defer rows.Close()

	var result []domain.ProjectWithDetails
	for rows.Next() {
		var pd domain.ProjectWithDetails
		var createdAt string
		if err := rows.Scan(&pd.ID, &pd.Name, &pd.Description, &pd.Status, &createdAt,
			&pd.WorkstreamCount, &pd.StakeholderCount); err != nil {
			return nil, fmt.Errorf("scanning project: %w", err)
		}
		result = append(result, pd)
	}
	return result, rows.Err()
}

// Update modifies an existing project.
func (r *ProjectRepo) Update(p *domain.Project) error {
	result, err := r.db.Conn().Exec(
		`UPDATE projects SET name=?, description=?, status=? WHERE id=?`,
		p.Name, p.Description, p.Status, p.ID,
	)
	if err != nil {
		return fmt.Errorf("updating project: %w", err)
	}
	n, _ := result.RowsAffected() //nolint:errcheck // SQLite driver never returns error here
	if n == 0 {
		return fmt.Errorf("project %s not found", p.ID)
	}
	r.db.AuditLog("update", "project", p.ID, p.Name)
	return nil
}

// Delete removes a project by ID.
func (r *ProjectRepo) Delete(id string) error {
	result, err := r.db.Conn().Exec("DELETE FROM projects WHERE id = ?", id)
	if err != nil {
		return fmt.Errorf("deleting project: %w", err)
	}
	n, _ := result.RowsAffected() //nolint:errcheck // SQLite driver never returns error here
	if n == 0 {
		return fmt.Errorf("project %s not found", id)
	}
	r.db.AuditLog("delete", "project", id, "")
	return nil
}

// AssignStakeholder links a stakeholder to a project.
func (r *ProjectRepo) AssignStakeholder(ps *domain.ProjectStakeholder) error {
	_, err := r.db.Conn().Exec(
		`INSERT INTO project_stakeholders (id, project_id, stakeholder_id, project_function)
		 VALUES (?, ?, ?, ?)`,
		ps.ID, ps.ProjectID, ps.StakeholderID, ps.ProjectFunction,
	)
	if err != nil {
		return fmt.Errorf("assigning stakeholder to project: %w", err)
	}
	r.db.AuditLog("assign", "project_stakeholder", ps.ID,
		fmt.Sprintf("project=%s stakeholder=%s", ps.ProjectID, ps.StakeholderID))
	return nil
}

// UnassignStakeholder removes a stakeholder from a project.
func (r *ProjectRepo) UnassignStakeholder(id string) error {
	_, err := r.db.Conn().Exec("DELETE FROM project_stakeholders WHERE id = ?", id)
	if err != nil {
		return fmt.Errorf("unassigning stakeholder: %w", err)
	}
	r.db.AuditLog("unassign", "project_stakeholder", id, "")
	return nil
}
