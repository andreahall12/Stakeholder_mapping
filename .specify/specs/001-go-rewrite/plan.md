# Technical Implementation Plan: Go Rewrite

## Tech Stack

| Component | Technology | Version |
|-----------|-----------|---------|
| Language | Go | 1.25+ |
| Frontend | Templ + HTMX | latest |
| JS (graphs) | Cytoscape.js | latest |
| Router | go-chi/chi | v5 |
| Database | modernc.org/sqlite + sqlc | latest |
| AI Chat | Ollama (net/http client) | - |
| CSS | Tailwind CSS | 3.x |
| MCP | mcp-go (mark3labs) | latest |
| RDF | knakk/rdf | latest |
| Validation | go-playground/validator | v10 |
| Logging | log/slog (stdlib) | - |
| Security | govulncheck, gosec, golangci-lint | latest |

## Architecture

- **cmd/server/**: Main web server with graceful shutdown
- **cmd/mcp/**: MCP server (stdio transport)
- **cmd/migrate/**: Data migration from legacy app
- **internal/config/**: Configuration (env vars, TOML)
- **internal/domain/**: 10 domain model structs with validation tags
- **internal/repository/sqlite/**: sqlc-generated data access
- **internal/service/**: Business logic (KPIs, filters, scenarios)
- **internal/handler/web/**: Templ page handlers
- **internal/handler/api/**: REST API JSON handlers (/api/v1)
- **internal/middleware/**: CSRF, security headers, rate limiting, API key auth
- **internal/ai/**: Ollama client
- **internal/mcp/**: MCP tool definitions
- **web/**: Templ templates, static assets (go:embed)
- **pkg/ontology/**: RDF/Turtle export/import
- **db/**: Schema, queries, migrations

## Security Controls

1. Input validation via struct tags (go-playground/validator)
2. Parameterized queries via sqlc
3. Auto-escaped output via Templ
4. CSRF tokens via gorilla/csrf
5. Security headers middleware (CSP with nonces, HSTS, X-Frame-Options)
6. Rate limiting on REST API
7. Optional API key authentication
8. Structured audit logging via slog
9. Graceful shutdown for DB integrity
10. go:embed for asset integrity

## Database

- SQLite with WAL mode, foreign keys enabled
- Pure Go driver (modernc.org/sqlite) — no CGo
- sqlc for type-safe query generation
- Numbered migrations (001_initial.sql, 002_xxx.sql, ...)

## Data Exchange

- RDF/Turtle export via knakk/rdf
- Maps to compliance-ontology classes:
  - Stakeholder → co-bus:Personnel / co-bus:Vendor
  - Project → co-bus:ComplianceProgram
  - Workstream → co-bus:Activity
