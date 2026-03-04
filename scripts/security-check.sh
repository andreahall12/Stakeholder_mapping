#!/usr/bin/env bash
# security-check.sh — Run all security and quality tools.
# Exit on first failure.
set -euo pipefail

echo "=== Security Check ==="
echo ""

# 1. Vulnerability scanning
echo ">> govulncheck (dependency vulnerabilities)..."
if command -v govulncheck &>/dev/null; then
    govulncheck ./...
    echo "   PASS"
else
    echo "   SKIP (govulncheck not installed: go install golang.org/x/vuln/cmd/govulncheck@latest)"
fi
echo ""

# 2. Static security analysis
echo ">> gosec (static security analysis)..."
if command -v gosec &>/dev/null; then
    gosec -quiet ./...
    echo "   PASS"
else
    echo "   SKIP (gosec not installed: go install github.com/securego/gosec/v2/cmd/gosec@latest)"
fi
echo ""

# 3. Linting with security rules
echo ">> golangci-lint (linting with security rules)..."
if command -v golangci-lint &>/dev/null; then
    golangci-lint run
    echo "   PASS"
else
    echo "   SKIP (golangci-lint not installed: see https://golangci-lint.run/welcome/install/)"
fi
echo ""

# 4. Go vet
echo ">> go vet..."
go vet ./...
echo "   PASS"
echo ""

# 5. Tests
echo ">> go test (with race detector)..."
go test -race -count=1 ./...
echo "   PASS"
echo ""

echo "=== All security checks passed ==="
