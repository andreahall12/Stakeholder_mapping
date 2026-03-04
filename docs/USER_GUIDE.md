# Stakeholder Mapping Tool — User Guide

A practical guide for program managers. No technical background required.

---

## What is this tool?

The Stakeholder Mapping Tool helps you track and manage the people involved in your programs. It lets you:

- **See who matters** — Map stakeholders by influence and support level
- **Assign responsibilities** — Build RACI matrices for each workstream
- **Track engagement** — Log meetings, emails, and decisions
- **Spot risks** — Identify blockers, overdue contacts, and RACI gaps
- **Visualize relationships** — See the network of who reports to, influences, or conflicts with whom

---

## Getting Started

### Option 1: Try the demo first (recommended)

This loads a sample project ("Cloud Platform Migration") with 12 stakeholders, relationships, RACI assignments, and engagement history so you can explore:

```
make demo
```

Then open **http://localhost:1420** in your browser.

When you're ready to use it for real:

```
make reset
make run
```

### Option 2: Start with a clean slate

```
make run
```

Then open **http://localhost:1420** in your browser.

---

## Walkthrough

### Dashboard

When you open the tool, you land on the **Dashboard**. This shows:

- **Project cards** — Click any project to see its details
- **KPI summary** — Total projects and stakeholders at a glance
- **Stakeholder list** — Everyone in your system, searchable and filterable

**Things to try:**
- Click **+ New Project** to create a project
- Click **+ New Stakeholder** to add someone
- Use the search box and dropdown filters to find people
- Click a project card to drill into its details

### Project Detail

Click a project card to see:

- **KPI cards** — Total stakeholders, blockers (high influence + resistant/neutral), RACI gaps, overdue contacts
- **Influence breakdown** — Bar chart showing how many stakeholders are high/medium/low influence
- **Workstreams** — The tracks of work within this project
- **Stakeholders** — Who's assigned to this project

Click **RACI Matrix** to see the responsibility assignments.

### Network Graph

Click **Network** in the navigation bar. This shows an interactive graph of all stakeholder relationships:

- **Node size** = influence level (bigger = more influential)
- **Node color** = support level (green = champion, blue = supporter, gray = neutral, red = resistant)
- **Solid lines** = reporting or alliance relationships
- **Dashed red lines** = conflict relationships
- **Drag nodes** to rearrange the layout

### Influence Matrix

Click **Influence** in the navigation bar. This is a 3x4 grid showing every stakeholder positioned by:

- **Rows** = Influence level (high at top, low at bottom)
- **Columns** = Support level (resistant at left, champion at right)

The most important quadrants:
- **Top-left (high influence + resistant)** — These are your **blockers**. Focus here.
- **Top-right (high influence + champion)** — These are your **allies**. Leverage them.
- **Bottom-left** — Monitor but don't over-invest time.

### Org Chart

Click **Org Chart** in the navigation bar. This shows the reporting hierarchy based on "reports to" relationships. Color-coded by department.

### RACI Matrix

From a project detail page, click **RACI Matrix**. This shows a grid of:

- **Rows** = Workstreams
- **Columns** = Stakeholders
- **Cells** = R (Responsible), A (Accountable), C (Consulted), I (Informed)

**Tip:** A red "RACI Gaps" KPI means some workstreams are missing an R or A assignment.

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+K` (or `Cmd+K` on Mac) | Focus search box |
| `Ctrl+N` (or `Cmd+N` on Mac) | Open "New Stakeholder" form |
| `Escape` | Close any open dialog |

---

## Exporting and Sharing Data

### Backing up your data

To save a copy of all your data, stop the tool (press `Ctrl+C`) and run:

```
make export
```

This creates a file called `stakeholder-export.json` in the project folder. Keep this file somewhere safe.

### Sharing with a teammate

1. Run `make export` (see above)
2. Send the `stakeholder-export.json` file to your teammate (email, Slack, Teams, shared drive, etc.)
3. Your teammate puts the file in their project folder and runs:

```
make import FILE=stakeholder-export.json
```

4. The tool will ask them to confirm (since it replaces existing data)
5. Then they run `make run` to see everything

**Important:** Importing replaces everything in the database. If your teammate has data they want to keep, they should run `make export` first to back it up.

### Other export formats

While the tool is running, you can also visit these URLs in your browser:

- **CSV** (open in Excel/Google Sheets): `http://localhost:1420/api/v1/export/stakeholders.csv`
- **JSON** (stakeholders only): `http://localhost:1420/api/v1/export/stakeholders.json`
- **Full JSON** (everything): `http://localhost:1420/api/v1/export/full.json`

---

## AI Chat (optional)

If you have [Ollama](https://ollama.ai/) installed and running, the tool can:

- Generate **meeting preparation briefs** for stakeholders
- Draft **emails** tailored to a stakeholder's influence and support level
- **Analyze blockers** and suggest engagement strategies

This is optional — the tool works fine without it.

---

## Common Tasks

### Adding a stakeholder
1. Click **+ New Stakeholder** on the Dashboard
2. Fill in name, title, department
3. Set their **Influence** (high/medium/low) and **Support** (champion/supporter/neutral/resistant)
4. Add notes about their concerns, interests, or relationship to the project
5. Click **Create**

### Resetting everything
If you want to clear all data and start over:
```
make reset
```

### Stopping the tool
Press `Ctrl+C` in the terminal where you ran `make run`.

---

## Troubleshooting

**"command not found: make"**
You need to install developer tools. On Mac, run: `xcode-select --install`

**"command not found: go"**
You need Go installed. Download it from https://go.dev/dl/ — get the latest version for your operating system.

**The page won't load**
Make sure the tool is running (you should see "Stakeholder Tool running at http://127.0.0.1:1420" in your terminal).

**Port already in use**
Another program is using port 1420. Either stop that program, or run with a different port:
```
STAKEHOLDER_PORT=3000 make run
```
Then open http://localhost:3000 instead.
