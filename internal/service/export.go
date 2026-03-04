package service

import (
	"encoding/csv"
	"encoding/json"
	"fmt"
	"io"
	"log/slog"
	"strings"
	"time"

	"github.com/andreahall12/stakeholder-tool/internal/domain"
	"github.com/andreahall12/stakeholder-tool/internal/repository/sqlite"
)

// ExportService provides CSV, JSON, and data export/import functionality.
type ExportService struct {
	stakeholders  *sqlite.StakeholderRepo
	projects      *sqlite.ProjectRepo
	workstreams   *sqlite.WorkstreamRepo
	raci          *sqlite.RACIRepo
	relationships *sqlite.RelationshipRepo
	tags          *sqlite.TagRepo
	engagements   *sqlite.EngagementRepo
	commPlans     *sqlite.CommPlanRepo
	db            *sqlite.DB
	logger        *slog.Logger
}

// NewExportService creates a new ExportService.
func NewExportService(db *sqlite.DB, logger *slog.Logger) *ExportService {
	return &ExportService{
		stakeholders:  sqlite.NewStakeholderRepo(db, logger),
		projects:      sqlite.NewProjectRepo(db, logger),
		workstreams:   sqlite.NewWorkstreamRepo(db, logger),
		raci:          sqlite.NewRACIRepo(db, logger),
		relationships: sqlite.NewRelationshipRepo(db, logger),
		tags:          sqlite.NewTagRepo(db, logger),
		engagements:   sqlite.NewEngagementRepo(db, logger),
		commPlans:     sqlite.NewCommPlanRepo(db, logger),
		db:            db,
		logger:        logger,
	}
}

// FullExport contains every table in the database for sharing/backup.
type FullExport struct {
	Version             string                      `json:"version"`
	ExportedAt          string                      `json:"exported_at"`
	Projects            []domain.Project            `json:"projects"`
	Stakeholders        []domain.Stakeholder        `json:"stakeholders"`
	ProjectStakeholders []domain.ProjectStakeholder `json:"project_stakeholders"`
	Workstreams         []domain.Workstream         `json:"workstreams"`
	RACIAssignments     []domain.RACIAssignment     `json:"raci_assignments"`
	Relationships       []domain.Relationship       `json:"relationships"`
	Tags                []domain.Tag                `json:"tags"`
	StakeholderTags     []domain.StakeholderTag     `json:"stakeholder_tags"`
	CommunicationPlans  []commPlanExport            `json:"communication_plans"`
	EngagementLogs      []domain.EngagementLog      `json:"engagement_logs"`
}

// commPlanExport is a JSON-friendly version of CommunicationPlan.
type commPlanExport struct {
	ID                   string `json:"id"`
	ProjectStakeholderID string `json:"project_stakeholder_id"`
	Channel              string `json:"channel"`
	Frequency            string `json:"frequency"`
	Notes                string `json:"notes"`
	LastContactDate      string `json:"last_contact_date,omitempty"`
}

// ExportFullJSON exports the complete database as a JSON structure.
func (s *ExportService) ExportFullJSON(w io.Writer) error {
	projects, err := s.projects.List()
	if err != nil {
		return fmt.Errorf("exporting projects: %w", err)
	}
	stakeholders, err := s.stakeholders.List(nil)
	if err != nil {
		return fmt.Errorf("exporting stakeholders: %w", err)
	}
	relationships, err := s.relationships.ListAll()
	if err != nil {
		return fmt.Errorf("exporting relationships: %w", err)
	}
	tags, err := s.tags.ListAll()
	if err != nil {
		return fmt.Errorf("exporting tags: %w", err)
	}

	// Fetch project_stakeholders, workstreams, RACI, comm_plans, engagements, stakeholder_tags from DB
	projectStakeholders := s.queryProjectStakeholders()
	workstreams := s.queryAllWorkstreams(projects)
	raciAssignments := s.queryAllRACIAssignments(projects)
	stakeholderTags := s.queryStakeholderTags()
	commPlans := s.queryAllCommPlans(projectStakeholders)
	engagementLogs := s.queryAllEngagementLogs(projectStakeholders)

	data := FullExport{
		Version:             "1.0",
		ExportedAt:          time.Now().Format(time.RFC3339),
		Projects:            projects,
		Stakeholders:        stakeholders,
		ProjectStakeholders: projectStakeholders,
		Workstreams:         workstreams,
		RACIAssignments:     raciAssignments,
		Relationships:       relationships,
		Tags:                tags,
		StakeholderTags:     stakeholderTags,
		CommunicationPlans:  commPlans,
		EngagementLogs:      engagementLogs,
	}

	enc := json.NewEncoder(w)
	enc.SetIndent("", "  ")
	return enc.Encode(data)
}

// ImportFullJSON imports a complete database from a JSON export.
// It clears existing data first to avoid conflicts.
func (s *ExportService) ImportFullJSON(r io.Reader) (*ImportResult, error) {
	var data FullExport
	if err := json.NewDecoder(r).Decode(&data); err != nil {
		return nil, fmt.Errorf("invalid JSON file: %w", err)
	}

	if data.Version == "" {
		return nil, fmt.Errorf("this doesn't look like a Stakeholder Tool export file (missing version)")
	}

	conn := s.db.Conn()

	// Clear existing data in reverse dependency order
	clearTables := []string{
		"stakeholder_history", "engagement_logs", "comm_plans",
		"raci_assignments", "stakeholder_tags", "relationships",
		"workstreams", "project_stakeholders", "tags", "stakeholders", "projects",
	}
	for _, table := range clearTables {
		if _, err := conn.Exec("DELETE FROM " + table); err != nil { //nolint:gosec
			s.logger.Warn("failed to clear table", "table", table, "error", err)
		}
	}

	result := &ImportResult{}

	// Insert in dependency order
	for _, p := range data.Projects {
		_, err := conn.Exec(
			"INSERT INTO projects (id, name, description, status) VALUES (?, ?, ?, ?)",
			p.ID, p.Name, p.Description, p.Status)
		if err != nil {
			s.logger.Warn("import project failed", "name", p.Name, "error", err)
		} else {
			result.Projects++
		}
	}

	for _, sh := range data.Stakeholders {
		_, err := conn.Exec(
			"INSERT INTO stakeholders (id, name, job_title, department, email, slack, influence_level, support_level, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
			sh.ID, sh.Name, sh.JobTitle, sh.Department, sh.Email, sh.Slack, sh.InfluenceLevel, sh.SupportLevel, sh.Notes)
		if err != nil {
			s.logger.Warn("import stakeholder failed", "name", sh.Name, "error", err)
		} else {
			result.Stakeholders++
		}
	}

	for _, ps := range data.ProjectStakeholders {
		_, err := conn.Exec(
			"INSERT INTO project_stakeholders (id, project_id, stakeholder_id, project_function) VALUES (?, ?, ?, ?)",
			ps.ID, ps.ProjectID, ps.StakeholderID, ps.ProjectFunction)
		if err != nil {
			s.logger.Warn("import project_stakeholder failed", "error", err)
		} else {
			result.ProjectStakeholders++
		}
	}

	for _, ws := range data.Workstreams {
		_, err := conn.Exec(
			"INSERT INTO workstreams (id, project_id, name, description) VALUES (?, ?, ?, ?)",
			ws.ID, ws.ProjectID, ws.Name, ws.Description)
		if err != nil {
			s.logger.Warn("import workstream failed", "name", ws.Name, "error", err)
		} else {
			result.Workstreams++
		}
	}

	for _, ra := range data.RACIAssignments {
		_, err := conn.Exec(
			"INSERT INTO raci_assignments (id, project_stakeholder_id, workstream_id, role) VALUES (?, ?, ?, ?)",
			ra.ID, ra.ProjectStakeholderID, ra.WorkstreamID, ra.Role)
		if err != nil {
			s.logger.Warn("import RACI failed", "error", err)
		} else {
			result.RACIAssignments++
		}
	}

	for _, rel := range data.Relationships {
		_, err := conn.Exec(
			"INSERT INTO relationships (id, from_stakeholder_id, to_stakeholder_id, type, strength, notes) VALUES (?, ?, ?, ?, ?, ?)",
			rel.ID, rel.FromStakeholderID, rel.ToStakeholderID, rel.Type, rel.Strength, rel.Notes)
		if err != nil {
			s.logger.Warn("import relationship failed", "error", err)
		} else {
			result.Relationships++
		}
	}

	for _, t := range data.Tags {
		_, err := conn.Exec(
			"INSERT INTO tags (id, name, color) VALUES (?, ?, ?)",
			t.ID, t.Name, t.Color)
		if err != nil {
			s.logger.Warn("import tag failed", "name", t.Name, "error", err)
		} else {
			result.Tags++
		}
	}

	for _, st := range data.StakeholderTags {
		if _, err := conn.Exec(
			"INSERT OR IGNORE INTO stakeholder_tags (stakeholder_id, tag_id) VALUES (?, ?)",
			st.StakeholderID, st.TagID); err != nil {
			s.logger.Warn("import stakeholder_tag failed", "error", err)
		}
	}

	for _, cp := range data.CommunicationPlans {
		if _, err := conn.Exec(
			"INSERT INTO comm_plans (id, project_stakeholder_id, channel, frequency, notes, last_contact_date) VALUES (?, ?, ?, ?, ?, ?)",
			cp.ID, cp.ProjectStakeholderID, cp.Channel, cp.Frequency, cp.Notes, nilIfEmpty(cp.LastContactDate)); err != nil {
			s.logger.Warn("import comm plan failed", "error", err)
		} else {
			result.CommPlans++
		}
	}

	for _, el := range data.EngagementLogs {
		if _, err := conn.Exec(
			"INSERT INTO engagement_logs (id, project_stakeholder_id, date, type, summary, sentiment) VALUES (?, ?, ?, ?, ?, ?)",
			el.ID, el.ProjectStakeholderID, el.Date, el.Type, el.Summary, el.Sentiment); err != nil {
			s.logger.Warn("import engagement log failed", "error", err)
		} else {
			result.EngagementLogs++
		}
	}

	s.db.AuditLog("import", "full_database", "", fmt.Sprintf("imported from v%s export", data.Version))

	return result, nil
}

// ImportResult summarizes what was imported.
type ImportResult struct {
	Projects            int `json:"projects"`
	Stakeholders        int `json:"stakeholders"`
	ProjectStakeholders int `json:"project_stakeholders"`
	Workstreams         int `json:"workstreams"`
	RACIAssignments     int `json:"raci_assignments"`
	Relationships       int `json:"relationships"`
	Tags                int `json:"tags"`
	CommPlans           int `json:"communication_plans"`
	EngagementLogs      int `json:"engagement_logs"`
}

// --- CSV methods (unchanged) ---

// ExportStakeholdersCSV writes all stakeholders as CSV to the given writer.
func (s *ExportService) ExportStakeholdersCSV(w io.Writer, projectID string) error {
	var stakeholders []domain.Stakeholder
	var err error

	if projectID != "" {
		stakeholders, err = s.stakeholders.ListByProject(projectID)
	} else {
		stakeholders, err = s.stakeholders.List(nil)
	}
	if err != nil {
		return fmt.Errorf("fetching stakeholders: %w", err)
	}

	writer := csv.NewWriter(w)
	defer writer.Flush()

	if err := writer.Write([]string{
		"ID", "Name", "Job Title", "Department", "Email", "Slack",
		"Influence Level", "Support Level", "Notes",
	}); err != nil {
		return fmt.Errorf("writing CSV header: %w", err)
	}

	for _, sh := range stakeholders {
		if err := writer.Write([]string{
			sh.ID, sh.Name, sh.JobTitle, sh.Department, sh.Email, sh.Slack,
			string(sh.InfluenceLevel), string(sh.SupportLevel), sh.Notes,
		}); err != nil {
			return fmt.Errorf("writing CSV row: %w", err)
		}
	}

	return nil
}

// ExportStakeholdersJSON writes all stakeholders as JSON to the given writer.
func (s *ExportService) ExportStakeholdersJSON(w io.Writer, projectID string) error {
	var stakeholders []domain.Stakeholder
	var err error

	if projectID != "" {
		stakeholders, err = s.stakeholders.ListByProject(projectID)
	} else {
		stakeholders, err = s.stakeholders.List(nil)
	}
	if err != nil {
		return fmt.Errorf("fetching stakeholders: %w", err)
	}

	enc := json.NewEncoder(w)
	enc.SetIndent("", "  ")
	return enc.Encode(stakeholders)
}

// ImportStakeholdersCSV reads stakeholders from CSV and creates them.
func (s *ExportService) ImportStakeholdersCSV(r io.Reader) (int, error) {
	reader := csv.NewReader(r)
	records, err := reader.ReadAll()
	if err != nil {
		return 0, fmt.Errorf("reading CSV: %w", err)
	}

	if len(records) < 2 {
		return 0, fmt.Errorf("CSV must have a header row and at least one data row")
	}

	header := records[0]
	colIdx := make(map[string]int)
	for i, col := range header {
		colIdx[strings.ToLower(strings.TrimSpace(col))] = i
	}

	count := 0
	svc := NewStakeholderService(s.db, s.logger)

	for i, row := range records[1:] {
		sh := &domain.Stakeholder{
			Name:           getCol(row, colIdx, "name"),
			JobTitle:       getCol(row, colIdx, "job title"),
			Department:     getCol(row, colIdx, "department"),
			Email:          getCol(row, colIdx, "email"),
			Slack:          getCol(row, colIdx, "slack"),
			InfluenceLevel: domain.InfluenceLevel(getCol(row, colIdx, "influence level")),
			SupportLevel:   domain.SupportLevel(getCol(row, colIdx, "support level")),
			Notes:          getCol(row, colIdx, "notes"),
		}

		if sh.Name == "" {
			s.logger.Warn("skipping CSV row with empty name", "row", i+2)
			continue
		}

		if err := svc.Create(sh); err != nil {
			s.logger.Error("failed to import CSV row", "row", i+2, "error", err)
			continue
		}
		count++
	}

	return count, nil
}

// --- Internal query helpers ---

func (s *ExportService) queryProjectStakeholders() []domain.ProjectStakeholder {
	rows, err := s.db.Conn().Query(
		"SELECT id, project_id, stakeholder_id, project_function FROM project_stakeholders")
	if err != nil {
		return nil
	}
	defer rows.Close()

	var result []domain.ProjectStakeholder
	for rows.Next() {
		var ps domain.ProjectStakeholder
		if err := rows.Scan(&ps.ID, &ps.ProjectID, &ps.StakeholderID, &ps.ProjectFunction); err != nil {
			s.logger.Warn("scan project_stakeholder failed", "error", err)
			continue
		}
		result = append(result, ps)
	}
	return result
}

func (s *ExportService) queryAllWorkstreams(projects []domain.Project) []domain.Workstream {
	var all []domain.Workstream
	for _, p := range projects {
		ws, err := s.workstreams.ListByProject(p.ID)
		if err != nil {
			s.logger.Warn("export workstreams failed", "project", p.ID, "error", err)
			continue
		}
		all = append(all, ws...)
	}
	return all
}

func (s *ExportService) queryAllRACIAssignments(projects []domain.Project) []domain.RACIAssignment {
	var all []domain.RACIAssignment
	for _, p := range projects {
		named, err := s.raci.ListByProject(p.ID)
		if err != nil {
			s.logger.Warn("export RACI failed", "project", p.ID, "error", err)
			continue
		}
		for _, n := range named {
			all = append(all, n.RACIAssignment)
		}
	}
	return all
}

func (s *ExportService) queryStakeholderTags() []domain.StakeholderTag {
	rows, err := s.db.Conn().Query("SELECT stakeholder_id, tag_id FROM stakeholder_tags")
	if err != nil {
		s.logger.Warn("export stakeholder_tags query failed", "error", err)
		return nil
	}
	defer rows.Close()

	var result []domain.StakeholderTag
	for rows.Next() {
		var st domain.StakeholderTag
		if err := rows.Scan(&st.StakeholderID, &st.TagID); err != nil {
			s.logger.Warn("scan stakeholder_tag failed", "error", err)
			continue
		}
		result = append(result, st)
	}
	return result
}

func (s *ExportService) queryAllCommPlans(psList []domain.ProjectStakeholder) []commPlanExport {
	var all []commPlanExport
	for _, ps := range psList {
		plans, err := s.commPlans.ListByProjectStakeholder(ps.ID)
		if err != nil {
			s.logger.Warn("export comm plans failed", "ps", ps.ID, "error", err)
			continue
		}
		for _, cp := range plans {
			ex := commPlanExport{
				ID:                   cp.ID,
				ProjectStakeholderID: cp.ProjectStakeholderID,
				Channel:              string(cp.Channel),
				Frequency:            string(cp.Frequency),
				Notes:                cp.Notes,
			}
			if cp.LastContactDate != nil {
				ex.LastContactDate = cp.LastContactDate.Format("2006-01-02")
			}
			all = append(all, ex)
		}
	}
	return all
}

func (s *ExportService) queryAllEngagementLogs(psList []domain.ProjectStakeholder) []domain.EngagementLog {
	var all []domain.EngagementLog
	for _, ps := range psList {
		logs, err := s.engagements.ListByProjectStakeholder(ps.ID)
		if err != nil {
			s.logger.Warn("export engagement logs failed", "ps", ps.ID, "error", err)
			continue
		}
		all = append(all, logs...)
	}
	return all
}

func getCol(row []string, colIdx map[string]int, name string) string {
	if idx, ok := colIdx[name]; ok && idx < len(row) {
		return strings.TrimSpace(row[idx])
	}
	return ""
}

func nilIfEmpty(s string) interface{} {
	if s == "" {
		return nil
	}
	return s
}
