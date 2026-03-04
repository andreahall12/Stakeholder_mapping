package service

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"strings"
	"time"

	"github.com/andreahall12/stakeholder-tool/internal/config"
	"github.com/andreahall12/stakeholder-tool/internal/repository/sqlite"
)

// AIService provides Ollama-powered AI features for the stakeholder tool.
type AIService struct {
	db     *sqlite.DB
	cfg    *config.Config
	logger *slog.Logger
	client *http.Client
}

// NewAIService creates a new AI service.
func NewAIService(db *sqlite.DB, cfg *config.Config, logger *slog.Logger) *AIService {
	return &AIService{
		db:     db,
		cfg:    cfg,
		logger: logger,
		client: &http.Client{Timeout: 120 * time.Second},
	}
}

// ChatRequest contains a user's message and optional project context.
type ChatRequest struct {
	Message   string `json:"message" validate:"required,min=1,max=5000"`
	ProjectID string `json:"project_id"`
}

// ChatResponse contains the AI assistant's reply.
type ChatResponse struct {
	Content string `json:"content"`
	Error   string `json:"error,omitempty"`
}

// Chat sends a message to Ollama with stakeholder context and returns the response.
func (s *AIService) Chat(req ChatRequest) (*ChatResponse, error) {
	systemPrompt := s.buildSystemPrompt(req.ProjectID)

	ollamaReq := map[string]interface{}{
		"model":  s.cfg.OllamaModel,
		"stream": false,
		"messages": []map[string]string{
			{"role": "system", "content": systemPrompt},
			{"role": "user", "content": req.Message},
		},
	}

	body, err := json.Marshal(ollamaReq)
	if err != nil {
		return nil, fmt.Errorf("marshalling request: %w", err)
	}

	httpReq, err := http.NewRequestWithContext(context.Background(), http.MethodPost, s.cfg.OllamaURL+"/api/chat", bytes.NewReader(body))
	if err != nil {
		return nil, fmt.Errorf("building request: %w", err)
	}
	httpReq.Header.Set("Content-Type", "application/json")
	resp, err := s.client.Do(httpReq)
	if err != nil {
		s.logger.Error("ollama unavailable", "url", s.cfg.OllamaURL, "error", err)
		return &ChatResponse{Error: "AI assistant is not available. Make sure Ollama is installed and running."}, nil
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		respBody, _ := io.ReadAll(resp.Body) //nolint:errcheck // best-effort read of error response
		return &ChatResponse{Error: fmt.Sprintf("Ollama error (status %d): %s", resp.StatusCode, string(respBody))}, nil
	}

	var ollamaResp struct {
		Message struct {
			Content string `json:"content"`
		} `json:"message"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&ollamaResp); err != nil {
		return nil, fmt.Errorf("decoding response: %w", err)
	}

	return &ChatResponse{Content: ollamaResp.Message.Content}, nil
}

// GenerateMeetingBrief creates a meeting preparation brief for a stakeholder.
func (s *AIService) GenerateMeetingBrief(stakeholderID, projectID string) (*ChatResponse, error) {
	context := s.getStakeholderContext(stakeholderID, projectID)
	return s.Chat(ChatRequest{
		Message:   fmt.Sprintf("Generate a concise meeting preparation brief for this stakeholder. Include talking points, potential concerns, and recommended approach.\n\nStakeholder context:\n%s", context),
		ProjectID: projectID,
	})
}

// GenerateEmailDraft creates a draft email to a stakeholder.
func (s *AIService) GenerateEmailDraft(stakeholderID, projectID, purpose string) (*ChatResponse, error) {
	context := s.getStakeholderContext(stakeholderID, projectID)
	return s.Chat(ChatRequest{
		Message:   fmt.Sprintf("Draft a professional email to this stakeholder. Purpose: %s\n\nStakeholder context:\n%s", purpose, context),
		ProjectID: projectID,
	})
}

// AnalyzeBlockers identifies blockers and suggests mitigation strategies.
func (s *AIService) AnalyzeBlockers(projectID string) (*ChatResponse, error) {
	return s.Chat(ChatRequest{
		Message:   "Analyze the current project stakeholders and identify potential blockers. For each blocker, suggest a mitigation strategy. Focus on high-influence resistant or neutral stakeholders.",
		ProjectID: projectID,
	})
}

func (s *AIService) buildSystemPrompt(projectID string) string {
	var sb strings.Builder
	sb.WriteString(`You are a stakeholder management advisor. You help project managers navigate complex stakeholder landscapes. Be concise, specific, and actionable.

Key principles:
- Focus on building coalitions of support
- Identify and mitigate resistance early
- Maintain clear communication cadences
- Use influence mapping to prioritize effort
`)

	if projectID != "" {
		context := s.getProjectContext(projectID)
		sb.WriteString("\nCurrent project context:\n")
		sb.WriteString(context)
	}

	return sb.String()
}

func (s *AIService) getProjectContext(projectID string) string {
	var sb strings.Builder

	// Project info
	var name, status string
	row := s.db.Conn().QueryRow("SELECT name, status FROM projects WHERE id = ?", projectID)
	if row.Scan(&name, &status) == nil {
		fmt.Fprintf(&sb, "Project: %s (Status: %s)\n", name, status)
	}

	// Stakeholder summary
	rows, err := s.db.Conn().Query(`
		SELECT s.name, s.job_title, s.department, s.influence_level, s.support_level
		FROM stakeholders s
		JOIN project_stakeholders ps ON s.id = ps.stakeholder_id
		WHERE ps.project_id = ?`, projectID)
	if err == nil {
		defer rows.Close()
		sb.WriteString("\nStakeholders:\n")
		for rows.Next() {
			var sName, title, dept, influence, support string
			if rows.Scan(&sName, &title, &dept, &influence, &support) == nil {
				fmt.Fprintf(&sb, "- %s (%s, %s): Influence=%s, Support=%s\n", sName, title, dept, influence, support)
			}
		}
	}

	return sb.String()
}

func (s *AIService) getStakeholderContext(stakeholderID, projectID string) string {
	var sb strings.Builder

	var name, title, dept, influence, support, notes string
	row := s.db.Conn().QueryRow(
		"SELECT name, job_title, department, influence_level, support_level, notes FROM stakeholders WHERE id = ?",
		stakeholderID)
	if row.Scan(&name, &title, &dept, &influence, &support, &notes) == nil {
		fmt.Fprintf(&sb, "Name: %s\nTitle: %s\nDepartment: %s\n", name, title, dept)
		fmt.Fprintf(&sb, "Influence: %s\nSupport: %s\n", influence, support)
		if notes != "" {
			fmt.Fprintf(&sb, "Notes: %s\n", notes)
		}
	}

	// Recent engagements
	rows, err := s.db.Conn().Query(`
		SELECT e.date, e.type, e.summary, e.sentiment
		FROM engagement_logs e
		JOIN project_stakeholders ps ON e.project_stakeholder_id = ps.id
		WHERE ps.stakeholder_id = ? AND ps.project_id = ?
		ORDER BY e.date DESC LIMIT 5`, stakeholderID, projectID)
	if err == nil {
		defer rows.Close()
		sb.WriteString("\nRecent engagements:\n")
		for rows.Next() {
			var date, typ, summary, sentiment string
			if rows.Scan(&date, &typ, &summary, &sentiment) == nil {
				fmt.Fprintf(&sb, "- [%s] %s: %s (sentiment: %s)\n", date, typ, summary, sentiment)
			}
		}
	}

	return sb.String()
}
