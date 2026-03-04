# Stakeholder Mapping Tool

Track, visualize, and manage the stakeholders in your programs — who they are, how much influence they have, whether they're on board, and what needs your attention.

---

## Installation

### Step 1: Install Go

This tool is built with Go. You need Go version 1.25 or newer.

**Mac:**
```bash
# Option A: Using Homebrew (recommended if you have it)
brew install go

# Option B: Manual download
# Go to https://go.dev/dl/ and download the macOS installer (.pkg file).
# Open the file and follow the prompts.
```

**Windows:**
1. Go to [https://go.dev/dl/](https://go.dev/dl/)
2. Download the Windows installer (`.msi` file)
3. Run the installer and follow the prompts
4. Restart your terminal (Command Prompt or PowerShell) after installation

**Linux:**
```bash
# Download and install (replace version number if needed)
wget https://go.dev/dl/go1.25.7.linux-amd64.tar.gz
sudo tar -C /usr/local -xzf go1.25.7.linux-amd64.tar.gz
echo 'export PATH=$PATH:/usr/local/go/bin' >> ~/.bashrc
source ~/.bashrc
```

**Verify it's installed:**
```bash
go version
```
You should see something like `go version go1.25.7 darwin/arm64`.

### Step 2: Install Make (if you don't already have it)

**Mac:** Make is included with the Xcode command-line tools. If you don't have them:
```bash
xcode-select --install
```

**Windows:** Make isn't included by default. You have two options:
- Install [Git for Windows](https://gitforwindows.org/) which includes Git Bash with Make
- Or install [Chocolatey](https://chocolatey.org/) and run: `choco install make`

**Linux:** Make is usually pre-installed. If not:
```bash
sudo apt install make    # Ubuntu/Debian
sudo yum install make    # CentOS/RHEL
```

### Step 3: Download the tool

```bash
# Clone the repository
git clone https://github.com/andreahall12/stakeholder-tool.git

# Go into the project folder
cd stakeholder-tool
```

### Step 4: Download dependencies

This downloads all the libraries the tool needs. You only need to do this once:

```bash
go mod download
```

This may take a minute the first time. You'll see some download progress. When it finishes with no errors, you're ready.

### Step 5: Start the tool

```bash
make run
```

Open **http://localhost:1420** in your browser. You should see the Stakeholder Mapping dashboard.

Press `Ctrl+C` in the terminal to stop the tool when you're done.

---

## Try the Demo

If this is your first time, start with the demo. It loads a realistic sample project ("Cloud Platform Migration") with 12 stakeholders, relationships, RACI assignments, and engagement history so you can see how everything works:

```bash
make demo
```

Open **http://localhost:1420** in your browser and explore.

When you're ready to use it with your own data:

```bash
make reset
make run
```

`make reset` clears all the demo data. `make run` starts fresh.

---

## Setting Up AI Chat (Optional)

The tool has built-in AI features — it can generate meeting preparation briefs, draft emails tailored to a stakeholder's influence level, and analyze your blockers. This requires **Ollama**, a free tool that runs AI models on your computer. The AI features are completely optional; everything else works without it.

### Install Ollama

1. Go to [https://ollama.ai/](https://ollama.ai/)
2. Download and install for your operating system
3. Open a **separate terminal window** and start Ollama:

```bash
ollama serve
```

4. In another terminal, download the language model (one-time, ~2GB download):

```bash
ollama pull llama3.2
```

### Connect it to the tool

Ollama connects automatically — no configuration needed. By default the tool looks for Ollama at `http://localhost:11434` using the `llama3.2` model.

If you're using a different model or Ollama is running on a different machine:

```bash
STAKEHOLDER_OLLAMA_URL=http://your-server:11434 STAKEHOLDER_OLLAMA_MODEL=mistral make run
```

### What the AI can do

Once Ollama is running, you can use the AI through the REST API:

- **Meeting briefs** — Generate a preparation document for a stakeholder meeting
- **Email drafts** — Draft communication tailored to a stakeholder's concerns
- **Blocker analysis** — Identify high-influence resistant stakeholders and suggest strategies

If Ollama is not running, these features will return a friendly message saying Ollama isn't available. Nothing breaks.

---

## Sharing Your Data with Others

There are two easy ways to share your stakeholder data with teammates.

### Option A: Send a File (simplest)

This is the best option when each person works on their own computer.

**You (the person sharing):**

1. Make sure the tool is **not** running (press `Ctrl+C` in the terminal if it is)
2. Run:

```bash
make export
```

3. This creates a file called `stakeholder-export.json` in the project folder
4. Send that file to your teammate (email, Slack, Teams, shared drive — whatever works)

**Your teammate (the person receiving):**

1. Make sure they have the tool installed (follow the [Installation](#installation) steps above)
2. Put the file you sent them somewhere they can find (like the project folder)
3. Run:

```bash
make import FILE=stakeholder-export.json
```

4. The tool will ask them to confirm, then load all the data
5. Run `make run` to start the tool and see the imported data

**Important:** Importing **replaces** all existing data. If your teammate already has their own data they want to keep, they should run `make export` first to back it up.

### Option B: Share a Computer or Server

If your team wants everyone to work from the same data at the same time, you can run the tool on a shared computer or server:

1. Start the tool on the shared machine with:

```bash
STAKEHOLDER_HOST=0.0.0.0 make run
```

2. Other people on the same network open their browser to: `http://<shared-machine-ip>:1420`

You can find the machine's IP address with `ipconfig` (Windows) or `ifconfig` (Mac/Linux).

---

## All Commands

```bash
make help       # Show all available commands
make run        # Start the tool
make demo       # Load sample data and start the tool
make reset      # Clear all data and start fresh
make export     # Save all your data to a file you can share
make import FILE=<file>  # Load data from someone else's file
make seed       # Load demo data (without starting the server)
make build      # Build a standalone binary you can share
make test       # Run automated tests
make clean      # Remove database and build files
```

---

## Using a Different Port

If port 1420 is already in use by something else:

```bash
STAKEHOLDER_PORT=3000 make run
```

Then open **http://localhost:3000** instead.

---

## Docker (Alternative Setup)

If you have [Docker](https://www.docker.com/products/docker-desktop/) installed, you can skip the Go installation entirely:

```bash
docker compose up
```

Open **http://localhost:1420**. Your data is persisted in a Docker volume.

---

## What You Can Do

| View | What it shows |
|------|---------------|
| **Dashboard** | Your projects, stakeholder list with search/filter, KPI summary |
| **Network Graph** | Interactive map of who reports to, influences, or conflicts with whom |
| **Influence Matrix** | 2D grid of influence level vs. support stance — spot blockers at a glance |
| **Org Chart** | Reporting hierarchy, color-coded by department |
| **RACI Matrix** | Who's Responsible, Accountable, Consulted, or Informed for each workstream |

**Also includes:** CSV/JSON export and import, and a REST API for integration with other tools.

See the **[User Guide](docs/USER_GUIDE.md)** for a full walkthrough of every feature.

---

## Exporting Your Data

**Quick export (from the terminal):**

```bash
make export
```

This saves everything to `stakeholder-export.json`. You can back this up, send it to a colleague, or keep it for your records.

**Other export formats** (visit these URLs in your browser while the tool is running):

- **Spreadsheet (CSV):** http://localhost:1420/api/v1/export/stakeholders.csv
- **JSON (stakeholders only):** http://localhost:1420/api/v1/export/stakeholders.json
- **Full backup (JSON):** http://localhost:1420/api/v1/export/full.json

See [Sharing Your Data with Others](#sharing-your-data-with-others) for how to send data to a teammate.

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `command not found: make` | Install developer tools. Mac: `xcode-select --install`. Windows: install [Git for Windows](https://gitforwindows.org/). |
| `command not found: go` | Go isn't installed. Follow [Step 1](#step-1-install-go) above. |
| `go mod download` fails with network errors | Check your internet connection. If you're behind a corporate proxy, set `HTTPS_PROXY`. |
| Page won't load in browser | Make sure the tool is running (you should see "Stakeholder Tool running at..." in your terminal). |
| `port already in use` | Something else is using port 1420. Run with a different port: `STAKEHOLDER_PORT=3000 make run` |
| AI chat says "Ollama is not available" | Ollama isn't running. Open a separate terminal and run `ollama serve`. See [Setting Up AI Chat](#setting-up-ai-chat-optional). |

---

## For Developers

<details>
<summary>Architecture, API, testing, and security details</summary>

### Architecture

```
cmd/server/         — Web server entry point
cmd/mcp/            — MCP server for AI agents (stdio transport)
cmd/migrate/        — Data migration from legacy React app
cmd/seed/           — Demo data loader
internal/domain/    — Business entities (10 models)
internal/config/    — Environment-based configuration
internal/repository/sqlite/ — Database access (CRUD, audit logging)
internal/service/   — Business logic (KPIs, AI, export, ontology)
internal/handler/   — HTTP handlers (web + REST API)
internal/middleware/ — Security middleware (CSP, auth, logging)
web/templates/      — HTML templates (HTMX partials)
web/static/         — CSS, JS, and static assets
db/                 — SQLite schema and seed data
```

### Configuration

All settings are via environment variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `STAKEHOLDER_HOST` | `127.0.0.1` | Listen address |
| `STAKEHOLDER_PORT` | `1420` | Listen port |
| `STAKEHOLDER_DB_PATH` | `stakeholder.db` | SQLite database file path |
| `STAKEHOLDER_OLLAMA_URL` | `http://localhost:11434` | Ollama API URL |
| `STAKEHOLDER_OLLAMA_MODEL` | `llama3.2` | LLM model for AI chat |
| `STAKEHOLDER_API_KEY` | (empty) | API key for REST API auth |
| `STAKEHOLDER_CSRF_SECRET` | (auto) | CSRF token secret (min 32 chars) |
| `STAKEHOLDER_LOG_LEVEL` | `info` | Log level |

### REST API

Full CRUD at `/api/v1/` — see [docs/API.md](docs/API.md).

```bash
curl http://localhost:1420/api/v1/health
curl http://localhost:1420/api/v1/projects
curl http://localhost:1420/api/v1/stakeholders?search=alice
```

### MCP Server

AI agent integration via Model Context Protocol — see [docs/MCP.md](docs/MCP.md).

### Ontology Export

RDF/Turtle export aligned with [compliance-ontology](https://github.com/andreahall12/compliance-ontology):

```bash
curl http://localhost:1420/api/v1/export/ontology.ttl
```

### Security

- Parameterized SQL (no injection), auto-escaped templates (no XSS)
- Security headers (CSP with nonces, X-Frame-Options, HSTS)
- Input validation on all models, API key auth, audit logging
- See [docs/SECURITY.md](docs/SECURITY.md) for full details

```bash
make test
bash scripts/security-check.sh
```

### Data Migration

From the legacy React/TypeScript app:

```bash
go run ./cmd/migrate --input legacy-export.db --output stakeholder.db
```

### Spec-Kit

This project follows [Spec-Driven Development](https://github.com/github/spec-kit). See `.specify/` for specifications and plans.

</details>

## Data Privacy

This tool is designed with your privacy in mind:

- **Everything stays on your machine.** The app runs locally — your stakeholder data is never sent to any external server, cloud service, or third party.
- **Your database is a local file.** All data is stored in `stakeholder.db` in the project folder on your computer. If you delete this file, your data is gone.
- **No accounts, no login, no tracking.** There is no authentication because every person runs their own private instance. There is no telemetry, analytics, or usage tracking of any kind.
- **Export files are sensitive.** When you export data (via `make export` or the API), the resulting `stakeholder-export.json` file contains all of your stakeholder information. Treat it as confidential — don't commit it to a public repository or share it openly.
- **AI chat is local too.** If you use the optional AI assistant, it connects to Ollama running on your own machine. No data is sent to OpenAI, Google, or any external AI provider.

### Keeping Your Data Safe

| Do | Don't |
|----|-------|
| Keep your `stakeholder.db` file backed up | Don't commit `stakeholder.db` to git (it's in `.gitignore`) |
| Share data with teammates using `make export` / `make import` | Don't post export files publicly — they contain real names and contact info |
| Run the tool on your own laptop | Don't expose the tool to the public internet without a reverse proxy and API key |

## License

Apache License 2.0 — see [LICENSE](LICENSE) for details.
