# Task Breakdown: Go Rewrite

## Phase 1: Foundation [P]
- [x] Task 1.1: Create project directory structure
- [x] Task 1.2: Initialize Go module with dependencies
- [x] Task 1.3: Create spec-kit artifacts (constitution, spec, plan, tasks)
- [ ] Task 1.4: Configure golangci-lint, security-check script
- [ ] Task 1.5: Implement configuration layer (env vars, TOML)

## Phase 2: Domain & Data [P]
- [ ] Task 2.1: Define all 10 domain model structs with validation tags
- [ ] Task 2.2: Create SQLite schema (matching legacy)
- [ ] Task 2.3: Write sqlc queries for all entities
- [ ] Task 2.4: Implement repository layer with CRUD + audit logging
- [ ] Task 2.5: Implement numbered migration system

**Checkpoint**: All entities can be created, read, updated, deleted via repository.

## Phase 3: Security & Middleware
- [ ] Task 3.1: CSRF middleware (gorilla/csrf)
- [ ] Task 3.2: Security headers middleware (CSP, HSTS, X-Frame-Options)
- [ ] Task 3.3: Rate limiting middleware (REST API only)
- [ ] Task 3.4: Optional API key authentication middleware
- [ ] Task 3.5: Structured audit logging with slog

**Checkpoint**: Middleware stack fully functional.

## Phase 4: Service Layer
- [ ] Task 4.1: Stakeholder service (CRUD, search, filter, bulk ops)
- [ ] Task 4.2: Project service (CRUD, KPI calculations)
- [ ] Task 4.3: RACI service (assignments, gap detection)
- [ ] Task 4.4: Communication service (plans, overdue detection)
- [ ] Task 4.5: Engagement service (logs, history tracking)
- [ ] Task 4.6: Scenario planning service

**Checkpoint**: All business logic works with test coverage.

## Phase 5: Web UI [P]
- [ ] Task 5.1: Base layout template (header, nav tabs, sidebar)
- [ ] Task 5.2: Dashboard view (KPIs, recent activity, alerts)
- [ ] Task 5.3: Stakeholder grid (cards, search, filters, saved filters)
- [ ] Task 5.4: RACI Matrix view (grid with inline editing)
- [ ] Task 5.5: Influence Matrix view (2x2 grid)
- [ ] Task 5.6: Org Chart view (hierarchical)
- [ ] Task 5.7: Network Graph (Cytoscape.js)
- [ ] Task 5.8: Stakeholder dialog (create/edit form)
- [ ] Task 5.9: HTMX interactivity for all views
- [ ] Task 5.10: Dark theme CSS (matching current design)

**Checkpoint**: All 5 views render with full interactivity.

## Phase 6: AI & Integration
- [ ] Task 6.1: Ollama client (chat, briefs, email drafts, blockers)
- [ ] Task 6.2: AI chat panel (web UI)
- [ ] Task 6.3: REST API handlers (/api/v1)
- [ ] Task 6.4: MCP server with tool definitions
- [ ] Task 6.5: RDF/Turtle export (compliance-ontology alignment)

**Checkpoint**: AI chat works, REST API returns correct responses, MCP tools function.

## Phase 7: Data Operations
- [ ] Task 7.1: CSV import
- [ ] Task 7.2: CSV/JSON export
- [ ] Task 7.3: PDF report generation
- [ ] Task 7.4: Database backup/restore
- [ ] Task 7.5: Data migration tool (legacy → new)

**Checkpoint**: All import/export operations work correctly.

## Phase 8: Testing & Docs
- [ ] Task 8.1: Unit tests (service, repository)
- [ ] Task 8.2: Integration tests (in-memory SQLite)
- [ ] Task 8.3: API tests (httptest)
- [ ] Task 8.4: Security scan (govulncheck, gosec)
- [ ] Task 8.5: README.md
- [ ] Task 8.6: docs/API.md
- [ ] Task 8.7: docs/MCP.md
- [ ] Task 8.8: docs/SECURITY.md
- [ ] Task 8.9: docs/CONTRIBUTING.md, CHANGELOG.md

## Phase 9: CI/CD
- [ ] Task 9.1: GitHub Actions CI workflow
- [ ] Task 9.2: GitHub Actions security workflow
- [ ] Task 9.3: Dependabot configuration
- [ ] Task 9.4: goreleaser configuration

**Final checkpoint**: govulncheck clean, gosec clean, all tests pass, docs complete.
