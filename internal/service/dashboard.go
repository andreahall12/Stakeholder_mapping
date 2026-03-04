package service

import (
	"database/sql"
	"fmt"
	"log/slog"
	"time"

	"github.com/andreahall12/stakeholder-tool/internal/repository/sqlite"
)

// DashboardKPIs holds computed metrics for the project dashboard.
type DashboardKPIs struct {
	TotalStakeholders int            `json:"total_stakeholders"`
	ByInfluence       map[string]int `json:"by_influence"`
	BySupport         map[string]int `json:"by_support"`
	RACIGaps          int            `json:"raci_gaps"`
	Blockers          int            `json:"blockers"`
	OverdueContacts   int            `json:"overdue_contacts"`
}

// RecentEngagement holds a recent engagement log entry for display.
type RecentEngagement struct {
	StakeholderName string `json:"stakeholder_name"`
	Type            string `json:"type"`
	Date            string `json:"date"`
	Summary         string `json:"summary"`
	Sentiment       string `json:"sentiment"`
}

// DashboardService computes dashboard KPIs and summaries.
type DashboardService struct {
	db     *sqlite.DB
	logger *slog.Logger
}

// NewDashboardService creates a new DashboardService.
func NewDashboardService(db *sqlite.DB, logger *slog.Logger) *DashboardService {
	return &DashboardService{db: db, logger: logger}
}

// GetKPIs computes dashboard metrics for a given project.
func (s *DashboardService) GetKPIs(projectID string) (*DashboardKPIs, error) {
	kpis := &DashboardKPIs{
		ByInfluence: map[string]int{"high": 0, "medium": 0, "low": 0},
		BySupport:   map[string]int{"champion": 0, "supporter": 0, "neutral": 0, "resistant": 0},
	}

	// Total stakeholders and breakdowns
	rows, err := s.db.Conn().Query(`
		SELECT s.influence_level, s.support_level
		FROM stakeholders s
		JOIN project_stakeholders ps ON s.id = ps.stakeholder_id
		WHERE ps.project_id = ?`, projectID)
	if err != nil {
		return nil, fmt.Errorf("querying stakeholders: %w", err)
	}
	defer rows.Close()

	for rows.Next() {
		var influence, support string
		if err := rows.Scan(&influence, &support); err != nil {
			return nil, fmt.Errorf("scanning: %w", err)
		}
		kpis.TotalStakeholders++
		kpis.ByInfluence[influence]++
		kpis.BySupport[support]++
	}

	// Blockers: high influence + resistant or neutral
	kpis.Blockers = countBlockers(s.db.Conn(), projectID)

	// RACI gaps: workstreams missing R or A
	kpis.RACIGaps = countRACIGaps(s.db.Conn(), projectID)

	// Overdue contacts
	kpis.OverdueContacts = countOverdueContacts(s.db.Conn(), projectID)

	return kpis, nil
}

// GetRecentEngagements returns the most recent engagement logs for a project.
func (s *DashboardService) GetRecentEngagements(projectID string, limit int) ([]RecentEngagement, error) {
	if limit <= 0 {
		limit = 10
	}
	rows, err := s.db.Conn().Query(`
		SELECT s.name, e.type, e.date, e.summary, e.sentiment
		FROM engagement_logs e
		JOIN project_stakeholders ps ON e.project_stakeholder_id = ps.id
		JOIN stakeholders s ON ps.stakeholder_id = s.id
		WHERE ps.project_id = ?
		ORDER BY e.date DESC
		LIMIT ?`, projectID, limit)
	if err != nil {
		return nil, fmt.Errorf("querying engagements: %w", err)
	}
	defer rows.Close()

	var result []RecentEngagement
	for rows.Next() {
		var e RecentEngagement
		if err := rows.Scan(&e.StakeholderName, &e.Type, &e.Date, &e.Summary, &e.Sentiment); err != nil {
			return nil, fmt.Errorf("scanning: %w", err)
		}
		result = append(result, e)
	}
	return result, nil
}

func countBlockers(conn *sql.DB, projectID string) int {
	var count int
	row := conn.QueryRow(`
		SELECT COUNT(*)
		FROM stakeholders s
		JOIN project_stakeholders ps ON s.id = ps.stakeholder_id
		WHERE ps.project_id = ?
		  AND s.influence_level = 'high'
		  AND s.support_level IN ('resistant', 'neutral')`, projectID)
	row.Scan(&count)
	return count
}

func countRACIGaps(conn *sql.DB, projectID string) int {
	var count int
	// Workstreams missing an R or A role
	row := conn.QueryRow(`
		SELECT COUNT(*) FROM workstreams w
		WHERE w.project_id = ?
		  AND (
		    NOT EXISTS (SELECT 1 FROM raci_assignments ra
		               JOIN project_stakeholders ps ON ra.project_stakeholder_id = ps.id
		               WHERE ra.workstream_id = w.id AND ra.role = 'R')
		    OR NOT EXISTS (SELECT 1 FROM raci_assignments ra
		               JOIN project_stakeholders ps ON ra.project_stakeholder_id = ps.id
		               WHERE ra.workstream_id = w.id AND ra.role = 'A')
		  )`, projectID)
	row.Scan(&count)
	return count
}

func countOverdueContacts(conn *sql.DB, projectID string) int {
	var count int
	now := time.Now()

	rows, err := conn.Query(`
		SELECT c.frequency, c.last_contact_date
		FROM comm_plans c
		JOIN project_stakeholders ps ON c.project_stakeholder_id = ps.id
		WHERE ps.project_id = ? AND c.last_contact_date IS NOT NULL`, projectID)
	if err != nil {
		return 0
	}
	defer rows.Close()

	expectedDays := map[string]int{
		"daily": 1, "weekly": 7, "biweekly": 14,
		"monthly": 30, "quarterly": 90, "as-needed": 30,
	}

	for rows.Next() {
		var freq, lastContact string
		if err := rows.Scan(&freq, &lastContact); err != nil {
			continue
		}
		t, err := time.Parse("2006-01-02", lastContact)
		if err != nil {
			// Try datetime format
			t, err = time.Parse("2006-01-02T15:04:05", lastContact)
			if err != nil {
				continue
			}
		}
		daysSince := int(now.Sub(t).Hours() / 24)
		if expected, ok := expectedDays[freq]; ok && daysSince > expected {
			count++
		}
	}
	return count
}
