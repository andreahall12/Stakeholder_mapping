package sqlite

import (
	"database/sql"
	"fmt"
	"log/slog"

	"github.com/andreahall12/stakeholder-tool/internal/domain"
)

// TagRepo provides CRUD operations for tags and stakeholder-tag assignments.
type TagRepo struct {
	db     *DB
	logger *slog.Logger
}

// NewTagRepo creates a new TagRepo.
func NewTagRepo(db *DB, logger *slog.Logger) *TagRepo {
	return &TagRepo{db: db, logger: logger}
}

// Create inserts a new tag.
func (r *TagRepo) Create(t *domain.Tag) error {
	_, err := r.db.Conn().Exec(
		`INSERT INTO tags (id, name, color) VALUES (?, ?, ?)`,
		t.ID, t.Name, t.Color,
	)
	if err != nil {
		return fmt.Errorf("creating tag: %w", err)
	}
	r.db.AuditLog("create", "tag", t.ID, t.Name)
	return nil
}

// GetByID retrieves a tag by ID.
func (r *TagRepo) GetByID(id string) (*domain.Tag, error) {
	row := r.db.Conn().QueryRow(`SELECT id, name, color FROM tags WHERE id = ?`, id)
	t := &domain.Tag{}
	err := row.Scan(&t.ID, &t.Name, &t.Color)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("getting tag %s: %w", id, err)
	}
	return t, nil
}

// ListAll returns all tags.
func (r *TagRepo) ListAll() ([]domain.Tag, error) {
	rows, err := r.db.Conn().Query(`SELECT id, name, color FROM tags ORDER BY name ASC`)
	if err != nil {
		return nil, fmt.Errorf("listing tags: %w", err)
	}
	defer rows.Close()

	var result []domain.Tag
	for rows.Next() {
		var t domain.Tag
		if err := rows.Scan(&t.ID, &t.Name, &t.Color); err != nil {
			return nil, fmt.Errorf("scanning tag: %w", err)
		}
		result = append(result, t)
	}
	return result, rows.Err()
}

// ListByStakeholder returns all tags for a stakeholder.
func (r *TagRepo) ListByStakeholder(stakeholderID string) ([]domain.Tag, error) {
	rows, err := r.db.Conn().Query(
		`SELECT t.id, t.name, t.color
		 FROM tags t
		 JOIN stakeholder_tags st ON t.id = st.tag_id
		 WHERE st.stakeholder_id = ?
		 ORDER BY t.name ASC`, stakeholderID,
	)
	if err != nil {
		return nil, fmt.Errorf("listing stakeholder tags: %w", err)
	}
	defer rows.Close()

	var result []domain.Tag
	for rows.Next() {
		var t domain.Tag
		if err := rows.Scan(&t.ID, &t.Name, &t.Color); err != nil {
			return nil, fmt.Errorf("scanning tag: %w", err)
		}
		result = append(result, t)
	}
	return result, rows.Err()
}

// AssignToStakeholder links a tag to a stakeholder.
func (r *TagRepo) AssignToStakeholder(stakeholderID, tagID string) error {
	_, err := r.db.Conn().Exec(
		`INSERT OR IGNORE INTO stakeholder_tags (stakeholder_id, tag_id) VALUES (?, ?)`,
		stakeholderID, tagID,
	)
	if err != nil {
		return fmt.Errorf("assigning tag to stakeholder: %w", err)
	}
	return nil
}

// RemoveFromStakeholder unlinks a tag from a stakeholder.
func (r *TagRepo) RemoveFromStakeholder(stakeholderID, tagID string) error {
	_, err := r.db.Conn().Exec(
		`DELETE FROM stakeholder_tags WHERE stakeholder_id = ? AND tag_id = ?`,
		stakeholderID, tagID,
	)
	if err != nil {
		return fmt.Errorf("removing tag from stakeholder: %w", err)
	}
	return nil
}

// Delete removes a tag.
func (r *TagRepo) Delete(id string) error {
	result, err := r.db.Conn().Exec("DELETE FROM tags WHERE id = ?", id)
	if err != nil {
		return fmt.Errorf("deleting tag: %w", err)
	}
	n, _ := result.RowsAffected()
	if n == 0 {
		return fmt.Errorf("tag %s not found", id)
	}
	r.db.AuditLog("delete", "tag", id, "")
	return nil
}
