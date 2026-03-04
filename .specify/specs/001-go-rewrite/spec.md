# Feature Specification: Go Rewrite

## Overview

Rewrite the Stakeholder Mapping desktop tool from React/TypeScript to Go, maintaining full feature parity while adding REST API, MCP server, and compliance-ontology integration.

## User Stories

### US-1: Program Manager views dashboard
**As a** program manager, **I want to** see a dashboard with KPIs (total stakeholders, RACI gaps, blockers, overdue contacts) **so that** I can quickly assess the health of my stakeholder landscape.

### US-2: Program Manager manages stakeholders
**As a** program manager, **I want to** create, edit, delete, search, and filter stakeholders **so that** I can maintain an accurate stakeholder registry.

### US-3: Program Manager assigns RACI roles
**As a** program manager, **I want to** assign R/A/C/I roles per stakeholder per workstream **so that** responsibilities are clear.

### US-4: Program Manager views network graph
**As a** program manager, **I want to** see an interactive network graph of stakeholder relationships **so that** I can understand influence patterns.

### US-5: Program Manager views influence matrix
**As a** program manager, **I want to** see a 2x2 grid of influence vs support **so that** I can prioritize engagement.

### US-6: Program Manager views org chart
**As a** program manager, **I want to** see a hierarchical org chart based on reporting relationships **so that** I can understand the organizational structure.

### US-7: Program Manager exports data
**As a** program manager, **I want to** export data as CSV, JSON, PDF, or RDF/Turtle **so that** I can share stakeholder information with other tools and teams.

### US-8: Program Manager imports stakeholders
**As a** program manager, **I want to** import stakeholders from CSV **so that** I can bulk-load data.

### US-9: Program Manager uses AI chat
**As a** program manager, **I want to** ask natural language questions about my stakeholders, generate meeting briefs, and draft emails **so that** I can prepare for interactions efficiently.

### US-10: External tool queries stakeholder data
**As an** AI agent or external application, **I want to** query stakeholder data via REST API or MCP **so that** I can integrate stakeholder intelligence into other workflows.

### US-11: Program Manager uses anonymous mode
**As a** program manager, **I want to** hide real stakeholder names **so that** I can discuss dynamics in presentations without revealing identities.

### US-12: Program Manager plans scenarios
**As a** program manager, **I want to** simulate "what-if" changes to influence/support levels **so that** I can plan engagement strategies.

## Functional Requirements

### Data Model
- 10 entities: Project, Stakeholder, ProjectStakeholder, Workstream, RACIAssignment, CommunicationPlan, EngagementLog, StakeholderHistory, Tag/StakeholderTag, Relationship
- Schema must be compatible with existing data for migration

### Views
- Dashboard, Stakeholder Grid, Network Graph, Influence Matrix, Org Chart, RACI Matrix

### Integrations
- REST API at /api/v1 with full CRUD
- MCP server over stdio for AI agents
- RDF/Turtle export aligned with compliance-ontology
- Ollama for local AI chat

### Security
- Input validation on all user inputs
- Parameterized SQL queries (no injection)
- Auto-escaped templates (no XSS)
- CSRF protection on web forms
- Security headers on all responses
- Optional API key auth for REST API

## Non-Functional Requirements
- Single binary distribution (go:embed)
- Startup time < 1 second
- SQLite file-based storage with WAL mode
- Graceful shutdown with clean DB close
- 80%+ test coverage on business logic

## Review & Acceptance Checklist
- [ ] All 5 views render correctly
- [ ] All 10 entities have full CRUD
- [ ] REST API returns correct responses for all endpoints
- [ ] MCP server tools work with AI agents
- [ ] RDF export validates against compliance-ontology SHACL shapes
- [ ] govulncheck reports zero vulnerabilities
- [ ] gosec reports zero findings
- [ ] All tests pass with 80%+ coverage
- [ ] Documentation is complete
- [ ] Data migration from legacy app succeeds without data loss
