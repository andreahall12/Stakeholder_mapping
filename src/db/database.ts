import { generateId } from '@/lib/utils';
import type {
  Project,
  Stakeholder,
  Workstream,
  ProjectStakeholder,
  RACIAssignment,
  CommunicationPlan,
  RACIRole,
  CommunicationChannel,
  CommunicationFrequency,
  EngagementLog,
  EngagementType,
  Sentiment,
  StakeholderHistory,
  Tag,
  Relationship,
  RelationshipType,
  RelationshipStrength,
} from '@/types';

const SCHEMA = `
CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    status TEXT DEFAULT 'active',
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS stakeholders (
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

CREATE TABLE IF NOT EXISTS workstreams (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT DEFAULT ''
);

CREATE TABLE IF NOT EXISTS project_stakeholders (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    stakeholder_id TEXT NOT NULL,
    project_function TEXT DEFAULT '',
    UNIQUE(project_id, stakeholder_id)
);

CREATE TABLE IF NOT EXISTS raci_assignments (
    id TEXT PRIMARY KEY,
    project_stakeholder_id TEXT NOT NULL,
    workstream_id TEXT NOT NULL,
    role TEXT NOT NULL,
    UNIQUE(project_stakeholder_id, workstream_id)
);

CREATE TABLE IF NOT EXISTS comm_plans (
    id TEXT PRIMARY KEY,
    project_stakeholder_id TEXT NOT NULL,
    channel TEXT DEFAULT 'email',
    frequency TEXT DEFAULT 'weekly',
    notes TEXT DEFAULT '',
    last_contact_date TEXT
);

CREATE TABLE IF NOT EXISTS engagement_logs (
    id TEXT PRIMARY KEY,
    project_stakeholder_id TEXT NOT NULL,
    date TEXT NOT NULL,
    type TEXT CHECK(type IN ('meeting', 'email', 'call', 'decision', 'note')),
    summary TEXT,
    sentiment TEXT CHECK(sentiment IN ('positive', 'neutral', 'negative')),
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS stakeholder_history (
    id TEXT PRIMARY KEY,
    stakeholder_id TEXT NOT NULL,
    field TEXT NOT NULL,
    old_value TEXT,
    new_value TEXT,
    changed_at TEXT DEFAULT (datetime('now')),
    notes TEXT
);

CREATE TABLE IF NOT EXISTS tags (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    color TEXT DEFAULT '#6366f1'
);

CREATE TABLE IF NOT EXISTS stakeholder_tags (
    stakeholder_id TEXT NOT NULL,
    tag_id TEXT NOT NULL,
    PRIMARY KEY (stakeholder_id, tag_id)
);

CREATE TABLE IF NOT EXISTS relationships (
    id TEXT PRIMARY KEY,
    from_stakeholder_id TEXT NOT NULL,
    to_stakeholder_id TEXT NOT NULL,
    type TEXT CHECK(type IN ('reports_to', 'influences', 'allied_with', 'conflicts_with')),
    strength TEXT CHECK(strength IN ('strong', 'moderate', 'weak')),
    notes TEXT
);
`;

interface SqlJsDatabase {
  run(sql: string, params?: unknown[]): void;
  exec(sql: string): { columns: string[]; values: unknown[][] }[];
  prepare(sql: string): {
    bind(params?: unknown[]): void;
    step(): boolean;
    getAsObject(): Record<string, unknown>;
    free(): void;
  };
  export(): Uint8Array;
}

interface SqlJsStatic {
  Database: new (data?: ArrayLike<number>) => SqlJsDatabase;
}

let db: SqlJsDatabase | null = null;
let SQL: SqlJsStatic | null = null;

function loadSqlJsScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if ((window as unknown as Record<string, unknown>).initSqlJs) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://sql.js.org/dist/sql-wasm.js';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load sql.js'));
    document.head.appendChild(script);
  });
}

export async function initDatabase(): Promise<SqlJsDatabase> {
  if (db) return db;

  await loadSqlJsScript();
  
  const initSqlJs = (window as unknown as Record<string, unknown>).initSqlJs as (config: { locateFile: (file: string) => string }) => Promise<SqlJsStatic>;
  
  SQL = await initSqlJs({
    locateFile: (file: string) => `https://sql.js.org/dist/${file}`,
  });

  const savedData = localStorage.getItem('stakeholder_db');
  if (savedData) {
    const data = Uint8Array.from(atob(savedData), (c) => c.charCodeAt(0));
    db = new SQL.Database(data);
    // Run migrations for new tables
    migrateDatabase();
  } else {
    db = new SQL.Database();
    db.run(SCHEMA);
    saveDatabase();
  }

  return db;
}

function migrateDatabase(): void {
  if (!db) return;
  // Add new tables if they don't exist (safe to run multiple times)
  const migrations = [
    `CREATE TABLE IF NOT EXISTS engagement_logs (
      id TEXT PRIMARY KEY,
      project_stakeholder_id TEXT NOT NULL,
      date TEXT NOT NULL,
      type TEXT CHECK(type IN ('meeting', 'email', 'call', 'decision', 'note')),
      summary TEXT,
      sentiment TEXT CHECK(sentiment IN ('positive', 'neutral', 'negative')),
      created_at TEXT DEFAULT (datetime('now'))
    )`,
    `CREATE TABLE IF NOT EXISTS stakeholder_history (
      id TEXT PRIMARY KEY,
      stakeholder_id TEXT NOT NULL,
      field TEXT NOT NULL,
      old_value TEXT,
      new_value TEXT,
      changed_at TEXT DEFAULT (datetime('now')),
      notes TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS tags (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      color TEXT DEFAULT '#6366f1'
    )`,
    `CREATE TABLE IF NOT EXISTS stakeholder_tags (
      stakeholder_id TEXT NOT NULL,
      tag_id TEXT NOT NULL,
      PRIMARY KEY (stakeholder_id, tag_id)
    )`,
    `CREATE TABLE IF NOT EXISTS relationships (
      id TEXT PRIMARY KEY,
      from_stakeholder_id TEXT NOT NULL,
      to_stakeholder_id TEXT NOT NULL,
      type TEXT CHECK(type IN ('reports_to', 'influences', 'allied_with', 'conflicts_with')),
      strength TEXT CHECK(strength IN ('strong', 'moderate', 'weak')),
      notes TEXT
    )`,
  ];
  
  for (const migration of migrations) {
    try {
      db.run(migration);
    } catch (e) {
      console.warn('Migration warning:', e);
    }
  }
  
  // Add last_contact_date column if it doesn't exist
  try {
    db.run('ALTER TABLE comm_plans ADD COLUMN last_contact_date TEXT');
  } catch {
    // Column already exists
  }
  
  saveDatabase();
}

export function saveDatabase(): void {
  if (!db) return;
  const data = db.export();
  const base64 = btoa(String.fromCharCode(...data));
  localStorage.setItem('stakeholder_db', base64);
}

export function getDatabase(): SqlJsDatabase {
  if (!db) throw new Error('Database not initialized');
  return db;
}

export function exportDatabase(): Uint8Array {
  if (!db) throw new Error('Database not initialized');
  return db.export();
}

function query<T>(sql: string, params: unknown[] = []): T[] {
  const database = getDatabase();
  const stmt = database.prepare(sql);
  stmt.bind(params);
  const results: T[] = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject() as T);
  }
  stmt.free();
  return results;
}

function run(sql: string, params: unknown[] = []): void {
  const database = getDatabase();
  database.run(sql, params);
  saveDatabase();
}

export const projectsRepo = {
  getAll(): Project[] {
    return query<Project>('SELECT * FROM projects ORDER BY created_at DESC');
  },
  getById(id: string): Project | null {
    const results = query<Project>('SELECT * FROM projects WHERE id = ?', [id]);
    return results[0] || null;
  },
  create(project: Omit<Project, 'id' | 'createdAt'>): Project {
    const id = generateId();
    const createdAt = new Date().toISOString();
    run('INSERT INTO projects (id, name, description, status, created_at) VALUES (?, ?, ?, ?, ?)',
      [id, project.name, project.description, project.status, createdAt]);
    return { id, ...project, createdAt };
  },
  update(id: string, project: Partial<Project>): void {
    const fields: string[] = [];
    const values: unknown[] = [];
    if (project.name !== undefined) { fields.push('name = ?'); values.push(project.name); }
    if (project.description !== undefined) { fields.push('description = ?'); values.push(project.description); }
    if (project.status !== undefined) { fields.push('status = ?'); values.push(project.status); }
    if (fields.length > 0) { values.push(id); run(`UPDATE projects SET ${fields.join(', ')} WHERE id = ?`, values); }
  },
  delete(id: string): void { run('DELETE FROM projects WHERE id = ?', [id]); },
};

export const stakeholdersRepo = {
  getAll(): Stakeholder[] {
    return query<Stakeholder>('SELECT * FROM stakeholders ORDER BY name');
  },
  getById(id: string): Stakeholder | null {
    const results = query<Stakeholder>('SELECT * FROM stakeholders WHERE id = ?', [id]);
    return results[0] || null;
  },
  getByProject(projectId: string): (Stakeholder & { projectFunction: string; projectStakeholderId: string })[] {
    return query(`SELECT s.*, ps.project_function as projectFunction, ps.id as projectStakeholderId
       FROM stakeholders s JOIN project_stakeholders ps ON s.id = ps.stakeholder_id
       WHERE ps.project_id = ? ORDER BY s.name`, [projectId]);
  },
  create(stakeholder: Omit<Stakeholder, 'id'>): Stakeholder {
    const id = generateId();
    run(`INSERT INTO stakeholders (id, name, job_title, department, email, slack, influence_level, support_level, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, stakeholder.name, stakeholder.jobTitle, stakeholder.department, stakeholder.email,
       stakeholder.slack, stakeholder.influenceLevel, stakeholder.supportLevel, stakeholder.notes]);
    return { id, ...stakeholder };
  },
  update(id: string, stakeholder: Partial<Stakeholder>): void {
    const fields: string[] = [];
    const values: unknown[] = [];
    const fieldMap: Record<string, string> = { name: 'name', jobTitle: 'job_title', department: 'department',
      email: 'email', slack: 'slack', influenceLevel: 'influence_level', supportLevel: 'support_level', notes: 'notes' };
    for (const [key, column] of Object.entries(fieldMap)) {
      const value = stakeholder[key as keyof Stakeholder];
      if (value !== undefined) { fields.push(`${column} = ?`); values.push(value); }
    }
    if (fields.length > 0) { values.push(id); run(`UPDATE stakeholders SET ${fields.join(', ')} WHERE id = ?`, values); }
  },
  delete(id: string): void { run('DELETE FROM stakeholders WHERE id = ?', [id]); },
};

export const workstreamsRepo = {
  getByProject(projectId: string): Workstream[] {
    return query<Workstream>('SELECT * FROM workstreams WHERE project_id = ? ORDER BY name', [projectId]);
  },
  create(workstream: Omit<Workstream, 'id'>): Workstream {
    const id = generateId();
    run('INSERT INTO workstreams (id, project_id, name, description) VALUES (?, ?, ?, ?)',
      [id, workstream.projectId, workstream.name, workstream.description]);
    return { id, ...workstream };
  },
  update(id: string, workstream: Partial<Workstream>): void {
    const fields: string[] = [];
    const values: unknown[] = [];
    if (workstream.name !== undefined) { fields.push('name = ?'); values.push(workstream.name); }
    if (workstream.description !== undefined) { fields.push('description = ?'); values.push(workstream.description); }
    if (fields.length > 0) { values.push(id); run(`UPDATE workstreams SET ${fields.join(', ')} WHERE id = ?`, values); }
  },
  delete(id: string): void { run('DELETE FROM workstreams WHERE id = ?', [id]); },
};

export const projectStakeholdersRepo = {
  create(assignment: Omit<ProjectStakeholder, 'id'>): ProjectStakeholder {
    const id = generateId();
    run('INSERT INTO project_stakeholders (id, project_id, stakeholder_id, project_function) VALUES (?, ?, ?, ?)',
      [id, assignment.projectId, assignment.stakeholderId, assignment.projectFunction]);
    return { id, ...assignment };
  },
  updateFunction(id: string, projectFunction: string): void {
    run('UPDATE project_stakeholders SET project_function = ? WHERE id = ?', [projectFunction, id]);
  },
  deleteByStakeholderAndProject(stakeholderId: string, projectId: string): void {
    run('DELETE FROM project_stakeholders WHERE stakeholder_id = ? AND project_id = ?', [stakeholderId, projectId]);
  },
};

export const raciRepo = {
  getByProject(projectId: string): (RACIAssignment & { workstreamName: string; stakeholderName: string; stakeholderId: string })[] {
    return query(`SELECT r.*, w.name as workstreamName, s.name as stakeholderName, s.id as stakeholderId
       FROM raci_assignments r
       JOIN project_stakeholders ps ON r.project_stakeholder_id = ps.id
       JOIN workstreams w ON r.workstream_id = w.id
       JOIN stakeholders s ON ps.stakeholder_id = s.id
       WHERE ps.project_id = ?`, [projectId]);
  },
  set(projectStakeholderId: string, workstreamId: string, role: RACIRole): RACIAssignment {
    const existing = query<RACIAssignment>('SELECT * FROM raci_assignments WHERE project_stakeholder_id = ? AND workstream_id = ?',
      [projectStakeholderId, workstreamId]);
    if (existing.length > 0) {
      run('UPDATE raci_assignments SET role = ? WHERE id = ?', [role, existing[0].id]);
      return { ...existing[0], role };
    }
    const id = generateId();
    run('INSERT INTO raci_assignments (id, project_stakeholder_id, workstream_id, role) VALUES (?, ?, ?, ?)',
      [id, projectStakeholderId, workstreamId, role]);
    return { id, projectStakeholderId, workstreamId, role };
  },
  remove(projectStakeholderId: string, workstreamId: string): void {
    run('DELETE FROM raci_assignments WHERE project_stakeholder_id = ? AND workstream_id = ?', [projectStakeholderId, workstreamId]);
  },
};

export const commPlansRepo = {
  getByProject(projectId: string): (CommunicationPlan & { stakeholderName: string; stakeholderId: string })[] {
    return query(`SELECT c.*, c.last_contact_date as lastContactDate, s.name as stakeholderName, s.id as stakeholderId
       FROM comm_plans c
       JOIN project_stakeholders ps ON c.project_stakeholder_id = ps.id
       JOIN stakeholders s ON ps.stakeholder_id = s.id
       WHERE ps.project_id = ?`, [projectId]);
  },
  set(projectStakeholderId: string, channel: CommunicationChannel, frequency: CommunicationFrequency, notes: string = ''): CommunicationPlan {
    const existing = query<CommunicationPlan>('SELECT * FROM comm_plans WHERE project_stakeholder_id = ?', [projectStakeholderId]);
    if (existing.length > 0) {
      run('UPDATE comm_plans SET channel = ?, frequency = ?, notes = ? WHERE id = ?', [channel, frequency, notes, existing[0].id]);
      return { ...existing[0], channel, frequency, notes };
    }
    const id = generateId();
    run('INSERT INTO comm_plans (id, project_stakeholder_id, channel, frequency, notes) VALUES (?, ?, ?, ?, ?)',
      [id, projectStakeholderId, channel, frequency, notes]);
    return { id, projectStakeholderId, channel, frequency, notes };
  },
  updateLastContact(projectStakeholderId: string, date: string): void {
    run('UPDATE comm_plans SET last_contact_date = ? WHERE project_stakeholder_id = ?', [date, projectStakeholderId]);
  },
};

export const engagementLogsRepo = {
  getByProjectStakeholder(projectStakeholderId: string): EngagementLog[] {
    return query<EngagementLog>(
      `SELECT id, project_stakeholder_id as projectStakeholderId, date, type, summary, sentiment, created_at as createdAt
       FROM engagement_logs WHERE project_stakeholder_id = ? ORDER BY date DESC, created_at DESC`,
      [projectStakeholderId]
    );
  },
  getByProject(projectId: string): (EngagementLog & { stakeholderName: string; stakeholderId: string })[] {
    return query(
      `SELECT e.id, e.project_stakeholder_id as projectStakeholderId, e.date, e.type, e.summary, e.sentiment, 
              e.created_at as createdAt, s.name as stakeholderName, s.id as stakeholderId
       FROM engagement_logs e
       JOIN project_stakeholders ps ON e.project_stakeholder_id = ps.id
       JOIN stakeholders s ON ps.stakeholder_id = s.id
       WHERE ps.project_id = ? ORDER BY e.date DESC, e.created_at DESC`,
      [projectId]
    );
  },
  getRecent(projectId: string, limit: number = 10): (EngagementLog & { stakeholderName: string })[] {
    return query(
      `SELECT e.id, e.project_stakeholder_id as projectStakeholderId, e.date, e.type, e.summary, e.sentiment, 
              e.created_at as createdAt, s.name as stakeholderName
       FROM engagement_logs e
       JOIN project_stakeholders ps ON e.project_stakeholder_id = ps.id
       JOIN stakeholders s ON ps.stakeholder_id = s.id
       WHERE ps.project_id = ? ORDER BY e.date DESC, e.created_at DESC LIMIT ?`,
      [projectId, limit]
    );
  },
  create(log: Omit<EngagementLog, 'id' | 'createdAt'>): EngagementLog {
    const id = generateId();
    const createdAt = new Date().toISOString();
    run(
      `INSERT INTO engagement_logs (id, project_stakeholder_id, date, type, summary, sentiment, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, log.projectStakeholderId, log.date, log.type, log.summary, log.sentiment, createdAt]
    );
    // Also update last contact date in comm_plans
    commPlansRepo.updateLastContact(log.projectStakeholderId, log.date);
    return { id, ...log, createdAt };
  },
  update(id: string, log: Partial<EngagementLog>): void {
    const fields: string[] = [];
    const values: unknown[] = [];
    if (log.date !== undefined) { fields.push('date = ?'); values.push(log.date); }
    if (log.type !== undefined) { fields.push('type = ?'); values.push(log.type); }
    if (log.summary !== undefined) { fields.push('summary = ?'); values.push(log.summary); }
    if (log.sentiment !== undefined) { fields.push('sentiment = ?'); values.push(log.sentiment); }
    if (fields.length > 0) {
      values.push(id);
      run(`UPDATE engagement_logs SET ${fields.join(', ')} WHERE id = ?`, values);
    }
  },
  delete(id: string): void {
    run('DELETE FROM engagement_logs WHERE id = ?', [id]);
  },
};

export const stakeholderHistoryRepo = {
  getByStakeholder(stakeholderId: string): StakeholderHistory[] {
    return query<StakeholderHistory>(
      `SELECT id, stakeholder_id as stakeholderId, field, old_value as oldValue, new_value as newValue, 
              changed_at as changedAt, notes
       FROM stakeholder_history WHERE stakeholder_id = ? ORDER BY changed_at DESC`,
      [stakeholderId]
    );
  },
  create(history: Omit<StakeholderHistory, 'id' | 'changedAt'>): StakeholderHistory {
    const id = generateId();
    const changedAt = new Date().toISOString();
    run(
      `INSERT INTO stakeholder_history (id, stakeholder_id, field, old_value, new_value, changed_at, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, history.stakeholderId, history.field, history.oldValue, history.newValue, changedAt, history.notes || '']
    );
    return { id, ...history, changedAt };
  },
  getRecentChanges(limit: number = 20): (StakeholderHistory & { stakeholderName: string })[] {
    return query(
      `SELECT h.id, h.stakeholder_id as stakeholderId, h.field, h.old_value as oldValue, h.new_value as newValue,
              h.changed_at as changedAt, h.notes, s.name as stakeholderName
       FROM stakeholder_history h
       JOIN stakeholders s ON h.stakeholder_id = s.id
       ORDER BY h.changed_at DESC LIMIT ?`,
      [limit]
    );
  },
};

export const tagsRepo = {
  getAll(): Tag[] {
    return query<Tag>('SELECT * FROM tags ORDER BY name');
  },
  create(name: string, color: string = '#6366f1'): Tag {
    const id = generateId();
    run('INSERT INTO tags (id, name, color) VALUES (?, ?, ?)', [id, name, color]);
    return { id, name, color };
  },
  update(id: string, name: string, color: string): void {
    run('UPDATE tags SET name = ?, color = ? WHERE id = ?', [name, color, id]);
  },
  delete(id: string): void {
    run('DELETE FROM stakeholder_tags WHERE tag_id = ?', [id]);
    run('DELETE FROM tags WHERE id = ?', [id]);
  },
  getByStakeholder(stakeholderId: string): Tag[] {
    return query<Tag>(
      `SELECT t.* FROM tags t
       JOIN stakeholder_tags st ON t.id = st.tag_id
       WHERE st.stakeholder_id = ?`,
      [stakeholderId]
    );
  },
  addToStakeholder(stakeholderId: string, tagId: string): void {
    try {
      run('INSERT INTO stakeholder_tags (stakeholder_id, tag_id) VALUES (?, ?)', [stakeholderId, tagId]);
    } catch {
      // Already exists
    }
  },
  removeFromStakeholder(stakeholderId: string, tagId: string): void {
    run('DELETE FROM stakeholder_tags WHERE stakeholder_id = ? AND tag_id = ?', [stakeholderId, tagId]);
  },
};

export const relationshipsRepo = {
  getByStakeholder(stakeholderId: string): (Relationship & { fromName: string; toName: string })[] {
    return query(
      `SELECT r.id, r.from_stakeholder_id as fromStakeholderId, r.to_stakeholder_id as toStakeholderId,
              r.type, r.strength, r.notes, s1.name as fromName, s2.name as toName
       FROM relationships r
       JOIN stakeholders s1 ON r.from_stakeholder_id = s1.id
       JOIN stakeholders s2 ON r.to_stakeholder_id = s2.id
       WHERE r.from_stakeholder_id = ? OR r.to_stakeholder_id = ?`,
      [stakeholderId, stakeholderId]
    );
  },
  getAll(): (Relationship & { fromName: string; toName: string })[] {
    return query(
      `SELECT r.id, r.from_stakeholder_id as fromStakeholderId, r.to_stakeholder_id as toStakeholderId,
              r.type, r.strength, r.notes, s1.name as fromName, s2.name as toName
       FROM relationships r
       JOIN stakeholders s1 ON r.from_stakeholder_id = s1.id
       JOIN stakeholders s2 ON r.to_stakeholder_id = s2.id`
    );
  },
  create(rel: Omit<Relationship, 'id'>): Relationship {
    const id = generateId();
    run(
      `INSERT INTO relationships (id, from_stakeholder_id, to_stakeholder_id, type, strength, notes)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, rel.fromStakeholderId, rel.toStakeholderId, rel.type, rel.strength, rel.notes || '']
    );
    return { id, ...rel };
  },
  update(id: string, rel: Partial<Relationship>): void {
    const fields: string[] = [];
    const values: unknown[] = [];
    if (rel.type !== undefined) { fields.push('type = ?'); values.push(rel.type); }
    if (rel.strength !== undefined) { fields.push('strength = ?'); values.push(rel.strength); }
    if (rel.notes !== undefined) { fields.push('notes = ?'); values.push(rel.notes); }
    if (fields.length > 0) {
      values.push(id);
      run(`UPDATE relationships SET ${fields.join(', ')} WHERE id = ?`, values);
    }
  },
  delete(id: string): void {
    run('DELETE FROM relationships WHERE id = ?', [id]);
  },
};

export function executeRawQuery(sql: string, params: unknown[] = []): unknown[] {
  try { return query(sql, params); } catch (error) { console.error('SQL Error:', error); return []; }
}
