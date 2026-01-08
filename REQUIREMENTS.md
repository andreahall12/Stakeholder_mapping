# Stakeholder Mapping Tool - Requirements Document

## Document Information
- **Version**: 1.0
- **Last Updated**: January 2026
- **Status**: Implemented

---

## 1. Introduction

### 1.1 Purpose
This document defines the functional and non-functional requirements for the Stakeholder Mapping Tool, a desktop/web application designed to help program managers identify, track, and manage stakeholders across projects.

### 1.2 Scope
The application enables users to:
- Manage multiple projects with associated stakeholders
- Visualize stakeholder relationships and influence
- Track engagement and communication
- Generate reports and exports

### 1.3 Target Users
- Program Managers
- Project Managers
- Product Managers
- Change Management Professionals
- Executive Assistants managing stakeholder relationships

---

## 2. Functional Requirements

### 2.1 Project Management

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-PM-01 | Users can create new projects with name and description | High | Done |
| FR-PM-02 | Users can switch between multiple projects | High | Done |
| FR-PM-03 | Users can archive or delete projects | Medium | Done |
| FR-PM-04 | Each project maintains independent stakeholder assignments | High | Done |

### 2.2 Stakeholder Management

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-SM-01 | Users can create stakeholders with: name, job title, department, email, Slack handle | High | Done |
| FR-SM-02 | Users can set influence level (High/Medium/Low) | High | Done |
| FR-SM-03 | Users can set support level (Champion/Supporter/Neutral/Resistant) | High | Done |
| FR-SM-04 | Users can add free-text notes to stakeholders | Medium | Done |
| FR-SM-05 | Users can assign stakeholders to projects with a project function | High | Done |
| FR-SM-06 | Users can search and filter stakeholders | High | Done |
| FR-SM-07 | Users can bulk update multiple stakeholders | Medium | Done |
| FR-SM-08 | Users can import stakeholders from CSV | Medium | Done |
| FR-SM-09 | Users can add stakeholders via natural language AI input | Low | Done |
| FR-SM-10 | Users can apply colored tags to stakeholders | Medium | Done |

### 2.3 Workstream Management

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-WS-01 | Users can create workstreams within a project | High | Done |
| FR-WS-02 | Users can edit and delete workstreams | Medium | Done |
| FR-WS-03 | Workstreams are displayed in RACI matrix | High | Done |

### 2.4 RACI Matrix

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-RACI-01 | Users can assign R/A/C/I roles per stakeholder per workstream | High | Done |
| FR-RACI-02 | RACI matrix displays all stakeholders vs all workstreams | High | Done |
| FR-RACI-03 | System identifies workstreams missing Responsible role | Medium | Done |
| FR-RACI-04 | System identifies workstreams missing Accountable role | Medium | Done |
| FR-RACI-05 | RACI gaps are displayed on dashboard | Medium | Done |

### 2.5 Communication Planning

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-CP-01 | Users can set communication channel per stakeholder (Email/Slack/Meeting/etc.) | High | Done |
| FR-CP-02 | Users can set communication frequency (Daily/Weekly/Biweekly/Monthly/Quarterly) | High | Done |
| FR-CP-03 | System tracks last contact date per stakeholder | Medium | Done |
| FR-CP-04 | System alerts when stakeholder is overdue for contact | Medium | Done |

### 2.6 Engagement Logging

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-EL-01 | Users can log engagements (Meeting/Email/Call/Decision/Note) | Medium | Done |
| FR-EL-02 | Each engagement has date, type, summary, and sentiment | Medium | Done |
| FR-EL-03 | Sentiment options: Positive, Neutral, Negative | Medium | Done |
| FR-EL-04 | Logging engagement updates last contact date | Medium | Done |

### 2.7 Visualization Views

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-VZ-01 | Dashboard view shows KPIs and alerts | High | Done |
| FR-VZ-02 | Network graph shows stakeholder connections | High | Done |
| FR-VZ-03 | Influence matrix shows 2x2 quadrant (Influence vs Support) | High | Done |
| FR-VZ-04 | Org chart shows hierarchical structure | Medium | Done |
| FR-VZ-05 | RACI matrix is editable inline | High | Done |

### 2.8 Relationships

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-RL-01 | Users can define relationships between stakeholders | Medium | Done |
| FR-RL-02 | Relationship types: Reports To, Influences, Allied With, Conflicts With | Medium | Done |
| FR-RL-03 | Relationship strength: Strong, Moderate, Weak | Low | Done |

### 2.9 Tags System

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-TG-01 | Users can create tags with custom names and colors | Medium | Done |
| FR-TG-02 | Users can assign multiple tags to stakeholders | Medium | Done |
| FR-TG-03 | Users can filter stakeholders by tag | Medium | Done |

### 2.10 Export and Reporting

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-EX-01 | Users can export stakeholders to CSV | High | Done |
| FR-EX-02 | Users can export RACI assignments to CSV | Medium | Done |
| FR-EX-03 | Users can export communication plans to CSV | Medium | Done |
| FR-EX-04 | Users can export all data to JSON | Medium | Done |
| FR-EX-05 | Users can export full database backup | High | Done |
| FR-EX-06 | Users can generate PDF stakeholder landscape report | Medium | Done |

### 2.11 AI Features

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-AI-01 | Users can ask natural language questions about stakeholders | Medium | Done |
| FR-AI-02 | AI parses questions into database queries | Medium | Done |
| FR-AI-03 | AI can create stakeholders from natural language input | Low | Done |

### 2.12 User Interface

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-UI-01 | Anonymous mode hides all stakeholder names | Medium | Done |
| FR-UI-02 | Keyboard shortcuts for common actions | Low | Done |
| FR-UI-03 | Saved filter views persist in local storage | Medium | Done |
| FR-UI-04 | Scenario planning allows simulating support changes | Low | Done |
| FR-UI-05 | Notification banner shows critical alerts | Medium | Done |

---

## 3. Non-Functional Requirements

### 3.1 Performance

| ID | Requirement | Target |
|----|-------------|--------|
| NFR-PF-01 | Page load time | Under 2 seconds |
| NFR-PF-02 | Support up to 500 stakeholders per project | Verified |
| NFR-PF-03 | Visualization renders within 1 second | Verified |

### 3.2 Usability

| ID | Requirement |
|----|-------------|
| NFR-US-01 | Non-technical users can operate without training |
| NFR-US-02 | All primary actions accessible within 3 clicks |
| NFR-US-03 | Responsive design works on tablet-sized screens |
| NFR-US-04 | Dark theme optimized for extended use |

### 3.3 Reliability

| ID | Requirement |
|----|-------------|
| NFR-RL-01 | Data persists across browser sessions |
| NFR-RL-02 | No data loss on page refresh |
| NFR-RL-03 | Export functionality available offline |

### 3.4 Security

| ID | Requirement |
|----|-------------|
| NFR-SC-01 | Data stored locally only (no cloud transmission) |
| NFR-SC-02 | Anonymous mode for sensitive presentations |
| NFR-SC-03 | AI processing runs locally via Ollama |

### 3.5 Compatibility

| ID | Requirement |
|----|-------------|
| NFR-CM-01 | Works in Chrome 100+, Firefox 100+, Safari 15+ |
| NFR-CM-02 | Desktop app runs on macOS 12+, Windows 10+ |
| NFR-CM-03 | No external dependencies required for core features |

---

## 4. User Stories

### 4.1 Stakeholder Identification

**US-01: As a program manager, I want to add a new stakeholder quickly so that I can capture their details during a meeting.**

Acceptance Criteria:
- Can add stakeholder with just a name
- Optional fields dont block creation
- AI Quick Add parses natural language

**US-02: As a program manager, I want to import stakeholders from a spreadsheet so that I can migrate from existing tools.**

Acceptance Criteria:
- Accepts CSV format
- Maps columns automatically where possible
- Shows preview before import

### 4.2 Stakeholder Analysis

**US-03: As a program manager, I want to see which stakeholders have high influence but low support so that I can prioritize engagement.**

Acceptance Criteria:
- Influence matrix highlights this quadrant
- Dashboard shows "blockers" count
- Filter by influence + support combination

**US-04: As a program manager, I want to track support level changes over time so that I can measure progress.**

Acceptance Criteria:
- History records influence/support changes
- Timestamp on each change
- Viewable in stakeholder details

### 4.3 Communication Management

**US-05: As a program manager, I want to be alerted when I have not contacted a stakeholder according to their plan so that I maintain relationships.**

Acceptance Criteria:
- Dashboard shows overdue contacts
- Calculates based on frequency setting
- Logging engagement resets the timer

**US-06: As a program manager, I want to record the outcome of each meeting so that I have a history of interactions.**

Acceptance Criteria:
- Engagement log captures date, type, summary
- Sentiment tag for quick scanning
- Chronological history view

### 4.4 Reporting

**US-07: As a program manager, I want to export a PDF report for executive briefings so that I can share without tool access.**

Acceptance Criteria:
- One-click PDF generation
- Includes key metrics and stakeholder list
- Highlights risks and blockers

**US-08: As a program manager, I want to present stakeholder data anonymously so that I can discuss sensitive topics.**

Acceptance Criteria:
- One-click toggle
- All names replaced with letters
- Affects all views consistently

---

## 5. Data Requirements

### 5.1 Entity Definitions

| Entity | Key Fields |
|--------|------------|
| Project | id, name, description, status, createdAt |
| Stakeholder | id, name, jobTitle, department, email, slack, influenceLevel, supportLevel, notes |
| Workstream | id, projectId, name, description |
| ProjectStakeholder | id, projectId, stakeholderId, projectFunction |
| RACIAssignment | id, projectStakeholderId, workstreamId, role |
| CommunicationPlan | id, projectStakeholderId, channel, frequency, notes, lastContactDate |
| EngagementLog | id, projectStakeholderId, date, type, summary, sentiment, createdAt |
| StakeholderHistory | id, stakeholderId, field, oldValue, newValue, changedAt |
| Tag | id, name, color |
| Relationship | id, fromStakeholderId, toStakeholderId, type, strength |

### 5.2 Data Retention
- All data stored in browser localStorage
- Full export available for backup
- No automatic deletion

---

## 6. Constraints

1. **Browser-based storage**: Data size limited by localStorage quota (typically 5-10MB)
2. **Local AI**: Requires Ollama installed separately for AI features
3. **Single user**: No multi-user collaboration in current version
4. **No sync**: Data does not sync across devices

---

## 7. Future Considerations

- Cloud storage option for team collaboration
- Mobile companion app
- Integration with project management tools (Jira, Asana)
- Email/calendar integration for automatic engagement logging
- Stakeholder sentiment analysis from email content
