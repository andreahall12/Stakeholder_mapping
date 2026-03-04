# Stakeholder Tool — Project Constitution

## Governing Principles

### 1. Security First
- All inputs must be validated and sanitized before processing.
- SQL queries must use parameterized statements (sqlc-generated); no string concatenation.
- Output must be auto-escaped (Templ handles this) to prevent XSS.
- Dependencies must be scanned for known vulnerabilities (govulncheck) before every release.
- Security headers (CSP, HSTS, X-Frame-Options) must be set on all HTTP responses.
- Secrets (API keys, tokens) must never be logged or included in error messages.

### 2. Code Quality
- All public functions and types must have GoDoc comments.
- Code must pass `golangci-lint` with security-focused rules enabled.
- Test coverage must be at least 80% for business logic (service layer).
- Follow standard Go project layout: `cmd/`, `internal/`, `pkg/`.
- Use `log/slog` for structured logging throughout.
- Errors must be wrapped with context using `fmt.Errorf("...: %w", err)`.

### 3. Data Integrity
- SQLite database must use WAL mode for concurrent read access.
- Graceful shutdown must flush WAL and close the database cleanly.
- All schema changes must go through numbered migrations.
- Foreign key constraints must be enforced (`PRAGMA foreign_keys = ON`).
- Data migration from the legacy app must validate record counts and referential integrity.

### 4. Compliance Alignment
- The internal data model is independent of external ontologies.
- Export/import uses the compliance-ontology (https://github.com/andreahall12/compliance-ontology) for data exchange.
- Stakeholders map to `co-bus:Personnel`, Projects to `co-bus:ComplianceProgram`.
- RDF/Turtle output must satisfy the ontology's SHACL validation shapes.

### 5. User Experience
- Feature parity with the existing React/TypeScript app is mandatory before v1.0.
- The dark theme must be consistent with the current design.
- The tool must run as a single binary (all assets embedded via `go:embed`).
- Local usage requires no authentication; REST API auth is optional for network exposure.
- AI features (Ollama) degrade gracefully when the LLM is unavailable.

### 6. API Design
- REST API is versioned at `/api/v1/`.
- Breaking changes require a new API version; deprecation warnings in headers.
- MCP server uses stdio transport for AI agent integration.
- All API endpoints return structured JSON with consistent error format.

### 7. Testing Standards
- Unit tests: all service and repository methods.
- Integration tests: use in-memory SQLite (`:memory:`), not Docker.
- API tests: use `net/http/httptest` for handler testing.
- Security tests: `gosec` must pass with zero findings.

### 8. Documentation
- README must include quick start, features, and architecture overview.
- API documentation must cover all endpoints with request/response examples.
- Security documentation must describe the threat model and controls.
- CHANGELOG must follow Keep a Changelog format.
