// Package api provides versioned REST API handlers for the stakeholder tool.
// All endpoints return JSON and use parameterized queries via the service layer.
package api

import (
	"encoding/json"
	"fmt"
	"log/slog"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-playground/validator/v10"
	"github.com/google/uuid"

	"github.com/andreahall12/stakeholder-tool/internal/config"
	"github.com/andreahall12/stakeholder-tool/internal/domain"
	"github.com/andreahall12/stakeholder-tool/internal/repository/sqlite"
	"github.com/andreahall12/stakeholder-tool/internal/service"
)

var validate = validator.New()

// Handler holds API dependencies.
type Handler struct {
	cfg    *config.Config
	logger *slog.Logger

	stakeholders  *service.StakeholderService
	projects      *service.ProjectService
	workstreams   *service.WorkstreamService
	raci          *service.RACIService
	dashboard     *service.DashboardService
	ai            *service.AIService
	export        *service.ExportService
	tags          *sqlite.TagRepo
	relationships *sqlite.RelationshipRepo
	engagements   *sqlite.EngagementRepo
	commPlans     *sqlite.CommPlanRepo
}

// NewHandler creates a new API handler with all services initialized.
func NewHandler(db *sqlite.DB, cfg *config.Config, logger *slog.Logger) *Handler {
	return &Handler{
		cfg:           cfg,
		logger:        logger,
		stakeholders:  service.NewStakeholderService(db, logger),
		projects:      service.NewProjectService(db, logger),
		workstreams:   service.NewWorkstreamService(db, logger),
		raci:          service.NewRACIService(db, logger),
		dashboard:     service.NewDashboardService(db, logger),
		ai:            service.NewAIService(db, cfg, logger),
		export:        service.NewExportService(db, logger),
		tags:          sqlite.NewTagRepo(db, logger),
		relationships: sqlite.NewRelationshipRepo(db, logger),
		engagements:   sqlite.NewEngagementRepo(db, logger),
		commPlans:     sqlite.NewCommPlanRepo(db, logger),
	}
}

// Register mounts all API routes on the given router.
func (h *Handler) Register(r chi.Router) {
	// Projects
	r.Get("/projects", h.listProjects)
	r.Post("/projects", h.createProject)
	r.Get("/projects/{id}", h.getProject)
	r.Put("/projects/{id}", h.updateProject)
	r.Delete("/projects/{id}", h.deleteProject)
	r.Get("/projects/{id}/kpis", h.getProjectKPIs)
	r.Post("/projects/{id}/stakeholders", h.assignStakeholder)

	// Stakeholders
	r.Get("/stakeholders", h.listStakeholders)
	r.Post("/stakeholders", h.createStakeholder)
	r.Get("/stakeholders/{id}", h.getStakeholder)
	r.Put("/stakeholders/{id}", h.updateStakeholder)
	r.Delete("/stakeholders/{id}", h.deleteStakeholder)
	r.Post("/stakeholders/bulk", h.bulkUpdateStakeholders)

	// Workstreams
	r.Get("/projects/{projectId}/workstreams", h.listWorkstreams)
	r.Post("/projects/{projectId}/workstreams", h.createWorkstream)
	r.Put("/workstreams/{id}", h.updateWorkstream)
	r.Delete("/workstreams/{id}", h.deleteWorkstream)

	// RACI
	r.Get("/projects/{projectId}/raci", h.listRACIAssignments)
	r.Post("/raci", h.createRACIAssignment)
	r.Put("/raci/{id}", h.updateRACIAssignment)
	r.Delete("/raci/{id}", h.deleteRACIAssignment)

	// Relationships
	r.Get("/relationships", h.listRelationships)
	r.Post("/relationships", h.createRelationship)
	r.Delete("/relationships/{id}", h.deleteRelationship)

	// Tags
	r.Get("/tags", h.listTags)
	r.Post("/tags", h.createTag)
	r.Delete("/tags/{id}", h.deleteTag)
	r.Post("/stakeholders/{id}/tags/{tagId}", h.assignTag)
	r.Delete("/stakeholders/{id}/tags/{tagId}", h.removeTag)

	// Communication Plans
	r.Post("/comms", h.createCommPlan)
	r.Post("/comms/{id}/contact", h.logCommContact)
	r.Delete("/comms/{id}", h.deleteCommPlan)

	// AI Chat
	r.Post("/ai/chat", h.aiChat)
	r.Post("/ai/meeting-brief", h.aiMeetingBrief)
	r.Post("/ai/email-draft", h.aiEmailDraft)
	r.Post("/ai/analyze-blockers", h.aiAnalyzeBlockers)

	// Export
	r.Get("/export/stakeholders.csv", h.exportStakeholdersCSV)
	r.Get("/export/stakeholders.json", h.exportStakeholdersJSON)
	r.Get("/export/full.json", h.exportFullJSON)
	r.Post("/import/stakeholders.csv", h.importStakeholdersCSV)
	r.Post("/import/full.json", h.importFullJSON)

	// Health check
	r.Get("/health", h.healthCheck)
}

// --- Project endpoints ---

func (h *Handler) listProjects(w http.ResponseWriter, r *http.Request) {
	projects, err := h.projects.ListWithDetails()
	if err != nil {
		h.jsonError(w, "failed to list projects", err, http.StatusInternalServerError)
		return
	}
	h.jsonOK(w, projects)
}

func (h *Handler) createProject(w http.ResponseWriter, r *http.Request) {
	var p domain.Project
	if err := json.NewDecoder(r.Body).Decode(&p); err != nil {
		h.jsonError(w, "invalid request body", err, http.StatusBadRequest)
		return
	}
	if err := h.projects.Create(&p); err != nil {
		h.jsonError(w, "failed to create project", err, http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusCreated)
	h.jsonOK(w, p)
}

func (h *Handler) getProject(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	p, err := h.projects.GetByID(id)
	if err != nil {
		h.jsonError(w, "failed to get project", err, http.StatusInternalServerError)
		return
	}
	if p == nil {
		h.jsonError(w, "project not found", nil, http.StatusNotFound)
		return
	}
	h.jsonOK(w, p)
}

func (h *Handler) updateProject(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	var p domain.Project
	if err := json.NewDecoder(r.Body).Decode(&p); err != nil {
		h.jsonError(w, "invalid request body", err, http.StatusBadRequest)
		return
	}
	p.ID = id
	if err := h.projects.Update(&p); err != nil {
		h.jsonError(w, "failed to update project", err, http.StatusInternalServerError)
		return
	}
	h.jsonOK(w, p)
}

func (h *Handler) deleteProject(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if err := h.projects.Delete(id); err != nil {
		h.jsonError(w, "failed to delete project", err, http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (h *Handler) getProjectKPIs(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	kpis, err := h.dashboard.GetKPIs(id)
	if err != nil {
		h.jsonError(w, "failed to get KPIs", err, http.StatusInternalServerError)
		return
	}
	h.jsonOK(w, kpis)
}

func (h *Handler) assignStakeholder(w http.ResponseWriter, r *http.Request) {
	projectID := chi.URLParam(r, "id")
	var input struct {
		StakeholderID string `json:"stakeholder_id" validate:"required,uuid"`
		Function      string `json:"function" validate:"required,min=1,max=200"`
	}
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		h.jsonError(w, "invalid request body", err, http.StatusBadRequest)
		return
	}
	if err := validate.Struct(input); err != nil {
		h.jsonError(w, fmt.Sprintf("validation error: %s", err), nil, http.StatusBadRequest)
		return
	}
	if err := h.projects.AssignStakeholder(projectID, input.StakeholderID, input.Function); err != nil {
		h.jsonError(w, "failed to assign stakeholder", err, http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusCreated)
	h.jsonOK(w, map[string]string{"status": "assigned"})
}

// --- Stakeholder endpoints ---

func (h *Handler) listStakeholders(w http.ResponseWriter, r *http.Request) {
	filters := map[string]string{
		"influence_level": r.URL.Query().Get("influence_level"),
		"support_level":   r.URL.Query().Get("support_level"),
		"department":      r.URL.Query().Get("department"),
		"search":          r.URL.Query().Get("search"),
	}
	stakeholders, err := h.stakeholders.List(filters)
	if err != nil {
		h.jsonError(w, "failed to list stakeholders", err, http.StatusInternalServerError)
		return
	}
	h.jsonOK(w, stakeholders)
}

func (h *Handler) createStakeholder(w http.ResponseWriter, r *http.Request) {
	var s domain.Stakeholder
	if err := json.NewDecoder(r.Body).Decode(&s); err != nil {
		h.jsonError(w, "invalid request body", err, http.StatusBadRequest)
		return
	}
	if err := h.stakeholders.Create(&s); err != nil {
		h.jsonError(w, "failed to create stakeholder", err, http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusCreated)
	h.jsonOK(w, s)
}

func (h *Handler) getStakeholder(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	s, err := h.stakeholders.GetByID(id)
	if err != nil {
		h.jsonError(w, "failed to get stakeholder", err, http.StatusInternalServerError)
		return
	}
	if s == nil {
		h.jsonError(w, "stakeholder not found", nil, http.StatusNotFound)
		return
	}
	h.jsonOK(w, s)
}

func (h *Handler) updateStakeholder(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	var s domain.Stakeholder
	if err := json.NewDecoder(r.Body).Decode(&s); err != nil {
		h.jsonError(w, "invalid request body", err, http.StatusBadRequest)
		return
	}
	s.ID = id
	if err := h.stakeholders.Update(&s); err != nil {
		h.jsonError(w, "failed to update stakeholder", err, http.StatusInternalServerError)
		return
	}
	h.jsonOK(w, s)
}

func (h *Handler) deleteStakeholder(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if err := h.stakeholders.Delete(id); err != nil {
		h.jsonError(w, "failed to delete stakeholder", err, http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (h *Handler) bulkUpdateStakeholders(w http.ResponseWriter, r *http.Request) {
	var input struct {
		IDs   []string `json:"ids"`
		Field string   `json:"field"`
		Value string   `json:"value"`
	}
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		h.jsonError(w, "invalid request body", err, http.StatusBadRequest)
		return
	}
	if err := h.stakeholders.BulkUpdateField(input.IDs, input.Field, input.Value); err != nil {
		h.jsonError(w, "failed to bulk update", err, http.StatusInternalServerError)
		return
	}
	h.jsonOK(w, map[string]string{"status": "updated"})
}

// --- Workstream endpoints ---

func (h *Handler) listWorkstreams(w http.ResponseWriter, r *http.Request) {
	projectID := chi.URLParam(r, "projectId")
	workstreams, err := h.workstreams.ListByProject(projectID)
	if err != nil {
		h.jsonError(w, "failed to list workstreams", err, http.StatusInternalServerError)
		return
	}
	h.jsonOK(w, workstreams)
}

func (h *Handler) createWorkstream(w http.ResponseWriter, r *http.Request) {
	projectID := chi.URLParam(r, "projectId")
	var ws domain.Workstream
	if err := json.NewDecoder(r.Body).Decode(&ws); err != nil {
		h.jsonError(w, "invalid request body", err, http.StatusBadRequest)
		return
	}
	ws.ProjectID = projectID
	if err := h.workstreams.Create(&ws); err != nil {
		h.jsonError(w, "failed to create workstream", err, http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusCreated)
	h.jsonOK(w, ws)
}

func (h *Handler) updateWorkstream(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	var ws domain.Workstream
	if err := json.NewDecoder(r.Body).Decode(&ws); err != nil {
		h.jsonError(w, "invalid request body", err, http.StatusBadRequest)
		return
	}
	ws.ID = id
	if err := h.workstreams.Update(&ws); err != nil {
		h.jsonError(w, "failed to update workstream", err, http.StatusInternalServerError)
		return
	}
	h.jsonOK(w, ws)
}

func (h *Handler) deleteWorkstream(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if err := h.workstreams.Delete(id); err != nil {
		h.jsonError(w, "failed to delete workstream", err, http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

// --- RACI endpoints ---

func (h *Handler) listRACIAssignments(w http.ResponseWriter, r *http.Request) {
	projectID := chi.URLParam(r, "projectId")
	assignments, err := h.raci.ListByProject(projectID)
	if err != nil {
		h.jsonError(w, "failed to list RACI", err, http.StatusInternalServerError)
		return
	}
	h.jsonOK(w, assignments)
}

func (h *Handler) createRACIAssignment(w http.ResponseWriter, r *http.Request) {
	var a domain.RACIAssignment
	if err := json.NewDecoder(r.Body).Decode(&a); err != nil {
		h.jsonError(w, "invalid request body", err, http.StatusBadRequest)
		return
	}
	if err := h.raci.Create(&a); err != nil {
		h.jsonError(w, "failed to create RACI assignment", err, http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusCreated)
	h.jsonOK(w, a)
}

func (h *Handler) updateRACIAssignment(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	var a domain.RACIAssignment
	if err := json.NewDecoder(r.Body).Decode(&a); err != nil {
		h.jsonError(w, "invalid request body", err, http.StatusBadRequest)
		return
	}
	a.ID = id
	if err := h.raci.Update(&a); err != nil {
		h.jsonError(w, "failed to update RACI assignment", err, http.StatusInternalServerError)
		return
	}
	h.jsonOK(w, a)
}

func (h *Handler) deleteRACIAssignment(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if err := h.raci.Delete(id); err != nil {
		h.jsonError(w, "failed to delete RACI assignment", err, http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

// --- Relationship endpoints ---

func (h *Handler) listRelationships(w http.ResponseWriter, r *http.Request) {
	stakeholderID := r.URL.Query().Get("stakeholder_id")
	var rels []domain.Relationship
	var err error
	if stakeholderID != "" {
		rels, err = h.relationships.ListByStakeholder(stakeholderID)
	} else {
		rels, err = h.relationships.ListAll()
	}
	if err != nil {
		h.jsonError(w, "failed to list relationships", err, http.StatusInternalServerError)
		return
	}
	h.jsonOK(w, rels)
}

func (h *Handler) createRelationship(w http.ResponseWriter, r *http.Request) {
	var rel domain.Relationship
	if err := json.NewDecoder(r.Body).Decode(&rel); err != nil {
		h.jsonError(w, "invalid request body", err, http.StatusBadRequest)
		return
	}
	rel.ID = generateID()
	if err := validate.Struct(rel); err != nil {
		h.jsonError(w, fmt.Sprintf("validation error: %s", err), nil, http.StatusBadRequest)
		return
	}
	if err := h.relationships.Create(&rel); err != nil {
		h.jsonError(w, "failed to create relationship", err, http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusCreated)
	h.jsonOK(w, rel)
}

func (h *Handler) deleteRelationship(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if err := h.relationships.Delete(id); err != nil {
		h.jsonError(w, "failed to delete relationship", err, http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

// --- Tag endpoints ---

func (h *Handler) listTags(w http.ResponseWriter, r *http.Request) {
	tags, err := h.tags.ListAll()
	if err != nil {
		h.jsonError(w, "failed to list tags", err, http.StatusInternalServerError)
		return
	}
	h.jsonOK(w, tags)
}

func (h *Handler) createTag(w http.ResponseWriter, r *http.Request) {
	var t domain.Tag
	if err := json.NewDecoder(r.Body).Decode(&t); err != nil {
		h.jsonError(w, "invalid request body", err, http.StatusBadRequest)
		return
	}
	t.ID = generateID()
	if err := validate.Struct(t); err != nil {
		h.jsonError(w, fmt.Sprintf("validation error: %s", err), nil, http.StatusBadRequest)
		return
	}
	if err := h.tags.Create(&t); err != nil {
		h.jsonError(w, "failed to create tag", err, http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusCreated)
	h.jsonOK(w, t)
}

func (h *Handler) deleteTag(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if err := h.tags.Delete(id); err != nil {
		h.jsonError(w, "failed to delete tag", err, http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (h *Handler) assignTag(w http.ResponseWriter, r *http.Request) {
	stakeholderID := chi.URLParam(r, "id")
	tagID := chi.URLParam(r, "tagId")
	if err := h.tags.AssignToStakeholder(stakeholderID, tagID); err != nil {
		h.jsonError(w, "failed to assign tag", err, http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusCreated)
	h.jsonOK(w, map[string]string{"status": "assigned"})
}

func (h *Handler) removeTag(w http.ResponseWriter, r *http.Request) {
	stakeholderID := chi.URLParam(r, "id")
	tagID := chi.URLParam(r, "tagId")
	if err := h.tags.RemoveFromStakeholder(stakeholderID, tagID); err != nil {
		h.jsonError(w, "failed to remove tag", err, http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

// --- Communication Plan endpoints ---

func (h *Handler) createCommPlan(w http.ResponseWriter, r *http.Request) {
	var cp domain.CommunicationPlan
	if err := json.NewDecoder(r.Body).Decode(&cp); err != nil {
		h.jsonError(w, "invalid JSON", err, http.StatusBadRequest)
		return
	}
	cp.ID = uuid.New().String()
	if err := validate.Struct(cp); err != nil {
		h.jsonError(w, fmt.Sprintf("validation error: %s", err), nil, http.StatusBadRequest)
		return
	}
	if err := h.commPlans.Create(&cp); err != nil {
		h.jsonError(w, "create failed", err, http.StatusInternalServerError)
		return
	}
	h.jsonOK(w, cp)
}

func (h *Handler) logCommContact(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	today := time.Now().Format("2006-01-02")
	if err := h.commPlans.UpdateLastContact(id, today); err != nil {
		h.jsonError(w, "update failed", err, http.StatusInternalServerError)
		return
	}
	h.jsonOK(w, map[string]string{"status": "ok", "date": today})
}

func (h *Handler) deleteCommPlan(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if err := h.commPlans.Delete(id); err != nil {
		h.jsonError(w, "delete failed", err, http.StatusInternalServerError)
		return
	}
	h.jsonOK(w, map[string]string{"status": "deleted"})
}

// --- AI endpoints ---

func (h *Handler) aiChat(w http.ResponseWriter, r *http.Request) {
	var req service.ChatRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		h.jsonError(w, "invalid request body", err, http.StatusBadRequest)
		return
	}
	resp, err := h.ai.Chat(req)
	if err != nil {
		h.jsonError(w, "AI chat error", err, http.StatusInternalServerError)
		return
	}
	h.jsonOK(w, resp)
}

func (h *Handler) aiMeetingBrief(w http.ResponseWriter, r *http.Request) {
	var input struct {
		StakeholderID string `json:"stakeholder_id"`
		ProjectID     string `json:"project_id"`
	}
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		h.jsonError(w, "invalid request body", err, http.StatusBadRequest)
		return
	}
	resp, err := h.ai.GenerateMeetingBrief(input.StakeholderID, input.ProjectID)
	if err != nil {
		h.jsonError(w, "AI error", err, http.StatusInternalServerError)
		return
	}
	h.jsonOK(w, resp)
}

func (h *Handler) aiEmailDraft(w http.ResponseWriter, r *http.Request) {
	var input struct {
		StakeholderID string `json:"stakeholder_id"`
		ProjectID     string `json:"project_id"`
		Purpose       string `json:"purpose"`
	}
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		h.jsonError(w, "invalid request body", err, http.StatusBadRequest)
		return
	}
	resp, err := h.ai.GenerateEmailDraft(input.StakeholderID, input.ProjectID, input.Purpose)
	if err != nil {
		h.jsonError(w, "AI error", err, http.StatusInternalServerError)
		return
	}
	h.jsonOK(w, resp)
}

func (h *Handler) aiAnalyzeBlockers(w http.ResponseWriter, r *http.Request) {
	var input struct {
		ProjectID string `json:"project_id"`
	}
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		h.jsonError(w, "invalid request body", err, http.StatusBadRequest)
		return
	}
	resp, err := h.ai.AnalyzeBlockers(input.ProjectID)
	if err != nil {
		h.jsonError(w, "AI error", err, http.StatusInternalServerError)
		return
	}
	h.jsonOK(w, resp)
}

// --- Export endpoints ---

func (h *Handler) exportStakeholdersCSV(w http.ResponseWriter, r *http.Request) {
	projectID := r.URL.Query().Get("project_id")
	w.Header().Set("Content-Type", "text/csv")
	w.Header().Set("Content-Disposition", "attachment; filename=stakeholders.csv")
	if err := h.export.ExportStakeholdersCSV(w, projectID); err != nil {
		h.logger.Error("CSV export error", "error", err)
	}
}

func (h *Handler) exportStakeholdersJSON(w http.ResponseWriter, r *http.Request) {
	projectID := r.URL.Query().Get("project_id")
	w.Header().Set("Content-Disposition", "attachment; filename=stakeholders.json")
	if err := h.export.ExportStakeholdersJSON(w, projectID); err != nil {
		h.logger.Error("JSON export error", "error", err)
	}
}

func (h *Handler) exportFullJSON(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Disposition", "attachment; filename=stakeholder-tool-export.json")
	if err := h.export.ExportFullJSON(w); err != nil {
		h.logger.Error("full export error", "error", err)
	}
}

func (h *Handler) importStakeholdersCSV(w http.ResponseWriter, r *http.Request) {
	file, _, err := r.FormFile("file")
	if err != nil {
		h.jsonError(w, "no file provided", err, http.StatusBadRequest)
		return
	}
	defer file.Close()

	count, err := h.export.ImportStakeholdersCSV(file)
	if err != nil {
		h.jsonError(w, "import error", err, http.StatusInternalServerError)
		return
	}
	h.jsonOK(w, map[string]interface{}{"imported": count})
}

func (h *Handler) importFullJSON(w http.ResponseWriter, r *http.Request) {
	file, _, err := r.FormFile("file")
	if err != nil {
		// Also try reading directly from body (for non-multipart requests)
		result, err2 := h.export.ImportFullJSON(r.Body)
		if err2 != nil {
			h.jsonError(w, "import error: provide a JSON file", err2, http.StatusBadRequest)
			return
		}
		h.jsonOK(w, result)
		return
	}
	defer file.Close()

	result, err := h.export.ImportFullJSON(file)
	if err != nil {
		h.jsonError(w, "import error", err, http.StatusInternalServerError)
		return
	}
	h.jsonOK(w, result)
}

// --- Health ---

func (h *Handler) healthCheck(w http.ResponseWriter, r *http.Request) {
	h.jsonOK(w, map[string]string{"status": "ok", "version": "1.0.0"})
}

// --- JSON helpers ---

func (h *Handler) jsonOK(w http.ResponseWriter, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(data); err != nil {
		h.logger.Error("json encode error", "error", err)
	}
}

func (h *Handler) jsonError(w http.ResponseWriter, msg string, err error, status int) {
	if err != nil {
		h.logger.Error(msg, "error", err)
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(map[string]string{"error": msg})
}

func generateID() string {
	return uuid.New().String()
}
