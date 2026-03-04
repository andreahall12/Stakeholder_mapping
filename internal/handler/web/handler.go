// Package web provides HTTP handlers for the server-rendered web UI.
// Uses Go html/template with HTMX for reactive updates.
package web

import (
	"encoding/json"
	"fmt"
	"html/template"
	"log/slog"
	"net/http"
	"os"

	"github.com/go-chi/chi/v5"

	"github.com/andreahall12/stakeholder-tool/internal/config"
	"github.com/andreahall12/stakeholder-tool/internal/middleware"
	"github.com/andreahall12/stakeholder-tool/internal/repository/sqlite"
	"github.com/andreahall12/stakeholder-tool/internal/service"
)

// templateFuncs provides custom functions available in all templates.
var templateFuncs = template.FuncMap{
	"json": func(v interface{}) template.JS {
		b, err := json.Marshal(v)
		if err != nil {
			return template.JS("null")
		}
		return template.JS(b)
	},
	"influencePct": func(total, count int) string {
		if total == 0 {
			return "0"
		}
		return fmt.Sprintf("%.0f", float64(count)/float64(total)*100)
	},
	"slice": func(s string, start, end int) string {
		if start >= len(s) {
			return ""
		}
		if end > len(s) {
			end = len(s)
		}
		return s[start:end]
	},
}

// Handler holds web UI dependencies.
type Handler struct {
	db     *sqlite.DB
	cfg    *config.Config
	logger *slog.Logger

	stakeholders  *service.StakeholderService
	projects      *service.ProjectService
	workstreams   *service.WorkstreamService
	raci          *service.RACIService
	dashboard     *service.DashboardService
	relationships *sqlite.RelationshipRepo
	commPlans     *sqlite.CommPlanRepo
}

// NewHandler creates a new web handler.
func NewHandler(db *sqlite.DB, cfg *config.Config, logger *slog.Logger) *Handler {
	return &Handler{
		db:            db,
		cfg:           cfg,
		logger:        logger,
		stakeholders:  service.NewStakeholderService(db, logger),
		projects:      service.NewProjectService(db, logger),
		workstreams:   service.NewWorkstreamService(db, logger),
		raci:          service.NewRACIService(db, logger),
		dashboard:     service.NewDashboardService(db, logger),
		relationships: sqlite.NewRelationshipRepo(db, logger),
		commPlans:     sqlite.NewCommPlanRepo(db, logger),
	}
}

// Register mounts all web routes on the given router.
func (h *Handler) Register(r chi.Router) {
	// Static files
	fileServer := http.FileServer(http.Dir("web/static"))
	r.Handle("/static/*", http.StripPrefix("/static/", fileServer))

	// Pages
	r.Get("/", h.dashboardPage)
	r.Get("/projects/{id}", h.projectDetailPage)
	r.Get("/network", h.networkPage)
	r.Get("/influence", h.influencePage)
	r.Get("/orgchart", h.orgChartPage)
	r.Get("/raci/{projectId}", h.raciPage)
	r.Get("/comms/{projectId}", h.commsPage)
	r.Get("/help", h.helpPage)

	// HTMX partials
	r.Get("/partials/stakeholder-list", h.stakeholderListPartial)
	r.Get("/partials/project-kpis/{id}", h.projectKPIsPartial)
	r.Get("/partials/raci-grid/{projectId}", h.raciGridPartial)

	// Demo mode actions
	r.Post("/demo/clear", h.clearDemoData)
	r.Post("/demo/load", h.loadDemoData)
}

// isDemoData returns true if the database contains the well-known demo project.
func (h *Handler) isDemoData() bool {
	p, err := h.projects.GetByID("proj-demo-001")
	return err == nil && p != nil
}

// clearDemoData wipes all data from the database so the user can start fresh.
func (h *Handler) clearDemoData(w http.ResponseWriter, r *http.Request) {
	conn := h.db.Conn()
	tables := []string{
		"stakeholder_history", "engagement_logs", "comm_plans",
		"raci_assignments", "stakeholder_tags", "relationships",
		"workstreams", "project_stakeholders", "tags",
		"stakeholders", "projects", "audit_log",
	}
	for _, t := range tables {
		if _, err := conn.Exec("DELETE FROM " + t); err != nil {
			h.logger.Warn("failed to clear table", "table", t, "error", err)
		}
	}
	h.db.AuditLog("clear", "demo_data", "", "cleared all demo data from UI")
	h.logger.Info("demo data cleared by user")

	http.Redirect(w, r, "/", http.StatusSeeOther)
}

// loadDemoData clears all data and loads the demo seed, then redirects to dashboard.
func (h *Handler) loadDemoData(w http.ResponseWriter, r *http.Request) {
	conn := h.db.Conn()

	// Clear existing data first
	tables := []string{
		"stakeholder_history", "engagement_logs", "comm_plans",
		"raci_assignments", "stakeholder_tags", "relationships",
		"workstreams", "project_stakeholders", "tags",
		"stakeholders", "projects", "audit_log",
	}
	for _, t := range tables {
		if _, err := conn.Exec("DELETE FROM " + t); err != nil {
			h.logger.Warn("failed to clear table during demo load", "table", t, "error", err)
		}
	}

	seedSQL, err := os.ReadFile("db/seed_demo.sql")
	if err != nil {
		h.logger.Error("failed to read seed file", "error", err)
		http.Error(w, "Could not load demo data", http.StatusInternalServerError)
		return
	}

	if _, err := conn.Exec(string(seedSQL)); err != nil {
		h.logger.Error("failed to execute seed data", "error", err)
		http.Error(w, "Could not load demo data", http.StatusInternalServerError)
		return
	}

	h.db.AuditLog("load", "demo_data", "", "loaded demo data from UI")
	h.logger.Info("demo data loaded by user")

	http.Redirect(w, r, "/", http.StatusSeeOther)
}

// --- Pages ---

func (h *Handler) dashboardPage(w http.ResponseWriter, r *http.Request) {
	projects, err := h.projects.ListWithDetails()
	if err != nil {
		h.logger.Error("failed to list projects", "error", err)
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}

	stakeholders, err2 := h.stakeholders.List(nil)
	if err2 != nil {
		h.logger.Warn("failed to list stakeholders", "error", err2)
	}
	nonce := middleware.GetNonce(r.Context())
	isDemo := h.isDemoData()

	activeCount := 0
	for _, p := range projects {
		if p.Status == "active" {
			activeCount++
		}
	}

	data := map[string]interface{}{
		"Projects":       projects,
		"Stakeholders":   stakeholders,
		"Nonce":          nonce,
		"ActivePage":     "dashboard",
		"IsDemo":         isDemo,
		"IsEmpty":        len(projects) == 0 && len(stakeholders) == 0 && !isDemo,
		"ActiveProjects": activeCount,
	}

	h.renderPage(w, "dashboard", data)
}

func (h *Handler) projectDetailPage(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	project, err := h.projects.GetByID(id)
	if err != nil || project == nil {
		http.Error(w, "Project not found", http.StatusNotFound)
		return
	}

	stakeholders, err := h.stakeholders.ListByProject(id)
	if err != nil {
		h.logger.Warn("failed to list project stakeholders", "project", id, "error", err)
	}
	workstreams, err := h.workstreams.ListByProject(id)
	if err != nil {
		h.logger.Warn("failed to list workstreams", "project", id, "error", err)
	}
	kpis, err := h.dashboard.GetKPIs(id)
	if err != nil {
		h.logger.Warn("failed to get KPIs", "project", id, "error", err)
	}
	nonce := middleware.GetNonce(r.Context())

	data := map[string]interface{}{
		"Project":      project,
		"Stakeholders": stakeholders,
		"Workstreams":  workstreams,
		"KPIs":         kpis,
		"Nonce":        nonce,
		"ActivePage":   "dashboard",
		"IsDemo":       h.isDemoData(),
	}

	h.renderPage(w, "project-detail", data)
}

func (h *Handler) networkPage(w http.ResponseWriter, r *http.Request) {
	stakeholders, err := h.stakeholders.List(nil)
	if err != nil {
		h.logger.Warn("failed to list stakeholders for network", "error", err)
	}
	relationships, err := h.relationships.ListAll()
	if err != nil {
		h.logger.Warn("failed to list relationships for network", "error", err)
	}
	nonce := middleware.GetNonce(r.Context())

	data := map[string]interface{}{
		"Stakeholders":  stakeholders,
		"Relationships": relationships,
		"Nonce":         nonce,
		"ActivePage":    "network",
		"IsDemo":        h.isDemoData(),
	}

	h.renderPage(w, "network", data)
}

func (h *Handler) influencePage(w http.ResponseWriter, r *http.Request) {
	stakeholders, err := h.stakeholders.List(nil)
	if err != nil {
		h.logger.Warn("failed to list stakeholders for influence", "error", err)
	}
	nonce := middleware.GetNonce(r.Context())

	data := map[string]interface{}{
		"Stakeholders": stakeholders,
		"Nonce":        nonce,
		"ActivePage":   "influence",
		"IsDemo":       h.isDemoData(),
	}

	h.renderPage(w, "influence", data)
}

func (h *Handler) orgChartPage(w http.ResponseWriter, r *http.Request) {
	stakeholders, err := h.stakeholders.List(nil)
	if err != nil {
		h.logger.Warn("failed to list stakeholders for orgchart", "error", err)
	}
	relationships, err := h.relationships.ListAll()
	if err != nil {
		h.logger.Warn("failed to list relationships for orgchart", "error", err)
	}
	nonce := middleware.GetNonce(r.Context())

	data := map[string]interface{}{
		"Stakeholders":  stakeholders,
		"Relationships": relationships,
		"Nonce":         nonce,
		"ActivePage":    "orgchart",
		"IsDemo":        h.isDemoData(),
	}

	h.renderPage(w, "orgchart", data)
}

func (h *Handler) raciPage(w http.ResponseWriter, r *http.Request) {
	projectID := chi.URLParam(r, "projectId")
	project, err := h.projects.GetByID(projectID)
	if err != nil || project == nil {
		http.Error(w, "Project not found", http.StatusNotFound)
		return
	}

	assignments, err := h.raci.ListByProject(projectID)
	if err != nil {
		h.logger.Warn("failed to list RACI assignments", "project", projectID, "error", err)
	}
	workstreams, err := h.workstreams.ListByProject(projectID)
	if err != nil {
		h.logger.Warn("failed to list workstreams", "project", projectID, "error", err)
	}
	stakeholders, err := h.stakeholders.ListByProject(projectID)
	if err != nil {
		h.logger.Warn("failed to list stakeholders", "project", projectID, "error", err)
	}
	nonce := middleware.GetNonce(r.Context())

	data := map[string]interface{}{
		"Project":      project,
		"Assignments":  assignments,
		"Workstreams":  workstreams,
		"Stakeholders": stakeholders,
		"Nonce":        nonce,
		"ActivePage":   "raci",
		"IsDemo":       h.isDemoData(),
	}

	h.renderPage(w, "raci", data)
}

func (h *Handler) commsPage(w http.ResponseWriter, r *http.Request) {
	projectID := chi.URLParam(r, "projectId")
	project, err := h.projects.GetByID(projectID)
	if err != nil || project == nil {
		http.Error(w, "Project not found", http.StatusNotFound)
		return
	}

	plans, err := h.commPlans.ListByProject(projectID)
	if err != nil {
		h.logger.Warn("failed to list comm plans", "project", projectID, "error", err)
	}
	stakeholders, err := h.stakeholders.ListByProject(projectID)
	if err != nil {
		h.logger.Warn("failed to list stakeholders for comms", "project", projectID, "error", err)
	}

	// Build a list of project_stakeholder IDs for the "add" form
	type psOption struct {
		PSID string
		Name string
	}
	var psOptions []psOption
	rows, err := h.db.Conn().Query(
		`SELECT ps.id, s.name FROM project_stakeholders ps
		 JOIN stakeholders s ON ps.stakeholder_id = s.id
		 WHERE ps.project_id = ? ORDER BY s.name`, projectID)
	if err == nil {
		defer rows.Close()
		for rows.Next() {
			var o psOption
			if err := rows.Scan(&o.PSID, &o.Name); err != nil {
				h.logger.Warn("failed to scan PS option", "error", err)
				continue
			}
			psOptions = append(psOptions, o)
		}
	}

	nonce := middleware.GetNonce(r.Context())

	data := map[string]interface{}{
		"Project":      project,
		"Plans":        plans,
		"Stakeholders": stakeholders,
		"PSOptions":    psOptions,
		"Nonce":        nonce,
		"ActivePage":   "dashboard",
		"IsDemo":       h.isDemoData(),
	}

	h.renderPage(w, "comms", data)
}

func (h *Handler) helpPage(w http.ResponseWriter, r *http.Request) {
	nonce := middleware.GetNonce(r.Context())

	data := map[string]interface{}{
		"Nonce":      nonce,
		"ActivePage": "help",
		"IsDemo":     h.isDemoData(),
	}

	h.renderPage(w, "help", data)
}

// --- HTMX Partials ---

func (h *Handler) stakeholderListPartial(w http.ResponseWriter, r *http.Request) {
	filters := map[string]string{
		"influence_level": r.URL.Query().Get("influence_level"),
		"support_level":   r.URL.Query().Get("support_level"),
		"department":      r.URL.Query().Get("department"),
		"search":          r.URL.Query().Get("search"),
	}
	stakeholders, err := h.stakeholders.List(filters)
	if err != nil {
		h.logger.Warn("failed to list stakeholders for partial", "error", err)
	}

	data := map[string]interface{}{
		"Stakeholders": stakeholders,
	}

	h.renderPartial(w, "stakeholder-list", data)
}

func (h *Handler) projectKPIsPartial(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	kpis, err := h.dashboard.GetKPIs(id)
	if err != nil {
		h.logger.Warn("failed to get KPIs for partial", "project", id, "error", err)
	}

	data := map[string]interface{}{
		"KPIs": kpis,
	}

	h.renderPartial(w, "project-kpis", data)
}

func (h *Handler) raciGridPartial(w http.ResponseWriter, r *http.Request) {
	projectID := chi.URLParam(r, "projectId")
	assignments, err := h.raci.ListByProject(projectID)
	if err != nil {
		h.logger.Warn("failed to list RACI for partial", "project", projectID, "error", err)
	}
	workstreams, err := h.workstreams.ListByProject(projectID)
	if err != nil {
		h.logger.Warn("failed to list workstreams for partial", "project", projectID, "error", err)
	}
	stakeholders, err := h.stakeholders.ListByProject(projectID)
	if err != nil {
		h.logger.Warn("failed to list stakeholders for partial", "project", projectID, "error", err)
	}

	data := map[string]interface{}{
		"Assignments":  assignments,
		"Workstreams":  workstreams,
		"Stakeholders": stakeholders,
	}

	h.renderPartial(w, "raci-grid", data)
}

// --- Template rendering ---

// injectChatProjects adds the project list needed by the AI chat dropdown.
func (h *Handler) injectChatProjects(data map[string]interface{}) {
	if _, ok := data["ChatProjects"]; !ok {
		projects, err := h.projects.ListWithDetails()
		if err != nil {
			h.logger.Warn("failed to load projects for chat dropdown", "error", err)
		}
		data["ChatProjects"] = projects
	}
}

func (h *Handler) renderPage(w http.ResponseWriter, name string, data map[string]interface{}) {
	h.injectChatProjects(data)
	tmpl, err := template.New("").Funcs(templateFuncs).ParseFiles(
		"web/templates/layout.html",
		"web/templates/"+name+".html",
	)
	if err != nil {
		h.logger.Error("template parse error", "template", name, "error", err)
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	if err := tmpl.ExecuteTemplate(w, "layout", data); err != nil {
		h.logger.Error("template execute error", "template", name, "error", err)
	}
}

func (h *Handler) renderPartial(w http.ResponseWriter, name string, data map[string]interface{}) {
	tmpl, err := template.New("").Funcs(templateFuncs).ParseFiles("web/templates/partials/" + name + ".html")
	if err != nil {
		h.logger.Error("partial parse error", "template", name, "error", err)
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	if err := tmpl.Execute(w, data); err != nil {
		h.logger.Error("partial execute error", "template", name, "error", err)
	}
}
