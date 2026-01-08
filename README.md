# Stakeholder Mapping Tool

A desktop application for program managers to track and visualize stakeholders across multiple projects.

## Features

- **Project Management**: Create and manage multiple projects/programs
- **Stakeholder Directory**: Track stakeholders with full attributes (name, title, department, contact info, influence, support level)
- **RACI Matrix**: Assign Responsible, Accountable, Consulted, and Informed roles per workstream
- **Communication Plans**: Define communication channels and frequency per stakeholder
- **Multiple Visualizations**:
  - Network Graph (React Flow)
  - Influence/Interest Matrix (2x2 quadrant)
  - Org Chart (Mermaid)
  - RACI Matrix (editable table)
- **AI Chat Assistant**: Ask natural language questions about your stakeholders (powered by Ollama/Llama)
- **Export**: Export to CSV, JSON, or full database backup

## Tech Stack

- **Desktop**: Tauri 2.0
- **Frontend**: React 18 + TypeScript + Vite
- **UI**: Tailwind CSS + shadcn/ui components
- **Database**: sql.js (SQLite in WebAssembly)
- **Visualizations**: React Flow, Mermaid
- **AI**: Ollama (local LLM)

## Prerequisites

1. **Node.js** 18+ and npm
2. **Rust** (for Tauri): Install from https://rustup.rs
3. **Ollama** (for AI chat): Install from https://ollama.ai

## Getting Started

### 1. Install Dependencies

```bash
cd stakeholder-mapping
npm install
```

### 2. Run in Development Mode

For web-only development (faster):

```bash
npm run dev
```

Then open http://localhost:1420

For full desktop app:

```bash
npm run tauri dev
```

### 3. Build for Production

```bash
npm run tauri build
```

The built app will be in `src-tauri/target/release/`.

## Using the AI Chat

1. Make sure Ollama is running: `ollama serve`
2. Pull a model: `ollama pull llama3.2` (or any other model)
3. The chat panel will connect automatically

### Example Queries

- "Who is responsible for design?"
- "List all high-influence stakeholders"
- "Show me the champions"
- "Who should I email weekly?"
- "Who is in the Engineering department?"

## Data Storage

Data is stored in your browser's localStorage (for web mode) or in the app's data directory (for desktop mode). You can export your data at any time using the Export menu.

## License

Apache License 2.0 - see [LICENSE](LICENSE) for details.

