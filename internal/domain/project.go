package domain

import "time"

// Project represents a program or initiative being managed.
type Project struct {
	ID          string        `json:"id" validate:"required,uuid"`
	Name        string        `json:"name" validate:"required,min=1,max=255"`
	Description string        `json:"description" validate:"max=2000"`
	Status      ProjectStatus `json:"status" validate:"required,oneof=active archived planning"`
	CreatedAt   time.Time     `json:"created_at"`
}

// ProjectStatus represents the lifecycle state of a project.
type ProjectStatus string

const (
	ProjectActive   ProjectStatus = "active"
	ProjectArchived ProjectStatus = "archived"
	ProjectPlanning ProjectStatus = "planning"
)

// ProjectStakeholder is the join table linking stakeholders to projects.
// A stakeholder can have a different function/role in each project.
type ProjectStakeholder struct {
	ID              string `json:"id" validate:"required,uuid"`
	ProjectID       string `json:"project_id" validate:"required,uuid"`
	StakeholderID   string `json:"stakeholder_id" validate:"required,uuid"`
	ProjectFunction string `json:"project_function" validate:"max=255"`
}

// ProjectWithDetails extends Project with computed fields for the UI.
type ProjectWithDetails struct {
	Project
	WorkstreamCount  int `json:"workstream_count"`
	StakeholderCount int `json:"stakeholder_count"`
}
