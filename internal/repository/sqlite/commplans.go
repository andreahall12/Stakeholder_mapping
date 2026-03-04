package sqlite

import (
	"database/sql"
	"fmt"
	"log/slog"
	"time"

	"github.com/andreahall12/stakeholder-tool/internal/domain"
)

// CommPlanRepo provides CRUD operations for communication plans.
type CommPlanRepo struct {
	db     *DB
	logger *slog.Logger
}

// NewCommPlanRepo creates a new CommPlanRepo.
func NewCommPlanRepo(db *DB, logger *slog.Logger) *CommPlanRepo {
	return &CommPlanRepo{db: db, logger: logger}
}

// Create inserts a new communication plan.
func (r *CommPlanRepo) Create(cp *domain.CommunicationPlan) error {
	_, err := r.db.Conn().Exec(
		`INSERT INTO comm_plans (id, project_stakeholder_id, channel, frequency, notes, last_contact_date)
		 VALUES (?, ?, ?, ?, ?, ?)`,
		cp.ID, cp.ProjectStakeholderID, cp.Channel, cp.Frequency, cp.Notes, cp.LastContactDate,
	)
	if err != nil {
		return fmt.Errorf("creating comm plan: %w", err)
	}
	r.db.AuditLog("create", "comm_plan", cp.ID, string(cp.Channel))
	return nil
}

// GetByID retrieves a communication plan by ID.
func (r *CommPlanRepo) GetByID(id string) (*domain.CommunicationPlan, error) {
	row := r.db.Conn().QueryRow(
		`SELECT id, project_stakeholder_id, channel, frequency, notes, last_contact_date
		 FROM comm_plans WHERE id = ?`, id,
	)
	cp := &domain.CommunicationPlan{}
	var lastContact sql.NullString
	err := row.Scan(&cp.ID, &cp.ProjectStakeholderID, &cp.Channel, &cp.Frequency,
		&cp.Notes, &lastContact)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("getting comm plan %s: %w", id, err)
	}
	return cp, nil
}

// ListByProjectStakeholder returns comm plans for a project-stakeholder.
func (r *CommPlanRepo) ListByProjectStakeholder(psID string) ([]domain.CommunicationPlan, error) {
	rows, err := r.db.Conn().Query(
		`SELECT id, project_stakeholder_id, channel, frequency, notes, last_contact_date
		 FROM comm_plans
		 WHERE project_stakeholder_id = ?
		 ORDER BY channel ASC`, psID,
	)
	if err != nil {
		return nil, fmt.Errorf("listing comm plans: %w", err)
	}
	defer rows.Close()

	var result []domain.CommunicationPlan
	for rows.Next() {
		var cp domain.CommunicationPlan
		var lastContact sql.NullString
		if err := rows.Scan(&cp.ID, &cp.ProjectStakeholderID, &cp.Channel, &cp.Frequency,
			&cp.Notes, &lastContact); err != nil {
			return nil, fmt.Errorf("scanning comm plan: %w", err)
		}
		result = append(result, cp)
	}
	return result, rows.Err()
}

// CommPlanWithName extends CommunicationPlan with the stakeholder's name.
type CommPlanWithName struct {
	domain.CommunicationPlan
	StakeholderName string `json:"stakeholder_name"`
}

// ListByProject returns all comm plans for a project, with stakeholder names.
func (r *CommPlanRepo) ListByProject(projectID string) ([]CommPlanWithName, error) {
	rows, err := r.db.Conn().Query(
		`SELECT cp.id, cp.project_stakeholder_id, cp.channel, cp.frequency, cp.notes, cp.last_contact_date,
		        s.name
		 FROM comm_plans cp
		 JOIN project_stakeholders ps ON cp.project_stakeholder_id = ps.id
		 JOIN stakeholders s ON ps.stakeholder_id = s.id
		 WHERE ps.project_id = ?
		 ORDER BY s.name ASC`, projectID,
	)
	if err != nil {
		return nil, fmt.Errorf("listing comm plans by project: %w", err)
	}
	defer rows.Close()

	var result []CommPlanWithName
	for rows.Next() {
		var cp CommPlanWithName
		var lastContact sql.NullString
		if err := rows.Scan(&cp.ID, &cp.ProjectStakeholderID, &cp.Channel, &cp.Frequency,
			&cp.Notes, &lastContact, &cp.StakeholderName); err != nil {
			return nil, fmt.Errorf("scanning comm plan: %w", err)
		}
		if lastContact.Valid {
			t, err := time.Parse("2006-01-02", lastContact.String)
			if err == nil && !t.IsZero() {
				cp.LastContactDate = &t
			}
		}
		result = append(result, cp)
	}
	return result, rows.Err()
}

// Update updates a communication plan's channel, frequency, and notes.
func (r *CommPlanRepo) Update(cp *domain.CommunicationPlan) error {
	_, err := r.db.Conn().Exec(
		`UPDATE comm_plans SET channel = ?, frequency = ?, notes = ? WHERE id = ?`,
		cp.Channel, cp.Frequency, cp.Notes, cp.ID,
	)
	if err != nil {
		return fmt.Errorf("updating comm plan: %w", err)
	}
	r.db.AuditLog("update", "comm_plan", cp.ID, string(cp.Channel))
	return nil
}

// UpdateLastContact updates the last contact date.
func (r *CommPlanRepo) UpdateLastContact(id, date string) error {
	_, err := r.db.Conn().Exec(
		`UPDATE comm_plans SET last_contact_date = ? WHERE id = ?`, date, id,
	)
	if err != nil {
		return fmt.Errorf("updating last contact: %w", err)
	}
	return nil
}

// Delete removes a communication plan.
func (r *CommPlanRepo) Delete(id string) error {
	result, err := r.db.Conn().Exec("DELETE FROM comm_plans WHERE id = ?", id)
	if err != nil {
		return fmt.Errorf("deleting comm plan: %w", err)
	}
	n, _ := result.RowsAffected() //nolint:errcheck // SQLite driver never returns error here
	if n == 0 {
		return fmt.Errorf("comm plan %s not found", id)
	}
	r.db.AuditLog("delete", "comm_plan", id, "")
	return nil
}
