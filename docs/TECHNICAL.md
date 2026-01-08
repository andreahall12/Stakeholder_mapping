# Stakeholder Mapping Tool - Technical Documentation

## Document Information
- **Version**: 1.0
- **Last Updated**: January 2026

---

## 1. Architecture Overview

### 1.1 High-Level Architecture

```
+-------------------+     +------------------+     +----------------+
|                   |     |                  |     |                |
|   React Frontend  |<--->|   Zustand Store  |<--->|   sql.js DB    |
|   (TypeScript)    |     |   (State Mgmt)   |     |   (SQLite)     |
|                   |     |                  |     |                |
+-------------------+     +------------------+     +----------------+
         |                                                 |
         v                                                 v
+-------------------+                          +-------------------+
|   React Flow     |                           |   localStorage    |
|   Mermaid        |                           |   (Persistence)   |
+-------------------+                          +-------------------+
         |
         v
+-------------------+
|   Ollama API     |
|   (Local LLM)    |
+-------------------+
```

### 1.2 Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| Framework | React 18 | UI components and reactivity |
| Language | TypeScript | Type safety |
| Build Tool | Vite | Fast development and bundling |
| State Management | Zustand | Global state with persistence |
| Database | sql.js | SQLite compiled to WebAssembly |
| UI Components | shadcn/ui | Accessible, customizable components |
| Styling | Tailwind CSS | Utility-first CSS |
| Visualization | React Flow | Node-based graphs |
| Charts | Mermaid | Declarative diagrams |
| Desktop | Tauri 2.0 | Native desktop wrapper |
| AI | Ollama | Local LLM inference |

---

## 2. Project Structure

```
stakeholder-mapping/
├── src/
│   ├── main.tsx              # Application entry point
│   ├── App.tsx               # Root component
│   ├── index.css             # Global styles
│   │
│   ├── ai/                   # AI integration
│   │   ├── chatService.ts    # Ollama API communication
│   │   └── intentParser.ts   # Natural language parsing
│   │
│   ├── components/
│   │   ├── chat/             # AI chat panel
│   │   ├── layout/           # Header, tabs, notifications
│   │   ├── stakeholders/     # Stakeholder-related dialogs
│   │   └── ui/               # shadcn/ui components
│   │
│   ├── db/
│   │   ├── database.ts       # Database initialization and repos
│   │   ├── schema.sql        # Table definitions
│   │   └── seed.ts           # Sample data generator
│   │
│   ├── hooks/
│   │   └── useKeyboardShortcuts.ts
│   │
│   ├── lib/
│   │   ├── export.ts         # CSV, JSON, PDF export
│   │   └── utils.ts          # Utility functions
│   │
│   ├── store/
│   │   └── index.ts          # Zustand store definition
│   │
│   ├── types/
│   │   └── index.ts          # TypeScript interfaces
│   │
│   └── views/
│       ├── Dashboard.tsx     # KPI dashboard
│       ├── InfluenceMatrix.tsx
│       ├── NetworkGraph.tsx
│       ├── OrgChart.tsx
│       └── RACIMatrix.tsx
│
├── src-tauri/                # Tauri desktop app config
├── public/                   # Static assets
├── docs/                     # Documentation
└── package.json
```

---

## 3. Database Schema

### 3.1 Entity Relationship Diagram

```
projects
    |
    +--< workstreams
    |
    +--< project_stakeholders >--+ stakeholders
                |                       |
                +--< raci_assignments   +--< stakeholder_history
                |                       |
                +--< communication_plans +--< stakeholder_tags >--+ tags
                |                       |
                +--< engagement_logs    +--< relationships (self-ref)
```

### 3.2 Table Definitions

#### projects
```sql
CREATE TABLE projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  status TEXT DEFAULT 'active',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
```

#### stakeholders
```sql
CREATE TABLE stakeholders (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  job_title TEXT DEFAULT '',
  department TEXT DEFAULT '',
  email TEXT DEFAULT '',
  slack TEXT DEFAULT '',
  influence_level TEXT DEFAULT 'medium',
  support_level TEXT DEFAULT 'neutral',
  notes TEXT DEFAULT ''
);
```

#### workstreams
```sql
CREATE TABLE workstreams (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);
```

#### project_stakeholders
```sql
CREATE TABLE project_stakeholders (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  stakeholder_id TEXT NOT NULL,
  project_function TEXT DEFAULT '',
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (stakeholder_id) REFERENCES stakeholders(id) ON DELETE CASCADE,
  UNIQUE(project_id, stakeholder_id)
);
```

#### raci_assignments
```sql
CREATE TABLE raci_assignments (
  id TEXT PRIMARY KEY,
  project_stakeholder_id TEXT NOT NULL,
  workstream_id TEXT NOT NULL,
  role TEXT NOT NULL,
  FOREIGN KEY (project_stakeholder_id) REFERENCES project_stakeholders(id) ON DELETE CASCADE,
  FOREIGN KEY (workstream_id) REFERENCES workstreams(id) ON DELETE CASCADE,
  UNIQUE(project_stakeholder_id, workstream_id)
);
```

#### communication_plans
```sql
CREATE TABLE communication_plans (
  id TEXT PRIMARY KEY,
  project_stakeholder_id TEXT NOT NULL UNIQUE,
  channel TEXT DEFAULT 'email',
  frequency TEXT DEFAULT 'weekly',
  notes TEXT DEFAULT '',
  last_contact_date TEXT,
  FOREIGN KEY (project_stakeholder_id) REFERENCES project_stakeholders(id) ON DELETE CASCADE
);
```

#### engagement_logs
```sql
CREATE TABLE engagement_logs (
  id TEXT PRIMARY KEY,
  project_stakeholder_id TEXT NOT NULL,
  date TEXT NOT NULL,
  type TEXT NOT NULL,
  summary TEXT DEFAULT '',
  sentiment TEXT DEFAULT 'neutral',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_stakeholder_id) REFERENCES project_stakeholders(id) ON DELETE CASCADE
);
```

#### stakeholder_history
```sql
CREATE TABLE stakeholder_history (
  id TEXT PRIMARY KEY,
  stakeholder_id TEXT NOT NULL,
  field TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  changed_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT,
  FOREIGN KEY (stakeholder_id) REFERENCES stakeholders(id) ON DELETE CASCADE
);
```

#### tags
```sql
CREATE TABLE tags (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  color TEXT DEFAULT '#6366f1'
);
```

#### stakeholder_tags
```sql
CREATE TABLE stakeholder_tags (
  stakeholder_id TEXT NOT NULL,
  tag_id TEXT NOT NULL,
  PRIMARY KEY (stakeholder_id, tag_id),
  FOREIGN KEY (stakeholder_id) REFERENCES stakeholders(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);
```

#### relationships
```sql
CREATE TABLE relationships (
  id TEXT PRIMARY KEY,
  from_stakeholder_id TEXT NOT NULL,
  to_stakeholder_id TEXT NOT NULL,
  type TEXT NOT NULL,
  strength TEXT DEFAULT 'moderate',
  notes TEXT,
  FOREIGN KEY (from_stakeholder_id) REFERENCES stakeholders(id) ON DELETE CASCADE,
  FOREIGN KEY (to_stakeholder_id) REFERENCES stakeholders(id) ON DELETE CASCADE
);
```

---

## 4. State Management

### 4.1 Zustand Store Structure

```typescript
interface StoreState {
  // Initialization
  initialized: boolean;
  initialize: () => Promise<void>;

  // Current selections
  currentProjectId: string | null;
  currentView: ViewType;

  // Core entities
  projects: Project[];
  stakeholders: Stakeholder[];
  workstreams: Workstream[];
  projectStakeholders: ProjectStakeholder[];
  raciAssignments: RACIAssignment[];
  commPlans: CommunicationPlan[];

  // Extended features
  engagementLogs: EngagementLog[];
  stakeholderHistory: StakeholderHistory[];
  tags: Tag[];
  relationships: Relationship[];

  // UI state
  chatMessages: ChatMessage[];
  chatOpen: boolean;
  sidebarOpen: boolean;
  anonymousMode: boolean;

  // Dashboard helpers
  getOverdueStakeholders: () => Stakeholder[];
  getBlockers: () => Stakeholder[];
  getRACICoverageGaps: () => { workstreamId, missingRole }[];
}
```

### 4.2 Data Flow

1. **Initialization**: `App.tsx` calls `store.initialize()`
2. **Database Load**: sql.js loads from localStorage or creates fresh
3. **State Population**: Repositories fetch data into Zustand
4. **UI Rendering**: Components subscribe to store slices
5. **User Actions**: Components call store actions
6. **Persistence**: Actions update DB, which syncs to localStorage

---

## 5. Key Components

### 5.1 Database Layer (`src/db/database.ts`)

The database layer uses sql.js (SQLite compiled to WebAssembly):

```typescript
// Initialization
export async function initDatabase(): Promise<void> {
  const SQL = await initSqlJs({ locateFile: file => `/${file}` });
  
  // Try to load from localStorage
  const saved = localStorage.getItem(DB_KEY);
  if (saved) {
    db = new SQL.Database(base64ToArray(saved));
  } else {
    db = new SQL.Database();
    db.run(SCHEMA);
  }
}

// Repositories provide CRUD operations
export const stakeholdersRepo = {
  getAll: () => { /* SELECT * FROM stakeholders */ },
  getById: (id) => { /* SELECT WHERE id = ? */ },
  create: (data) => { /* INSERT */ },
  update: (id, data) => { /* UPDATE */ },
  delete: (id) => { /* DELETE */ },
};
```

### 5.2 AI Integration (`src/ai/chatService.ts`)

Connects to Ollama running locally:

```typescript
const OLLAMA_URL = 'http://localhost:11434/api/generate';

export async function processQuery(
  query: string,
  context: StakeholderContext
): Promise<string> {
  // Build prompt with stakeholder context
  const prompt = buildPrompt(query, context);
  
  // Call Ollama API
  const response = await fetch(OLLAMA_URL, {
    method: 'POST',
    body: JSON.stringify({
      model: 'llama3.2',
      prompt,
      stream: false
    })
  });
  
  return response.json().then(r => r.response);
}
```

### 5.3 Export Functions (`src/lib/export.ts`)

```typescript
// CSV Export
export function exportToCSV(projectId: string): { stakeholders, raci, commPlans }

// JSON Export
export function exportToJSON(projectId: string): string

// Full Database Backup
export function exportFullDatabase(): Uint8Array

// PDF Report (opens print dialog)
export function generatePDFReport(projectId: string): string  // Returns HTML
```

---

## 6. API Reference

### 6.1 Store Actions

#### Project Management
```typescript
createProject(project: { name, description, status }) => Project
updateProject(id: string, updates: Partial<Project>) => void
deleteProject(id: string) => void
setCurrentProject(id: string | null) => void
```

#### Stakeholder Management
```typescript
createStakeholder(stakeholder: Omit<Stakeholder, 'id'>) => Stakeholder
updateStakeholder(id: string, updates: Partial<Stakeholder>) => void
deleteStakeholder(id: string) => void
assignStakeholder(stakeholderId, projectId, projectFunction) => ProjectStakeholder
unassignStakeholder(stakeholderId, projectId) => void
```

#### RACI Management
```typescript
setRACIRole(projectStakeholderId, workstreamId, role: 'R'|'A'|'C'|'I') => void
removeRACIRole(projectStakeholderId, workstreamId) => void
```

#### Tags
```typescript
createTag(name: string, color?: string) => Tag
updateTag(id, name, color) => void
deleteTag(id) => void
addTagToStakeholder(stakeholderId, tagId) => void
removeTagFromStakeholder(stakeholderId, tagId) => void
```

#### Engagement
```typescript
addEngagementLog(log: { projectStakeholderId, date, type, summary, sentiment }) => EngagementLog
updateEngagementLog(id, updates) => void
deleteEngagementLog(id) => void
```

---

## 7. Development Guide

### 7.1 Setting Up Development Environment

```bash
# Clone repository
git clone https://github.com/andreahall12/Stakeholder_mapping.git
cd Stakeholder_mapping

# Install dependencies
npm install

# Start development server
npm run dev -- --port 5173

# Open http://localhost:5173
```

### 7.2 Building for Production

```bash
# Web build
npm run build

# Desktop build (requires Rust)
npm run tauri build
```

### 7.3 Project Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
| `npm run tauri dev` | Start Tauri desktop dev |
| `npm run tauri build` | Build desktop app |

### 7.4 Adding New Features

1. **Define types** in `src/types/index.ts`
2. **Update schema** in `src/db/schema.sql`
3. **Add repository** methods in `src/db/database.ts`
4. **Add store actions** in `src/store/index.ts`
5. **Create UI components** in `src/components/`
6. **Update views** as needed

---

## 8. Testing

### 8.1 Manual Testing Checklist

- [ ] Create new project
- [ ] Add stakeholder via form
- [ ] Add stakeholder via AI Quick Add
- [ ] Import stakeholders from CSV
- [ ] Assign RACI roles
- [ ] Set communication plan
- [ ] Log engagement
- [ ] Create and assign tags
- [ ] Switch between all views
- [ ] Export to CSV, JSON, PDF
- [ ] Toggle anonymous mode
- [ ] Use keyboard shortcuts
- [ ] AI chat responds correctly

### 8.2 Browser Compatibility

Test in:
- Chrome 100+
- Firefox 100+
- Safari 15+
- Edge 100+

---


---

## 9. Security

### 9.1 Data Security

**Storage:**
- Data is stored in browser localStorage as base64-encoded SQLite
- Not encrypted at rest - consider this for sensitive data
- Data persists until browser data is cleared

**Recommendations:**
- Use on private/work devices only for sensitive data
- Export regular backups to secure location
- Consider Tauri desktop build for isolation

### 9.2 Input Validation

The application implements several security measures:

**SQL Injection Prevention:**
- All database queries use parameterized statements
- User input is never directly interpolated into SQL strings
- See `src/db/database.ts` for query patterns

**XSS Prevention:**
- HTML output is escaped using `escapeHTML()` function
- PDF reports sanitize all stakeholder data before rendering
- See `src/lib/export.ts` for implementation

**CSV Formula Injection Prevention:**
- Imported CSV values are sanitized
- Leading characters that could trigger Excel formulas (=, +, -, @) are neutralized
- String length limits prevent DoS attacks
- See `src/components/stakeholders/ImportDialog.tsx`

### 9.3 AI Security

**Local Processing:**
- AI features use Ollama running on localhost:11434
- No data is sent to external servers
- No API keys stored

**Prompt Injection:**
- AI responses are treated as untrusted
- Parsed JSON is validated before use
- See `src/ai/chatService.ts`

### 9.4 External Dependencies

**sql.js CDN:**
- Currently loaded from sql.js.org CDN
- For production, consider bundling locally
- See `src/db/database.ts` for loading mechanism

**Subresource Integrity:**
- Consider adding SRI hashes for CDN resources
- Protects against CDN compromise
## 10. Troubleshooting

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| "sql.js not loading" | WASM file missing | Check public folder has sql-wasm.wasm |
| "Ollama connection failed" | Ollama not running | Run `ollama serve` |
| "Data not persisting" | localStorage quota | Export and clear old data |
| "Build fails on types" | Missing type export | Check types/index.ts exports |

### Debug Mode

Open browser DevTools and check:
- Console for errors
- Network tab for failed requests
- Application > Local Storage for data

---

## 11. Contributing

### Code Style

- Use TypeScript strict mode
- Follow existing patterns
- Use shadcn/ui components where possible
- Keep components small and focused

### Pull Request Process

1. Fork the repository
2. Create feature branch
3. Make changes with tests
4. Submit PR with description
5. Address review feedback

---

## 12. License

Apache License 2.0 - see LICENSE file for full text.
