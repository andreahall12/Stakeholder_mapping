package sqlite

import (
	"database/sql"
	"fmt"
	"log/slog"
	"strings"

	"github.com/andreahall12/stakeholder-tool/internal/domain"
)

// StakeholderRepo provides CRUD operations for stakeholders.
type StakeholderRepo struct {
	db     *DB
	logger *slog.Logger
}

// NewStakeholderRepo creates a new StakeholderRepo.
func NewStakeholderRepo(db *DB, logger *slog.Logger) *StakeholderRepo {
	return &StakeholderRepo{db: db, logger: logger}
}

// Create inserts a new stakeholder.
func (r *StakeholderRepo) Create(s *domain.Stakeholder) error {
	_, err := r.db.Conn().Exec(
		`INSERT INTO stakeholders (id, name, job_title, department, email, slack, influence_level, support_level, notes)
		 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		s.ID, s.Name, s.JobTitle, s.Department, s.Email, s.Slack, s.InfluenceLevel, s.SupportLevel, s.Notes,
	)
	if err != nil {
		return fmt.Errorf("creating stakeholder: %w", err)
	}
	r.db.AuditLog("create", "stakeholder", s.ID, s.Name)
	return nil
}

// GetByID retrieves a stakeholder by ID.
func (r *StakeholderRepo) GetByID(id string) (*domain.Stakeholder, error) {
	row := r.db.Conn().QueryRow(
		`SELECT id, name, job_title, department, email, slack, influence_level, support_level, notes
		 FROM stakeholders WHERE id = ?`, id,
	)
	s := &domain.Stakeholder{}
	err := row.Scan(&s.ID, &s.Name, &s.JobTitle, &s.Department, &s.Email, &s.Slack,
		&s.InfluenceLevel, &s.SupportLevel, &s.Notes)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("getting stakeholder %s: %w", id, err)
	}
	return s, nil
}

// List returns all stakeholders, optionally filtered.
func (r *StakeholderRepo) List(filters map[string]string) ([]domain.Stakeholder, error) {
	query := `SELECT id, name, job_title, department, email, slack, influence_level, support_level, notes
		FROM stakeholders WHERE 1=1`
	var args []interface{}

	if v, ok := filters["influence_level"]; ok && v != "" {
		query += " AND influence_level = ?"
		args = append(args, v)
	}
	if v, ok := filters["support_level"]; ok && v != "" {
		query += " AND support_level = ?"
		args = append(args, v)
	}
	if v, ok := filters["department"]; ok && v != "" {
		query += " AND department = ?"
		args = append(args, v)
	}
	if v, ok := filters["search"]; ok && v != "" {
		query += " AND (LOWER(name) LIKE ? OR LOWER(job_title) LIKE ? OR LOWER(department) LIKE ?)"
		term := "%" + strings.ToLower(v) + "%"
		args = append(args, term, term, term)
	}

	query += " ORDER BY name ASC"

	rows, err := r.db.Conn().Query(query, args...)
	if err != nil {
		return nil, fmt.Errorf("listing stakeholders: %w", err)
	}
	defer rows.Close()

	var result []domain.Stakeholder
	for rows.Next() {
		var s domain.Stakeholder
		if err := rows.Scan(&s.ID, &s.Name, &s.JobTitle, &s.Department, &s.Email, &s.Slack,
			&s.InfluenceLevel, &s.SupportLevel, &s.Notes); err != nil {
			return nil, fmt.Errorf("scanning stakeholder: %w", err)
		}
		result = append(result, s)
	}
	return result, rows.Err()
}

// ListByProject returns stakeholders assigned to a project.
func (r *StakeholderRepo) ListByProject(projectID string) ([]domain.Stakeholder, error) {
	rows, err := r.db.Conn().Query(
		`SELECT s.id, s.name, s.job_title, s.department, s.email, s.slack,
		        s.influence_level, s.support_level, s.notes
		 FROM stakeholders s
		 JOIN project_stakeholders ps ON s.id = ps.stakeholder_id
		 WHERE ps.project_id = ?
		 ORDER BY s.name ASC`, projectID,
	)
	if err != nil {
		return nil, fmt.Errorf("listing project stakeholders: %w", err)
	}
	defer rows.Close()

	var result []domain.Stakeholder
	for rows.Next() {
		var s domain.Stakeholder
		if err := rows.Scan(&s.ID, &s.Name, &s.JobTitle, &s.Department, &s.Email, &s.Slack,
			&s.InfluenceLevel, &s.SupportLevel, &s.Notes); err != nil {
			return nil, fmt.Errorf("scanning stakeholder: %w", err)
		}
		result = append(result, s)
	}
	return result, rows.Err()
}

// Update modifies an existing stakeholder.
func (r *StakeholderRepo) Update(s *domain.Stakeholder) error {
	result, err := r.db.Conn().Exec(
		`UPDATE stakeholders SET name=?, job_title=?, department=?, email=?, slack=?,
		 influence_level=?, support_level=?, notes=? WHERE id=?`,
		s.Name, s.JobTitle, s.Department, s.Email, s.Slack,
		s.InfluenceLevel, s.SupportLevel, s.Notes, s.ID,
	)
	if err != nil {
		return fmt.Errorf("updating stakeholder: %w", err)
	}
	n, _ := result.RowsAffected() //nolint:errcheck // SQLite driver never returns error here
	if n == 0 {
		return fmt.Errorf("stakeholder %s not found", s.ID)
	}
	r.db.AuditLog("update", "stakeholder", s.ID, s.Name)
	return nil
}

// Delete removes a stakeholder by ID. Cascade deletes handle related records.
func (r *StakeholderRepo) Delete(id string) error {
	result, err := r.db.Conn().Exec("DELETE FROM stakeholders WHERE id = ?", id)
	if err != nil {
		return fmt.Errorf("deleting stakeholder: %w", err)
	}
	n, _ := result.RowsAffected() //nolint:errcheck // SQLite driver never returns error here
	if n == 0 {
		return fmt.Errorf("stakeholder %s not found", id)
	}
	r.db.AuditLog("delete", "stakeholder", id, "")
	return nil
}
