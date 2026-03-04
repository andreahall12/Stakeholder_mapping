package domain

// SavedFilter stores a reusable set of filter criteria for the stakeholder grid.
type SavedFilter struct {
	ID      string            `json:"id" validate:"required,uuid"`
	Name    string            `json:"name" validate:"required,min=1,max=100"`
	Filters map[string]string `json:"filters"`
}

// ViewType represents one of the five main application views.
type ViewType string

const (
	ViewDashboard  ViewType = "dashboard"
	ViewNetwork    ViewType = "network"
	ViewInfluence  ViewType = "influence"
	ViewOrgChart   ViewType = "orgchart"
	ViewRACI       ViewType = "raci"
)

// ChatMessage represents a message in the AI chat panel.
type ChatMessage struct {
	ID        string `json:"id"`
	Role      string `json:"role" validate:"required,oneof=user assistant"`
	Content   string `json:"content" validate:"required,min=1"`
	Timestamp string `json:"timestamp"`
}
