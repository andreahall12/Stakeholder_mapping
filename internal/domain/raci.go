package domain

// RACIRole represents the responsibility assignment type.
type RACIRole string

const (
	RACIResponsible RACIRole = "R" // Does the work
	RACIAccountable RACIRole = "A" // Owns the outcome
	RACIConsulted   RACIRole = "C" // Provides input
	RACIInformed    RACIRole = "I" // Kept updated
)

// RACIAssignment links a project-stakeholder to a workstream with a RACI role.
type RACIAssignment struct {
	ID                   string   `json:"id" validate:"required,uuid"`
	ProjectStakeholderID string   `json:"project_stakeholder_id" validate:"required,uuid"`
	WorkstreamID         string   `json:"workstream_id" validate:"required,uuid"`
	Role                 RACIRole `json:"role" validate:"required,oneof=R A C I"`
}

// RACIWithNames extends RACIAssignment with resolved names for display.
type RACIWithNames struct {
	RACIAssignment
	StakeholderName string `json:"stakeholder_name"`
	WorkstreamName  string `json:"workstream_name"`
}
