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
    notes TEXT DEFAULT ''
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
  } else {
    db = new SQL.Database();
    db.run(SCHEMA);
    saveDatabase();
  }

  return db;
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
    return query(`SELECT c.*, s.name as stakeholderName, s.id as stakeholderId
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
};

export function executeRawQuery(sql: string): unknown[] {
  try { return query(sql); } catch (error) { console.error('SQL Error:', error); return []; }
}
