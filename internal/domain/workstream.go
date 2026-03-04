package domain

// Workstream represents a track of work within a project.
type Workstream struct {
	ID          string `json:"id" validate:"required,uuid"`
	ProjectID   string `json:"project_id" validate:"required,uuid"`
	Name        string `json:"name" validate:"required,min=1,max=255"`
	Description string `json:"description" validate:"max=2000"`
}
