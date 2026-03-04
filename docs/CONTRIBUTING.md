# Contributing

## Development Setup

1. Clone the repository
2. Install Go 1.25+
3. Run `go mod download`
4. Run `go build ./...` to verify
5. Run `go test ./...` to run tests

## Code Standards

- All public functions and types must have GoDoc comments
- Use `log/slog` for logging (not `log` or `fmt.Println`)
- Errors must be wrapped: `fmt.Errorf("context: %w", err)`
- SQL queries must use parameterized statements (no string concatenation)
- All inputs must be validated with struct tags

## Running Security Checks

Before submitting a PR:

```bash
bash scripts/security-check.sh
```

This runs govulncheck, gosec, golangci-lint, go vet, and tests.

## Pull Request Process

1. Create a feature branch from `main`
2. Make changes following the code standards
3. Add tests for new functionality
4. Ensure all security checks pass
5. Update documentation if needed
6. Submit a PR with a clear description

## Project Structure

```
cmd/           — Entry points (server, mcp, migrate)
internal/      — Private application code
  domain/      — Business entities
  repository/  — Database access
  service/     — Business logic
  handler/     — HTTP handlers
  middleware/  — Security middleware
  ai/          — Ollama integration
  mcp/         — MCP tool definitions
pkg/           — Public packages (ontology export)
web/           — Templates and static assets
db/            — Schema and migrations
docs/          — Documentation
scripts/       — Utility scripts
.specify/      — Spec-kit artifacts
```
