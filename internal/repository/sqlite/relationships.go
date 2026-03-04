package sqlite

import (
	"database/sql"
	"fmt"
	"log/slog"

	"github.com/andreahall12/stakeholder-tool/internal/domain"
)

// RelationshipRepo provides CRUD operations for stakeholder relationships.
type RelationshipRepo struct {
	db     *DB
	logger *slog.Logger
}

// NewRelationshipRepo creates a new RelationshipRepo.
func NewRelationshipRepo(db *DB, logger *slog.Logger) *RelationshipRepo {
	return &RelationshipRepo{db: db, logger: logger}
}

// Create inserts a new relationship.
func (r *RelationshipRepo) Create(rel *domain.Relationship) error {
	_, err := r.db.Conn().Exec(
		`INSERT INTO relationships (id, from_stakeholder_id, to_stakeholder_id, type, strength, notes)
		 VALUES (?, ?, ?, ?, ?, ?)`,
		rel.ID, rel.FromStakeholderID, rel.ToStakeholderID, rel.Type, rel.Strength, rel.Notes,
	)
	if err != nil {
		return fmt.Errorf("creating relationship: %w", err)
	}
	r.db.AuditLog("create", "relationship", rel.ID, string(rel.Type))
	return nil
}

// GetByID retrieves a relationship by ID.
func (r *RelationshipRepo) GetByID(id string) (*domain.Relationship, error) {
	row := r.db.Conn().QueryRow(
		`SELECT id, from_stakeholder_id, to_stakeholder_id, type, strength, notes
		 FROM relationships WHERE id = ?`, id,
	)
	rel := &domain.Relationship{}
	err := row.Scan(&rel.ID, &rel.FromStakeholderID, &rel.ToStakeholderID,
		&rel.Type, &rel.Strength, &rel.Notes)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("getting relationship %s: %w", id, err)
	}
	return rel, nil
}

// ListAll returns all relationships.
func (r *RelationshipRepo) ListAll() ([]domain.Relationship, error) {
	rows, err := r.db.Conn().Query(
		`SELECT id, from_stakeholder_id, to_stakeholder_id, type, strength, notes
		 FROM relationships ORDER BY type ASC`,
	)
	if err != nil {
		return nil, fmt.Errorf("listing relationships: %w", err)
	}
	defer rows.Close()

	var result []domain.Relationship
	for rows.Next() {
		var rel domain.Relationship
		if err := rows.Scan(&rel.ID, &rel.FromStakeholderID, &rel.ToStakeholderID,
			&rel.Type, &rel.Strength, &rel.Notes); err != nil {
			return nil, fmt.Errorf("scanning relationship: %w", err)
		}
		result = append(result, rel)
	}
	return result, rows.Err()
}

// ListByStakeholder returns all relationships involving a stakeholder.
func (r *RelationshipRepo) ListByStakeholder(stakeholderID string) ([]domain.Relationship, error) {
	rows, err := r.db.Conn().Query(
		`SELECT id, from_stakeholder_id, to_stakeholder_id, type, strength, notes
		 FROM relationships
		 WHERE from_stakeholder_id = ? OR to_stakeholder_id = ?
		 ORDER BY type ASC`, stakeholderID, stakeholderID,
	)
	if err != nil {
		return nil, fmt.Errorf("listing stakeholder relationships: %w", err)
	}
	defer rows.Close()

	var result []domain.Relationship
	for rows.Next() {
		var rel domain.Relationship
		if err := rows.Scan(&rel.ID, &rel.FromStakeholderID, &rel.ToStakeholderID,
			&rel.Type, &rel.Strength, &rel.Notes); err != nil {
			return nil, fmt.Errorf("scanning relationship: %w", err)
		}
		result = append(result, rel)
	}
	return result, rows.Err()
}

// Delete removes a relationship.
func (r *RelationshipRepo) Delete(id string) error {
	result, err := r.db.Conn().Exec("DELETE FROM relationships WHERE id = ?", id)
	if err != nil {
		return fmt.Errorf("deleting relationship: %w", err)
	}
	n, _ := result.RowsAffected()
	if n == 0 {
		return fmt.Errorf("relationship %s not found", id)
	}
	r.db.AuditLog("delete", "relationship", id, "")
	return nil
}
