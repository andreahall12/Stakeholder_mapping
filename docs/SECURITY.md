# Security Architecture

## Threat Model

The Stakeholder Tool is designed as a **local, single-user application**. Each user runs their own instance on their own machine. There is no multi-user authentication, no shared server, and no data transmitted to external services (unless the optional Ollama AI integration is configured).

### Primary Threat Vectors

1. **Cross-site scripting (XSS)** — Mitigated by Go `html/template` auto-escaping and Content Security Policy with per-request nonces
2. **SQL injection** — Mitigated by parameterized queries (`?` placeholders) in all database operations
3. **Dependency vulnerabilities** — Mitigated by `govulncheck` in CI and Dependabot weekly updates
4. **Information disclosure** — Mitigated by structured logging (no secrets in logs) and sanitized error messages

### Network Exposure (Optional)

If the REST API is exposed over a network (not the default):

5. **Unauthorized access** — Mitigated by optional API key authentication (`STAKEHOLDER_API_KEY`)
6. **Man-in-the-middle** — Users should add a reverse proxy with TLS (e.g., nginx, Caddy)

### Why No CSRF Protection

CSRF (Cross-Site Request Forgery) protection is intentionally omitted because:

- The app binds to `127.0.0.1` (localhost) by default — it is not accessible from other machines
- There is no authentication or session management, so there are no credentials to forge
- The tool is single-user; there is no concept of one user performing actions on behalf of another

If the tool is ever extended to support multi-user sessions over a network, CSRF middleware (e.g., `gorilla/csrf`) should be added at that time.

### Why No Authentication

- Each user runs their own local instance with their own database
- The app binds to localhost by default — only the user's own machine can access it
- Adding authentication would create friction for non-technical users without meaningful security benefit in the local-only model
- For the REST API, an optional API key can be set via the `STAKEHOLDER_API_KEY` environment variable

## Security Controls

### Input Validation
- All domain structs use `go-playground/validator` tags
- Enums are validated with `oneof` constraints
- String lengths are bounded with `min`/`max`
- Emails validated with `email` tag
- UUIDs validated with `uuid` tag

### SQL Injection Prevention
- All queries use parameterized statements (`?` placeholders)
- No string concatenation in SQL queries
- All queries are in the repository layer, separated from handler logic

### XSS Prevention
- Go `html/template` auto-escapes all dynamic content in HTML templates
- Content Security Policy (CSP) with per-request nonces for inline scripts
- All JavaScript libraries are vendored locally (no external CDN dependencies)
- `X-Content-Type-Options: nosniff` prevents MIME-type sniffing

### Security Headers
Applied to every HTTP response:
- `Content-Security-Policy` — Restricts script/style/font sources with nonces
- `X-Frame-Options: DENY` — Prevents clickjacking
- `X-Content-Type-Options: nosniff` — Prevents MIME sniffing
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`

### Authentication
- Web UI: No authentication (local single-user tool)
- REST API: Optional API key via `X-API-Key` header or `Authorization: Bearer` token
- MCP Server: stdio transport (no network auth needed)

### Database Security
- WAL mode for concurrent reads
- Foreign key constraints enforced
- Graceful shutdown flushes WAL before closing

## Data Privacy

- All data is stored locally in a SQLite file on the user's machine
- No telemetry, analytics, or external data transmission
- The database file (`stakeholder.db`) and export files (`stakeholder-export.json`) are listed in `.gitignore` to prevent accidental commits
- See the README "Data Privacy" section for user-facing guidance

## Dependency Security

- `govulncheck` runs in CI to detect known CVEs
- Dependabot creates PRs for dependency updates weekly
- `go.sum` provides checksum verification for all modules
- JavaScript libraries are vendored locally with pinned versions

## Security Tooling

Run all security checks:

```bash
bash scripts/security-check.sh
```

Individual tools:
```bash
govulncheck ./...        # Vulnerability scanning
gosec ./...              # Static security analysis
golangci-lint run        # Linting with security rules
go vet ./...             # Go vet checks
go test -race ./...      # Race condition detection
```
