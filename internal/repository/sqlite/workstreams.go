package sqlite

import (
	"database/sql"
	"fmt"
	"log/slog"

	"github.com/andreahall12/stakeholder-tool/internal/domain"
)

// WorkstreamRepo provides CRUD operations for workstreams.
type WorkstreamRepo struct {
	db     *DB
	logger *slog.Logger
}

// NewWorkstreamRepo creates a new WorkstreamRepo.
func NewWorkstreamRepo(db *DB, logger *slog.Logger) *WorkstreamRepo {
	return &WorkstreamRepo{db: db, logger: logger}
}

// Create inserts a new workstream.
func (r *WorkstreamRepo) Create(w *domain.Workstream) error {
	_, err := r.db.Conn().Exec(
		`INSERT INTO workstreams (id, project_id, name, description) VALUES (?, ?, ?, ?)`,
		w.ID, w.ProjectID, w.Name, w.Description,
	)
	if err != nil {
		return fmt.Errorf("creating workstream: %w", err)
	}
	r.db.AuditLog("create", "workstream", w.ID, w.Name)
	return nil
}

// GetByID retrieves a workstream by ID.
func (r *WorkstreamRepo) GetByID(id string) (*domain.Workstream, error) {
	row := r.db.Conn().QueryRow(
		`SELECT id, project_id, name, description FROM workstreams WHERE id = ?`, id,
	)
	w := &domain.Workstream{}
	err := row.Scan(&w.ID, &w.ProjectID, &w.Name, &w.Description)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("getting workstream %s: %w", id, err)
	}
	return w, nil
}

// ListByProject returns all workstreams for a project.
func (r *WorkstreamRepo) ListByProject(projectID string) ([]domain.Workstream, error) {
	rows, err := r.db.Conn().Query(
		`SELECT id, project_id, name, description FROM workstreams WHERE project_id = ? ORDER BY name ASC`,
		projectID,
	)
	if err != nil {
		return nil, fmt.Errorf("listing workstreams: %w", err)
	}
	defer rows.Close()

	var result []domain.Workstream
	for rows.Next() {
		var w domain.Workstream
		if err := rows.Scan(&w.ID, &w.ProjectID, &w.Name, &w.Description); err != nil {
			return nil, fmt.Errorf("scanning workstream: %w", err)
		}
		result = append(result, w)
	}
	return result, rows.Err()
}

// Update modifies an existing workstream.
func (r *WorkstreamRepo) Update(w *domain.Workstream) error {
	result, err := r.db.Conn().Exec(
		`UPDATE workstreams SET name=?, description=? WHERE id=?`,
		w.Name, w.Description, w.ID,
	)
	if err != nil {
		return fmt.Errorf("updating workstream: %w", err)
	}
	n, _ := result.RowsAffected()
	if n == 0 {
		return fmt.Errorf("workstream %s not found", w.ID)
	}
	r.db.AuditLog("update", "workstream", w.ID, w.Name)
	return nil
}

// Delete removes a workstream by ID.
func (r *WorkstreamRepo) Delete(id string) error {
	result, err := r.db.Conn().Exec("DELETE FROM workstreams WHERE id = ?", id)
	if err != nil {
		return fmt.Errorf("deleting workstream: %w", err)
	}
	n, _ := result.RowsAffected()
	if n == 0 {
		return fmt.Errorf("workstream %s not found", id)
	}
	r.db.AuditLog("delete", "workstream", id, "")
	return nil
}
