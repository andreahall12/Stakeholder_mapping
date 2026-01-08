-- Stakeholder Mapping Database Schema

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
    FOREIGN KEY (project_stakeholder_id) REFERENCES project_stakeholders(id) ON DELETE CASCADE
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_workstreams_project ON workstreams(project_id);
CREATE INDEX IF NOT EXISTS idx_project_stakeholders_project ON project_stakeholders(project_id);
CREATE INDEX IF NOT EXISTS idx_project_stakeholders_stakeholder ON project_stakeholders(stakeholder_id);
CREATE INDEX IF NOT EXISTS idx_raci_project_stakeholder ON raci_assignments(project_stakeholder_id);
CREATE INDEX IF NOT EXISTS idx_raci_workstream ON raci_assignments(workstream_id);
CREATE INDEX IF NOT EXISTS idx_comm_project_stakeholder ON comm_plans(project_stakeholder_id);

