package sqlite

import (
	"database/sql"
	"fmt"
	"log/slog"

	"github.com/andreahall12/stakeholder-tool/internal/domain"
)

// RACIRepo provides CRUD operations for RACI assignments.
type RACIRepo struct {
	db     *DB
	logger *slog.Logger
}

// NewRACIRepo creates a new RACIRepo.
func NewRACIRepo(db *DB, logger *slog.Logger) *RACIRepo {
	return &RACIRepo{db: db, logger: logger}
}

// Create inserts a new RACI assignment.
func (r *RACIRepo) Create(a *domain.RACIAssignment) error {
	_, err := r.db.Conn().Exec(
		`INSERT INTO raci_assignments (id, project_stakeholder_id, workstream_id, role) VALUES (?, ?, ?, ?)`,
		a.ID, a.ProjectStakeholderID, a.WorkstreamID, a.Role,
	)
	if err != nil {
		return fmt.Errorf("creating RACI assignment: %w", err)
	}
	r.db.AuditLog("create", "raci_assignment", a.ID, string(a.Role))
	return nil
}

// GetByID retrieves a RACI assignment by ID.
func (r *RACIRepo) GetByID(id string) (*domain.RACIAssignment, error) {
	row := r.db.Conn().QueryRow(
		`SELECT id, project_stakeholder_id, workstream_id, role FROM raci_assignments WHERE id = ?`, id,
	)
	a := &domain.RACIAssignment{}
	err := row.Scan(&a.ID, &a.ProjectStakeholderID, &a.WorkstreamID, &a.Role)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("getting RACI assignment %s: %w", id, err)
	}
	return a, nil
}

// ListByProject returns all RACI assignments for a project with resolved names.
func (r *RACIRepo) ListByProject(projectID string) ([]domain.RACIWithNames, error) {
	rows, err := r.db.Conn().Query(`
		SELECT ra.id, ra.project_stakeholder_id, ra.workstream_id, ra.role,
		       s.name AS stakeholder_name, w.name AS workstream_name
		FROM raci_assignments ra
		JOIN project_stakeholders ps ON ra.project_stakeholder_id = ps.id
		JOIN stakeholders s ON ps.stakeholder_id = s.id
		JOIN workstreams w ON ra.workstream_id = w.id
		WHERE ps.project_id = ?
		ORDER BY w.name ASC, s.name ASC`, projectID,
	)
	if err != nil {
		return nil, fmt.Errorf("listing RACI assignments: %w", err)
	}
	defer rows.Close()

	var result []domain.RACIWithNames
	for rows.Next() {
		var rw domain.RACIWithNames
		if err := rows.Scan(&rw.ID, &rw.ProjectStakeholderID, &rw.WorkstreamID, &rw.Role,
			&rw.StakeholderName, &rw.WorkstreamName); err != nil {
			return nil, fmt.Errorf("scanning RACI: %w", err)
		}
		result = append(result, rw)
	}
	return result, rows.Err()
}

// Update modifies a RACI assignment's role.
func (r *RACIRepo) Update(a *domain.RACIAssignment) error {
	result, err := r.db.Conn().Exec(
		`UPDATE raci_assignments SET role=? WHERE id=?`, a.Role, a.ID,
	)
	if err != nil {
		return fmt.Errorf("updating RACI assignment: %w", err)
	}
	n, _ := result.RowsAffected()
	if n == 0 {
		return fmt.Errorf("RACI assignment %s not found", a.ID)
	}
	r.db.AuditLog("update", "raci_assignment", a.ID, string(a.Role))
	return nil
}

// Delete removes a RACI assignment.
func (r *RACIRepo) Delete(id string) error {
	result, err := r.db.Conn().Exec("DELETE FROM raci_assignments WHERE id = ?", id)
	if err != nil {
		return fmt.Errorf("deleting RACI assignment: %w", err)
	}
	n, _ := result.RowsAffected()
	if n == 0 {
		return fmt.Errorf("RACI assignment %s not found", id)
	}
	r.db.AuditLog("delete", "raci_assignment", id, "")
	return nil
}
