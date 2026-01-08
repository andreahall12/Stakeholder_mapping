# Stakeholder Mapping Tool

A powerful desktop application designed for **program managers** to identify, track, and manage stakeholders across projects. Visualize relationships, track engagement, and ensure nothing falls through the cracks.

---

## Quick Start (5 Minutes)

1. **Download** the project from GitHub
2. **Open Terminal** and navigate to the folder
3. **Run these commands:**
   ```bash
   npm install
   npm run dev -- --port 5173
   ```
4. **Open browser** to: http://localhost:5173
5. **Click "Add Sample Data"** to explore with demo data

---

## What This Tool Does

| Your Challenge | How This Tool Helps |
|----------------|---------------------|
| Who are my key stakeholders? | Visual influence matrix shows who matters most |
| Am I communicating enough? | Staleness alerts flag overdue contacts |
| Who is blocking progress? | Dashboard highlights high-influence resisters |
| What is my RACI coverage? | Gap analysis shows missing roles per workstream |
| I need to present anonymously | One-click mode hides all real names |

---

## Core Features

### Views
- **Dashboard** - KPIs, alerts, and quick actions at a glance
- **Network Graph** - Visual map of stakeholder connections
- **Influence Matrix** - 2x2 grid showing influence vs support
- **Org Chart** - Hierarchical reporting structure
- **RACI Matrix** - Editable responsibility assignments

### Stakeholder Management
- **Add/Edit Stakeholders** - Name, title, department, contact info
- **Influence and Support Levels** - Track who matters and how they feel
- **Tags** - Organize with custom colored labels
- **Engagement Log** - Record meetings, calls, emails with sentiment
- **Communication Plans** - Set expected contact frequency

### Productivity Tools
- **AI Quick Add** - Type "John Smith, VP Engineering, high influence" to create
- **CSV Import** - Bulk load stakeholders from spreadsheet
- **Bulk Operations** - Update multiple stakeholders at once
- **Saved Filters** - Save and reuse filter combinations
- **PDF Export** - Generate formatted reports

### Advanced Features
- **Scenario Planning** - Model "what if" support level changes
- **Anonymous Mode** - Hide names for presentations
- **Keyboard Shortcuts** - Press Cmd/Ctrl + / for help
- **AI Chat** - Ask questions like "Who should I email weekly?"

---

## Installation

### Prerequisites
- **Node.js 18+** - Download from https://nodejs.org
- **npm** - Comes with Node.js

### Steps
```bash
# Clone the repository
git clone https://github.com/andreahall12/Stakeholder_mapping.git
cd Stakeholder_mapping

# Install dependencies (first time only)
npm install

# Start the application
npm run dev -- --port 5173
```

Open http://localhost:5173 in your browser.

### For Desktop App (Optional)
Requires Rust from https://rustup.rs
```bash
npm run tauri build
```

### For AI Chat (Optional)
1. Install Ollama from https://ollama.ai
2. Run: `ollama serve`
3. Run: `ollama pull llama3.2`

---

## Using the Application

### Adding Stakeholders
1. Click **"New"** in the sidebar
2. Fill in name, title, department, contact info
3. Set **Influence Level**: High, Medium, or Low
4. Set **Support Level**: Champion, Supporter, Neutral, or Resistant
5. Click **Save**

### Tracking Engagement
1. Click the clipboard icon on any stakeholder
2. Select type: Meeting, Email, Call, Decision, Note
3. Add summary and sentiment
4. Save - updates their last contact date

### Setting Communication Plans
1. Edit a stakeholder
2. Set channel (Email, Slack, Meeting, etc.)
3. Set frequency (Daily, Weekly, Monthly, etc.)
4. Dashboard will alert you when overdue

### Filtering Stakeholders
1. Click **"Filter"** button
2. Select influence, support, department, or tag
3. Click Filter dropdown and "Save Current Filter" for reuse

### Exporting Data
1. Click the three-dot menu in header
2. Choose: CSV, JSON, PDF Report, or Full Backup

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Cmd/Ctrl + / | Show shortcuts help |
| Cmd/Ctrl + N | New stakeholder |
| Cmd/Ctrl + F | Focus search |
| Escape | Close dialogs |

---

## Troubleshooting

**"Site cannot be reached"** - Restart the dev server:
```bash
npm run dev -- --port 5173
```

**"npm not found"** - Install Node.js from https://nodejs.org

**"Port in use"** - Use different port:
```bash
npm run dev -- --port 3000
```

**Data disappeared** - Data is in browser localStorage. Export backups regularly.

---

## Documentation

- [REQUIREMENTS.md](REQUIREMENTS.md) - Functional and non-functional requirements
- [docs/TECHNICAL.md](docs/TECHNICAL.md) - Architecture and developer guide

---

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **UI**: Tailwind CSS + shadcn/ui
- **Database**: sql.js (SQLite in WebAssembly)
- **Visualizations**: React Flow, Mermaid
- **Desktop**: Tauri 2.0
- **AI**: Ollama (local LLM)

---

## License

Apache License 2.0 - see [LICENSE](LICENSE) for details.
