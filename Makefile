# Stakeholder Mapping Tool — Makefile
# Run `make help` to see available commands.

.PHONY: help run build build-all demo seed reset export import test lint coverage clean

# Default target
help: ## Show this help message
	@echo ""
	@echo "  Stakeholder Mapping Tool"
	@echo "  ========================"
	@echo ""
	@echo "  Getting started:"
	@echo "    make run        Start the tool (opens in your browser)"
	@echo "    make demo       Load sample data and start the tool"
	@echo "    make reset      Clear all data and start fresh"
	@echo ""
	@echo "  Sharing your data:"
	@echo "    make export     Save all your data to a file you can share"
	@echo "    make import FILE=<file>  Load data from someone else's export file"
	@echo ""
	@echo "  Other commands:"
	@echo "    make build      Build a standalone binary"
	@echo "    make build-all  Build for macOS, Linux, and Windows"
	@echo "    make seed       Load demo data (without starting the server)"
	@echo "    make test       Run automated tests"
	@echo "    make lint       Run linter checks"
	@echo "    make coverage   Run tests with coverage report"
	@echo "    make clean      Remove database and build files"
	@echo ""

# ── User-facing commands ─────────────────────────────────────

run: ## Start the tool
	@echo ""
	@echo "  Starting Stakeholder Mapping Tool..."
	@echo "  Open http://localhost:1420 in your browser."
	@echo "  Press Ctrl+C to stop."
	@echo ""
	@go run ./cmd/server

seed: ## Load demo data into the database
	@echo "  Loading demo data..."
	@go run ./cmd/seed

demo: reset seed ## Clear data, load demo, and start the tool
	@echo ""
	@echo "  ╔══════════════════════════════════════════════════════════╗"
	@echo "  ║                    DEMO MODE                            ║"
	@echo "  ║  You are viewing sample data. None of it is real.       ║"
	@echo "  ║                                                         ║"
	@echo "  ║  When you're ready to use your own data:                ║"
	@echo "  ║    1. Press Ctrl+C to stop                              ║"
	@echo "  ║    2. Run: make reset                                   ║"
	@echo "  ║    3. Run: make run                                     ║"
	@echo "  ╚══════════════════════════════════════════════════════════╝"
	@echo ""
	@echo "  Starting Stakeholder Mapping Tool (demo)..."
	@echo "  Open http://localhost:1420 in your browser."
	@echo "  Press Ctrl+C to stop."
	@echo ""
	@go run ./cmd/server

reset: ## Clear all data and start fresh
	@echo "  Clearing database..."
	@rm -f stakeholder.db stakeholder.db-wal stakeholder.db-shm
	@echo "  Done. Run 'make run' to start with a clean database."

# ── Sharing ──────────────────────────────────────────────────

export: ## Save all data to stakeholder-export.json
	@go run ./cmd/export

import: ## Import data from a file: make import FILE=stakeholder-export.json
ifndef FILE
	@echo ""
	@echo "  Usage:  make import FILE=stakeholder-export.json"
	@echo ""
	@echo "  Import a data file that was shared with you."
	@echo "  The file must be a .json file created by 'make export'."
	@echo ""
else
	@go run ./cmd/importdata $(FILE)
endif

# ── Developer commands ───────────────────────────────────────

build: ## Build a standalone binary
	@echo "  Building..."
	@go build -o stakeholder-tool ./cmd/server
	@echo "  Built: ./stakeholder-tool"
	@echo "  Run it with: ./stakeholder-tool"

test: ## Run automated tests
	@go test ./... -count=1

lint: ## Run linter (requires golangci-lint)
	@golangci-lint run ./...

coverage: ## Run tests with coverage report
	@go test -coverprofile=coverage.out ./...
	@go tool cover -func=coverage.out
	@echo ""
	@echo "  HTML report: go tool cover -html=coverage.out"

build-all: ## Build for macOS, Linux, and Windows
	@mkdir -p dist
	@echo "  Building for macOS (arm64)..."
	@GOOS=darwin GOARCH=arm64 go build -o dist/stakeholder-tool-darwin-arm64 ./cmd/server
	@echo "  Building for macOS (amd64)..."
	@GOOS=darwin GOARCH=amd64 go build -o dist/stakeholder-tool-darwin-amd64 ./cmd/server
	@echo "  Building for Linux (amd64)..."
	@GOOS=linux GOARCH=amd64 go build -o dist/stakeholder-tool-linux-amd64 ./cmd/server
	@echo "  Building for Windows (amd64)..."
	@GOOS=windows GOARCH=amd64 go build -o dist/stakeholder-tool-windows-amd64.exe ./cmd/server
	@echo "  Done. Binaries in dist/"

clean: ## Remove database and build files
	@rm -f stakeholder.db stakeholder.db-wal stakeholder.db-shm
	@rm -f stakeholder-tool
	@rm -f coverage.out
	@echo "  Cleaned."
