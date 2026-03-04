// Package main is the entry point for the stakeholder-tool MCP server.
// It runs over stdio transport for integration with AI agents like Cursor, Claude, etc.
package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log/slog"
	"os"

	"github.com/andreahall12/stakeholder-tool/internal/config"
	"github.com/andreahall12/stakeholder-tool/internal/domain"
	"github.com/andreahall12/stakeholder-tool/internal/repository/sqlite"
	"github.com/andreahall12/stakeholder-tool/internal/service"
)

func main() {
	logger := slog.New(slog.NewTextHandler(os.Stderr, &slog.HandlerOptions{
		Level: slog.LevelInfo,
	}))

	cfg, err := config.Load()
	if err != nil {
		logger.Error("failed to load config", "error", err)
		os.Exit(1)
	}

	db, err := sqlite.New(cfg.DBPath, logger)
	if err != nil {
		logger.Error("failed to open database", "error", err)
		os.Exit(1)
	}
	defer db.Close()

	// Create services
	stakeholderSvc := service.NewStakeholderService(db, logger)
	projectSvc := service.NewProjectService(db, logger)
	dashboardSvc := service.NewDashboardService(db, logger)

	// Run MCP server over stdio using JSON-RPC 2.0 protocol
	server := &MCPServer{
		stakeholderSvc: stakeholderSvc,
		projectSvc:     projectSvc,
		dashboardSvc:   dashboardSvc,
		logger:         logger,
	}

	logger.Info("MCP server starting (stdio transport)")
	if err := server.Run(context.Background()); err != nil {
		logger.Error("MCP server error", "error", err)
		os.Exit(1)
	}
}

// MCPServer implements the Model Context Protocol server.
type MCPServer struct {
	stakeholderSvc *service.StakeholderService
	projectSvc     *service.ProjectService
	dashboardSvc   *service.DashboardService
	logger         *slog.Logger
}

// JSON-RPC 2.0 message types
type jsonRPCRequest struct {
	JSONRPC string          `json:"jsonrpc"`
	ID      interface{}     `json:"id,omitempty"`
	Method  string          `json:"method"`
	Params  json.RawMessage `json:"params,omitempty"`
}

type jsonRPCResponse struct {
	JSONRPC string      `json:"jsonrpc"`
	ID      interface{} `json:"id,omitempty"`
	Result  interface{} `json:"result,omitempty"`
	Error   *rpcError   `json:"error,omitempty"`
}

type rpcError struct {
	Code    int    `json:"code"`
	Message string `json:"message"`
}

// Run starts the MCP server reading from stdin and writing to stdout.
func (s *MCPServer) Run(ctx context.Context) error {
	dec := json.NewDecoder(os.Stdin)
	enc := json.NewEncoder(os.Stdout)

	for {
		select {
		case <-ctx.Done():
			return ctx.Err()
		default:
		}

		var req jsonRPCRequest
		if err := dec.Decode(&req); err != nil {
			return fmt.Errorf("decoding request: %w", err)
		}

		resp := s.handleRequest(req)
		if err := enc.Encode(resp); err != nil {
			return fmt.Errorf("encoding response: %w", err)
		}
	}
}

func (s *MCPServer) handleRequest(req jsonRPCRequest) jsonRPCResponse {
	switch req.Method {
	case "initialize":
		return s.handleInitialize(req)
	case "tools/list":
		return s.handleToolsList(req)
	case "tools/call":
		return s.handleToolCall(req)
	default:
		return jsonRPCResponse{
			JSONRPC: "2.0",
			ID:      req.ID,
			Error:   &rpcError{Code: -32601, Message: "method not found: " + req.Method},
		}
	}
}

func (s *MCPServer) handleInitialize(req jsonRPCRequest) jsonRPCResponse {
	return jsonRPCResponse{
		JSONRPC: "2.0",
		ID:      req.ID,
		Result: map[string]interface{}{
			"protocolVersion": "2024-11-05",
			"capabilities": map[string]interface{}{
				"tools": map[string]bool{"listChanged": false},
			},
			"serverInfo": map[string]string{
				"name":    "stakeholder-tool",
				"version": "1.0.0",
			},
		},
	}
}

func (s *MCPServer) handleToolsList(req jsonRPCRequest) jsonRPCResponse {
	tools := []map[string]interface{}{
		{
			"name":        "list_stakeholders",
			"description": "List all stakeholders, optionally filtered by project, influence level, or support level",
			"inputSchema": map[string]interface{}{
				"type": "object",
				"properties": map[string]interface{}{
					"project_id":      map[string]string{"type": "string", "description": "Filter by project ID"},
					"influence_level": map[string]string{"type": "string", "description": "Filter by influence level: high, medium, low"},
					"support_level":   map[string]string{"type": "string", "description": "Filter by support level: champion, supporter, neutral, resistant"},
				},
			},
		},
		{
			"name":        "get_stakeholder",
			"description": "Get detailed information about a specific stakeholder by ID",
			"inputSchema": map[string]interface{}{
				"type":     "object",
				"required": []string{"id"},
				"properties": map[string]interface{}{
					"id": map[string]string{"type": "string", "description": "Stakeholder ID (UUID)"},
				},
			},
		},
		{
			"name":        "list_projects",
			"description": "List all projects with stakeholder and workstream counts",
			"inputSchema": map[string]interface{}{"type": "object", "properties": map[string]interface{}{}},
		},
		{
			"name":        "get_dashboard_kpis",
			"description": "Get dashboard KPIs for a project: stakeholder counts by influence/support, blockers, RACI gaps",
			"inputSchema": map[string]interface{}{
				"type":     "object",
				"required": []string{"project_id"},
				"properties": map[string]interface{}{
					"project_id": map[string]string{"type": "string", "description": "Project ID"},
				},
			},
		},
		{
			"name":        "search_stakeholders",
			"description": "Search stakeholders by name, job title, or department",
			"inputSchema": map[string]interface{}{
				"type":     "object",
				"required": []string{"query"},
				"properties": map[string]interface{}{
					"query": map[string]string{"type": "string", "description": "Search term"},
				},
			},
		},
		{
			"name":        "create_stakeholder",
			"description": "Create a new stakeholder",
			"inputSchema": map[string]interface{}{
				"type":     "object",
				"required": []string{"name"},
				"properties": map[string]interface{}{
					"name":            map[string]string{"type": "string", "description": "Stakeholder name"},
					"job_title":       map[string]string{"type": "string", "description": "Job title"},
					"department":      map[string]string{"type": "string", "description": "Department"},
					"email":           map[string]string{"type": "string", "description": "Email address"},
					"influence_level": map[string]string{"type": "string", "description": "high, medium, or low"},
					"support_level":   map[string]string{"type": "string", "description": "champion, supporter, neutral, or resistant"},
				},
			},
		},
	}

	return jsonRPCResponse{
		JSONRPC: "2.0",
		ID:      req.ID,
		Result:  map[string]interface{}{"tools": tools},
	}
}

func (s *MCPServer) handleToolCall(req jsonRPCRequest) jsonRPCResponse {
	var params struct {
		Name      string          `json:"name"`
		Arguments json.RawMessage `json:"arguments"`
	}
	if err := json.Unmarshal(req.Params, &params); err != nil {
		return jsonRPCResponse{
			JSONRPC: "2.0", ID: req.ID,
			Error: &rpcError{Code: -32602, Message: "invalid params"},
		}
	}

	var result interface{}
	var err error

	switch params.Name {
	case "list_stakeholders":
		result, err = s.toolListStakeholders(params.Arguments)
	case "get_stakeholder":
		result, err = s.toolGetStakeholder(params.Arguments)
	case "list_projects":
		result, err = s.toolListProjects()
	case "get_dashboard_kpis":
		result, err = s.toolGetDashboardKPIs(params.Arguments)
	case "search_stakeholders":
		result, err = s.toolSearchStakeholders(params.Arguments)
	case "create_stakeholder":
		result, err = s.toolCreateStakeholder(params.Arguments)
	default:
		return jsonRPCResponse{
			JSONRPC: "2.0", ID: req.ID,
			Error: &rpcError{Code: -32602, Message: "unknown tool: " + params.Name},
		}
	}

	if err != nil {
		return jsonRPCResponse{
			JSONRPC: "2.0", ID: req.ID,
			Result: map[string]interface{}{
				"content": []map[string]string{{"type": "text", "text": "Error: " + err.Error()}},
				"isError": true,
			},
		}
	}

	text, _ := json.MarshalIndent(result, "", "  ")
	return jsonRPCResponse{
		JSONRPC: "2.0", ID: req.ID,
		Result: map[string]interface{}{
			"content": []map[string]string{{"type": "text", "text": string(text)}},
		},
	}
}

func (s *MCPServer) toolListStakeholders(args json.RawMessage) (interface{}, error) {
	var input struct {
		ProjectID      string `json:"project_id"`
		InfluenceLevel string `json:"influence_level"`
		SupportLevel   string `json:"support_level"`
	}
	json.Unmarshal(args, &input)

	if input.ProjectID != "" {
		return s.stakeholderSvc.ListByProject(input.ProjectID)
	}
	filters := map[string]string{
		"influence_level": input.InfluenceLevel,
		"support_level":   input.SupportLevel,
	}
	return s.stakeholderSvc.List(filters)
}

func (s *MCPServer) toolGetStakeholder(args json.RawMessage) (interface{}, error) {
	var input struct {
		ID string `json:"id"`
	}
	json.Unmarshal(args, &input)
	return s.stakeholderSvc.GetByID(input.ID)
}

func (s *MCPServer) toolListProjects() (interface{}, error) {
	return s.projectSvc.ListWithDetails()
}

func (s *MCPServer) toolGetDashboardKPIs(args json.RawMessage) (interface{}, error) {
	var input struct {
		ProjectID string `json:"project_id"`
	}
	json.Unmarshal(args, &input)
	return s.dashboardSvc.GetKPIs(input.ProjectID)
}

func (s *MCPServer) toolSearchStakeholders(args json.RawMessage) (interface{}, error) {
	var input struct {
		Query string `json:"query"`
	}
	json.Unmarshal(args, &input)
	return s.stakeholderSvc.List(map[string]string{"search": input.Query})
}

func (s *MCPServer) toolCreateStakeholder(args json.RawMessage) (interface{}, error) {
	var sh domain.Stakeholder
	if err := json.Unmarshal(args, &sh); err != nil {
		return nil, fmt.Errorf("invalid input: %w", err)
	}
	if err := s.stakeholderSvc.Create(&sh); err != nil {
		return nil, err
	}
	return sh, nil
}
