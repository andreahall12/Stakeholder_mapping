import type { QueryIntent } from '@/types';

interface ParsedIntent {
  type: QueryIntent['type'];
  filters: Record<string, string>;
  sqlQuery: string | null;
  sqlParams: unknown[];
  needsLLM: boolean;
}

// Pattern matchers for common queries
const patterns = {
  // RACI queries
  responsible: /who(?:'s| is) responsible (?:for )?(.+?)(?:\?|$)/i,
  accountable: /who(?:'s| is) accountable (?:for )?(.+?)(?:\?|$)/i,
  consulted: /who (?:should be |is )consulted (?:for |on )?(.+?)(?:\?|$)/i,
  informed: /who (?:should be |is |needs to be )informed (?:about |for )?(.+?)(?:\?|$)/i,
  
  // Communication queries
  emailWeekly: /(?:who|list|show)(?: all)? stakeholders (?:I |we )?(?:need to )?email weekly/i,
  emailMonthly: /(?:who|list|show)(?: all)? stakeholders (?:I |we )?(?:need to )?email monthly/i,
  commFrequency: /(?:who|list|show)(?: all)? stakeholders (?:with |I |we )(?:need to )?(?:communicate |contact |email |update )?(daily|weekly|biweekly|monthly|quarterly)/i,
  
  // Influence/support queries
  highInfluence: /(?:who are |list |show )(?:the )?(?:high[ -]?influence|key|important) stakeholders/i,
  champions: /(?:who are |list |show )(?:the )?champions/i,
  resistors: /(?:who are |list |show )(?:the )?(?:resistant|resistors|blockers)/i,
  
  // Department queries
  department: /(?:who is |list |show |stakeholders )(?:in |from )(?:the )?(.+?) (?:department|team)/i,
  
  // General stakeholder queries
  listAll: /(?:list|show)(?: all)? stakeholders/i,
};

export function parseIntent(query: string): ParsedIntent {
  // Check for RACI queries
  let match = query.match(patterns.responsible);
  if (match) {
    const workstream = match[1].trim();
    const { sql, params } = buildRACIQuery('R', workstream);
    return {
      type: 'raci',
      filters: { role: 'R', workstream },
      sqlQuery: sql,
      sqlParams: params,
      needsLLM: true,
    };
  }
  
  match = query.match(patterns.accountable);
  if (match) {
    const workstream = match[1].trim();
    const { sql, params } = buildRACIQuery('A', workstream);
    return {
      type: 'raci',
      filters: { role: 'A', workstream },
      sqlQuery: sql,
      sqlParams: params,
      needsLLM: true,
    };
  }
  
  match = query.match(patterns.consulted);
  if (match) {
    const workstream = match[1].trim();
    const { sql, params } = buildRACIQuery('C', workstream);
    return {
      type: 'raci',
      filters: { role: 'C', workstream },
      sqlQuery: sql,
      sqlParams: params,
      needsLLM: true,
    };
  }
  
  match = query.match(patterns.informed);
  if (match) {
    const workstream = match[1].trim();
    const { sql, params } = buildRACIQuery('I', workstream);
    return {
      type: 'raci',
      filters: { role: 'I', workstream },
      sqlQuery: sql,
      sqlParams: params,
      needsLLM: true,
    };
  }
  
  // Check for communication queries
  if (patterns.emailWeekly.test(query)) {
    const { sql, params } = buildCommQuery('weekly');
    return {
      type: 'communication',
      filters: { frequency: 'weekly' },
      sqlQuery: sql,
      sqlParams: params,
      needsLLM: true,
    };
  }
  
  if (patterns.emailMonthly.test(query)) {
    const { sql, params } = buildCommQuery('monthly');
    return {
      type: 'communication',
      filters: { frequency: 'monthly' },
      sqlQuery: sql,
      sqlParams: params,
      needsLLM: true,
    };
  }
  
  match = query.match(patterns.commFrequency);
  if (match) {
    const frequency = match[1].toLowerCase();
    const { sql, params } = buildCommQuery(frequency);
    return {
      type: 'communication',
      filters: { frequency },
      sqlQuery: sql,
      sqlParams: params,
      needsLLM: true,
    };
  }
  
  // Check for influence/support queries
  if (patterns.highInfluence.test(query)) {
    return {
      type: 'influence',
      filters: { influenceLevel: 'high' },
      sqlQuery: `SELECT s.name, s.job_title, s.department, s.influence_level, s.support_level
                 FROM stakeholders s
                 JOIN project_stakeholders ps ON s.id = ps.stakeholder_id
                 WHERE s.influence_level = ?`,
      sqlParams: ['high'],
      needsLLM: true,
    };
  }
  
  if (patterns.champions.test(query)) {
    return {
      type: 'influence',
      filters: { supportLevel: 'champion' },
      sqlQuery: `SELECT s.name, s.job_title, s.department, s.influence_level, s.support_level
                 FROM stakeholders s
                 JOIN project_stakeholders ps ON s.id = ps.stakeholder_id
                 WHERE s.support_level = ?`,
      sqlParams: ['champion'],
      needsLLM: true,
    };
  }
  
  if (patterns.resistors.test(query)) {
    return {
      type: 'influence',
      filters: { supportLevel: 'resistant' },
      sqlQuery: `SELECT s.name, s.job_title, s.department, s.influence_level, s.support_level
                 FROM stakeholders s
                 JOIN project_stakeholders ps ON s.id = ps.stakeholder_id
                 WHERE s.support_level = ?`,
      sqlParams: ['resistant'],
      needsLLM: true,
    };
  }
  
  // Check for department queries
  match = query.match(patterns.department);
  if (match) {
    const department = match[1].trim();
    return {
      type: 'department',
      filters: { department },
      sqlQuery: `SELECT s.name, s.job_title, s.department
                 FROM stakeholders s
                 JOIN project_stakeholders ps ON s.id = ps.stakeholder_id
                 WHERE LOWER(s.department) LIKE ?`,
      sqlParams: [`%${department.toLowerCase()}%`],
      needsLLM: true,
    };
  }
  
  // Check for list all stakeholders
  if (patterns.listAll.test(query)) {
    return {
      type: 'general',
      filters: {},
      sqlQuery: `SELECT s.name, s.job_title, s.department, s.influence_level, s.support_level
                 FROM stakeholders s
                 JOIN project_stakeholders ps ON s.id = ps.stakeholder_id`,
      sqlParams: [],
      needsLLM: true,
    };
  }
  
  // Default: let the LLM handle it
  return {
    type: 'general',
    filters: {},
    sqlQuery: null,
    sqlParams: [],
    needsLLM: true,
  };
}

function buildRACIQuery(role: string, workstream: string): { sql: string; params: unknown[] } {
  return {
    sql: `
      SELECT s.name, s.job_title, s.department, w.name as workstream, r.role
      FROM stakeholders s
      JOIN project_stakeholders ps ON s.id = ps.stakeholder_id
      JOIN raci_assignments r ON ps.id = r.project_stakeholder_id
      JOIN workstreams w ON r.workstream_id = w.id
      WHERE r.role = ?
      AND LOWER(w.name) LIKE ?
    `,
    params: [role, `%${workstream.toLowerCase()}%`],
  };
}

function buildCommQuery(frequency: string): { sql: string; params: unknown[] } {
  return {
    sql: `
      SELECT s.name, s.job_title, s.email, c.channel, c.frequency
      FROM stakeholders s
      JOIN project_stakeholders ps ON s.id = ps.stakeholder_id
      JOIN comm_plans c ON ps.id = c.project_stakeholder_id
      WHERE c.frequency = ?
    `,
    params: [frequency],
  };
}

