package sqlite

import (
	"database/sql"
	"fmt"
	"log/slog"

	"github.com/andreahall12/stakeholder-tool/internal/domain"
)

// EngagementRepo provides CRUD operations for engagement logs.
type EngagementRepo struct {
	db     *DB
	logger *slog.Logger
}

// NewEngagementRepo creates a new EngagementRepo.
func NewEngagementRepo(db *DB, logger *slog.Logger) *EngagementRepo {
	return &EngagementRepo{db: db, logger: logger}
}

// Create inserts a new engagement log entry.
func (r *EngagementRepo) Create(e *domain.EngagementLog) error {
	_, err := r.db.Conn().Exec(
		`INSERT INTO engagement_logs (id, project_stakeholder_id, date, type, summary, sentiment)
		 VALUES (?, ?, ?, ?, ?, ?)`,
		e.ID, e.ProjectStakeholderID, e.Date, e.Type, e.Summary, e.Sentiment,
	)
	if err != nil {
		return fmt.Errorf("creating engagement log: %w", err)
	}
	r.db.AuditLog("create", "engagement_log", e.ID, string(e.Type))
	return nil
}

// GetByID retrieves an engagement log by ID.
func (r *EngagementRepo) GetByID(id string) (*domain.EngagementLog, error) {
	row := r.db.Conn().QueryRow(
		`SELECT id, project_stakeholder_id, date, type, summary, sentiment
		 FROM engagement_logs WHERE id = ?`, id,
	)
	e := &domain.EngagementLog{}
	err := row.Scan(&e.ID, &e.ProjectStakeholderID, &e.Date, &e.Type, &e.Summary, &e.Sentiment)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("getting engagement log %s: %w", id, err)
	}
	return e, nil
}

// ListByProjectStakeholder returns engagement logs for a specific project-stakeholder.
func (r *EngagementRepo) ListByProjectStakeholder(psID string) ([]domain.EngagementLog, error) {
	rows, err := r.db.Conn().Query(
		`SELECT id, project_stakeholder_id, date, type, summary, sentiment
		 FROM engagement_logs
		 WHERE project_stakeholder_id = ?
		 ORDER BY date DESC`, psID,
	)
	if err != nil {
		return nil, fmt.Errorf("listing engagement logs: %w", err)
	}
	defer rows.Close()

	var result []domain.EngagementLog
	for rows.Next() {
		var e domain.EngagementLog
		if err := rows.Scan(&e.ID, &e.ProjectStakeholderID, &e.Date, &e.Type,
			&e.Summary, &e.Sentiment); err != nil {
			return nil, fmt.Errorf("scanning engagement log: %w", err)
		}
		result = append(result, e)
	}
	return result, rows.Err()
}

// Delete removes an engagement log entry.
func (r *EngagementRepo) Delete(id string) error {
	result, err := r.db.Conn().Exec("DELETE FROM engagement_logs WHERE id = ?", id)
	if err != nil {
		return fmt.Errorf("deleting engagement log: %w", err)
	}
	n, _ := result.RowsAffected()
	if n == 0 {
		return fmt.Errorf("engagement log %s not found", id)
	}
	r.db.AuditLog("delete", "engagement_log", id, "")
	return nil
}
