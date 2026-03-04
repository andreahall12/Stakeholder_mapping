# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Go rewrite of the stakeholder mapping tool (formerly React/TypeScript)
- Templ + HTMX server-rendered web UI with dark theme
- File-based SQLite database with WAL mode
- REST API at `/api/v1/` with full CRUD for projects and stakeholders
- Security middleware: CSP with nonces, HSTS, X-Frame-Options, CSRF protection
- Optional API key authentication for REST API
- Structured audit logging for all mutations
- Graceful shutdown with SQLite WAL checkpoint
- Configuration via environment variables
- Domain models for all 10 entities with validation tags
- Security tooling: govulncheck, gosec, golangci-lint
- CI/CD with GitHub Actions (build, test, lint, security scan)
- Dependabot for automated dependency updates
- Spec-kit artifacts (constitution, specification, plan, tasks)
- Documentation: README, API, MCP, Security, Contributing

### Migration from Legacy App
- Data migration tool (`cmd/migrate`) converts legacy SQLite export to file-based DB
- Schema is compatible — all tables and columns preserved
- New additions: `audit_log` table, additional indexes
