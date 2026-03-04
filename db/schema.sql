-- Stakeholder Mapping Database Schema
-- Compatible with the legacy React/TypeScript app schema.

PRAGMA journal_mode=WAL;
PRAGMA foreign_keys=ON;

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    status TEXT DEFAULT 'active' CHECK(status IN ('active', 'archived', 'planning')),
    created_at TEXT DEFAULT (datetime('now'))
);

-- Stakeholders table (global, can be assigned to multiple projects)
CREATE TABLE IF NOT EXISTS stakeholders (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    job_title TEXT DEFAULT '',
    department TEXT DEFAULT '',
    email TEXT DEFAULT '',
    slack TEXT DEFAULT '',
    influence_level TEXT DEFAULT 'medium' CHECK(influence_level IN ('high', 'medium', 'low')),
    support_level TEXT DEFAULT 'neutral' CHECK(support_level IN ('champion', 'supporter', 'neutral', 'resistant')),
    notes TEXT DEFAULT ''
);

-- Workstreams within projects
CREATE TABLE IF NOT EXISTS workstreams (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- Many-to-many relationship: stakeholders assigned to projects
CREATE TABLE IF NOT EXISTS project_stakeholders (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    stakeholder_id TEXT NOT NULL,
    project_function TEXT DEFAULT '',
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (stakeholder_id) REFERENCES stakeholders(id) ON DELETE CASCADE,
    UNIQUE(project_id, stakeholder_id)
);

-- RACI assignments: stakeholder roles per workstream
CREATE TABLE IF NOT EXISTS raci_assignments (
    id TEXT PRIMARY KEY,
    project_stakeholder_id TEXT NOT NULL,
    workstream_id TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('R', 'A', 'C', 'I')),
    FOREIGN KEY (project_stakeholder_id) REFERENCES project_stakeholders(id) ON DELETE CASCADE,
    FOREIGN KEY (workstream_id) REFERENCES workstreams(id) ON DELETE CASCADE,
    UNIQUE(project_stakeholder_id, workstream_id)
);

-- Communication plans per project assignment
CREATE TABLE IF NOT EXISTS comm_plans (
    id TEXT PRIMARY KEY,
    project_stakeholder_id TEXT NOT NULL,
    channel TEXT DEFAULT 'email' CHECK(channel IN ('email', 'slack', 'jira', 'briefing', 'meeting', 'other')),
    frequency TEXT DEFAULT 'weekly' CHECK(frequency IN ('daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'as-needed')),
    notes TEXT DEFAULT '',
    last_contact_date TEXT,
    FOREIGN KEY (project_stakeholder_id) REFERENCES project_stakeholders(id) ON DELETE CASCADE
);

-- Engagement logs: interactions with stakeholders
CREATE TABLE IF NOT EXISTS engagement_logs (
    id TEXT PRIMARY KEY,
    project_stakeholder_id TEXT NOT NULL,
    date TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('meeting', 'email', 'call', 'decision', 'note')),
    summary TEXT DEFAULT '',
    sentiment TEXT DEFAULT 'neutral' CHECK(sentiment IN ('positive', 'neutral', 'negative')),
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (project_stakeholder_id) REFERENCES project_stakeholders(id) ON DELETE CASCADE
);

-- Stakeholder history: track changes to influence/support levels
CREATE TABLE IF NOT EXISTS stakeholder_history (
    id TEXT PRIMARY KEY,
    stakeholder_id TEXT NOT NULL,
    field TEXT NOT NULL CHECK(field IN ('influenceLevel', 'supportLevel')),
    old_value TEXT NOT NULL,
    new_value TEXT NOT NULL,
    changed_at TEXT DEFAULT (datetime('now')),
    notes TEXT DEFAULT '',
    FOREIGN KEY (stakeholder_id) REFERENCES stakeholders(id) ON DELETE CASCADE
);

-- Tags for categorizing stakeholders
CREATE TABLE IF NOT EXISTS tags (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    color TEXT DEFAULT '#6366f1'
);

-- Many-to-many: stakeholders to tags
CREATE TABLE IF NOT EXISTS stakeholder_tags (
    stakeholder_id TEXT NOT NULL,
    tag_id TEXT NOT NULL,
    PRIMARY KEY (stakeholder_id, tag_id),
    FOREIGN KEY (stakeholder_id) REFERENCES stakeholders(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

-- Relationships between stakeholders
CREATE TABLE IF NOT EXISTS relationships (
    id TEXT PRIMARY KEY,
    from_stakeholder_id TEXT NOT NULL,
    to_stakeholder_id TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('reports_to', 'influences', 'allied_with', 'conflicts_with')),
    strength TEXT DEFAULT 'moderate' CHECK(strength IN ('strong', 'moderate', 'weak')),
    notes TEXT DEFAULT '',
    FOREIGN KEY (from_stakeholder_id) REFERENCES stakeholders(id) ON DELETE CASCADE,
    FOREIGN KEY (to_stakeholder_id) REFERENCES stakeholders(id) ON DELETE CASCADE
);

-- Audit log for tracking all mutations (security requirement)
CREATE TABLE IF NOT EXISTS audit_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp TEXT DEFAULT (datetime('now')),
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    details TEXT DEFAULT ''
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_workstreams_project ON workstreams(project_id);
CREATE INDEX IF NOT EXISTS idx_project_stakeholders_project ON project_stakeholders(project_id);
CREATE INDEX IF NOT EXISTS idx_project_stakeholders_stakeholder ON project_stakeholders(stakeholder_id);
CREATE INDEX IF NOT EXISTS idx_raci_project_stakeholder ON raci_assignments(project_stakeholder_id);
CREATE INDEX IF NOT EXISTS idx_raci_workstream ON raci_assignments(workstream_id);
CREATE INDEX IF NOT EXISTS idx_comm_project_stakeholder ON comm_plans(project_stakeholder_id);
CREATE INDEX IF NOT EXISTS idx_engagement_project_stakeholder ON engagement_logs(project_stakeholder_id);
CREATE INDEX IF NOT EXISTS idx_history_stakeholder ON stakeholder_history(stakeholder_id);
CREATE INDEX IF NOT EXISTS idx_relationships_from ON relationships(from_stakeholder_id);
CREATE INDEX IF NOT EXISTS idx_relationships_to ON relationships(to_stakeholder_id);
CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_log(timestamp);
