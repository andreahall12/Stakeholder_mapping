package domain

import "time"

// CommunicationChannel is the medium used to communicate with a stakeholder.
type CommunicationChannel string

const (
	ChannelEmail    CommunicationChannel = "email"
	ChannelSlack    CommunicationChannel = "slack"
	ChannelJira     CommunicationChannel = "jira"
	ChannelBriefing CommunicationChannel = "briefing"
	ChannelMeeting  CommunicationChannel = "meeting"
	ChannelOther    CommunicationChannel = "other"
)

// CommunicationFrequency defines how often to contact a stakeholder.
type CommunicationFrequency string

const (
	FreqDaily     CommunicationFrequency = "daily"
	FreqWeekly    CommunicationFrequency = "weekly"
	FreqBiweekly  CommunicationFrequency = "biweekly"
	FreqMonthly   CommunicationFrequency = "monthly"
	FreqQuarterly CommunicationFrequency = "quarterly"
	FreqAsNeeded  CommunicationFrequency = "as-needed"
)

// CommunicationPlan defines the expected communication cadence with a stakeholder.
type CommunicationPlan struct {
	ID                   string                 `json:"id" validate:"required,uuid"`
	ProjectStakeholderID string                 `json:"project_stakeholder_id" validate:"required,uuid"`
	Channel              CommunicationChannel   `json:"channel" validate:"required,oneof=email slack jira briefing meeting other"`
	Frequency            CommunicationFrequency `json:"frequency" validate:"required,oneof=daily weekly biweekly monthly quarterly as-needed"`
	Notes                string                 `json:"notes" validate:"max=2000"`
	LastContactDate      *time.Time             `json:"last_contact_date"`
}

// EngagementType classifies the type of interaction logged.
type EngagementType string

const (
	EngagementMeeting  EngagementType = "meeting"
	EngagementEmail    EngagementType = "email"
	EngagementCall     EngagementType = "call"
	EngagementDecision EngagementType = "decision"
	EngagementNote     EngagementType = "note"
)

// Sentiment represents the tone of an engagement.
type Sentiment string

const (
	SentimentPositive Sentiment = "positive"
	SentimentNeutral  Sentiment = "neutral"
	SentimentNegative Sentiment = "negative"
)

// EngagementLog records an interaction with a stakeholder.
type EngagementLog struct {
	ID                   string         `json:"id" validate:"required,uuid"`
	ProjectStakeholderID string         `json:"project_stakeholder_id" validate:"required,uuid"`
	Date                 string         `json:"date" validate:"required"`
	Type                 EngagementType `json:"type" validate:"required,oneof=meeting email call decision note"`
	Summary              string         `json:"summary" validate:"required,min=1,max=5000"`
	Sentiment            Sentiment      `json:"sentiment" validate:"required,oneof=positive neutral negative"`
	CreatedAt            time.Time      `json:"created_at"`
}
