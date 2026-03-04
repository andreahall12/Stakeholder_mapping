// Package domain defines the core business entities for the stakeholder mapping tool.
// All structs use validation tags from go-playground/validator for input sanitization.
package domain

import "time"

// Stakeholder represents a person involved in a project.
// Stakeholders are global and can be assigned to multiple projects.
type Stakeholder struct {
	ID             string         `json:"id" validate:"required,uuid"`
	Name           string         `json:"name" validate:"required,min=1,max=255"`
	JobTitle       string         `json:"job_title" validate:"max=255"`
	Department     string         `json:"department" validate:"max=255"`
	Email          string         `json:"email" validate:"omitempty,email,max=255"`
	Slack          string         `json:"slack" validate:"max=255"`
	InfluenceLevel InfluenceLevel `json:"influence_level" validate:"required,oneof=high medium low"`
	SupportLevel   SupportLevel   `json:"support_level" validate:"required,oneof=champion supporter neutral resistant"`
	Notes          string         `json:"notes" validate:"max=5000"`
}

// InfluenceLevel represents how much decision-making power a stakeholder has.
type InfluenceLevel string

const (
	InfluenceHigh   InfluenceLevel = "high"
	InfluenceMedium InfluenceLevel = "medium"
	InfluenceLow    InfluenceLevel = "low"
)

// SupportLevel represents a stakeholder's attitude toward the project.
type SupportLevel string

const (
	SupportChampion  SupportLevel = "champion"
	SupportSupporter SupportLevel = "supporter"
	SupportNeutral   SupportLevel = "neutral"
	SupportResistant SupportLevel = "resistant"
)

// StakeholderHistory tracks changes to a stakeholder's influence or support level.
type StakeholderHistory struct {
	ID            string    `json:"id" validate:"required,uuid"`
	StakeholderID string    `json:"stakeholder_id" validate:"required,uuid"`
	Field         string    `json:"field" validate:"required,oneof=influenceLevel supportLevel"`
	OldValue      string    `json:"old_value" validate:"required"`
	NewValue      string    `json:"new_value" validate:"required"`
	ChangedAt     time.Time `json:"changed_at"`
	Notes         string    `json:"notes" validate:"max=2000"`
}
