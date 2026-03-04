package domain

// Tag provides a color-coded label for categorizing stakeholders.
type Tag struct {
	ID    string `json:"id" validate:"required,uuid"`
	Name  string `json:"name" validate:"required,min=1,max=100"`
	Color string `json:"color" validate:"required,hexcolor"`
}

// StakeholderTag is the join table linking stakeholders to tags (many-to-many).
type StakeholderTag struct {
	StakeholderID string `json:"stakeholder_id" validate:"required,uuid"`
	TagID         string `json:"tag_id" validate:"required,uuid"`
}
