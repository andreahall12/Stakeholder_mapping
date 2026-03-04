package domain

// RelationshipType defines the nature of the connection between two stakeholders.
type RelationshipType string

const (
	RelReportsTo     RelationshipType = "reports_to"
	RelInfluences    RelationshipType = "influences"
	RelAlliedWith    RelationshipType = "allied_with"
	RelConflictsWith RelationshipType = "conflicts_with"
)

// RelationshipStrength indicates the intensity of the relationship.
type RelationshipStrength string

const (
	StrengthStrong   RelationshipStrength = "strong"
	StrengthModerate RelationshipStrength = "moderate"
	StrengthWeak     RelationshipStrength = "weak"
)

// Relationship models a directed connection between two stakeholders.
type Relationship struct {
	ID                string               `json:"id" validate:"required,uuid"`
	FromStakeholderID string               `json:"from_stakeholder_id" validate:"required,uuid"`
	ToStakeholderID   string               `json:"to_stakeholder_id" validate:"required,uuid"`
	Type              RelationshipType     `json:"type" validate:"required,oneof=reports_to influences allied_with conflicts_with"`
	Strength          RelationshipStrength `json:"strength" validate:"required,oneof=strong moderate weak"`
	Notes             string               `json:"notes" validate:"max=2000"`
}
