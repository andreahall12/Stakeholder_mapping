import { parseIntent } from './intentParser';
import { executeRawQuery, engagementLogsRepo, stakeholderHistoryRepo } from '@/db/database';

const OLLAMA_BASE_URL = 'http://localhost:11434';

interface OllamaResponse {
  model: string;
  response: string;
  done: boolean;
}

export interface ChatResponse {
  content: string;
  sqlResults?: unknown[];
  error?: string;
}

async function queryOllama(prompt: string, model: string = 'llama3.2'): Promise<string> {
  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        prompt,
        stream: false,
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status}`);
    }

    const data: OllamaResponse = await response.json();
    return data.response;
  } catch (error) {
    console.error('Ollama error:', error);
    throw error;
  }
}

export async function checkOllamaConnection(): Promise<boolean> {
  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/tags`);
    return response.ok;
  } catch {
    return false;
  }
}

export async function getAvailableModels(): Promise<string[]> {
  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/tags`);
    if (!response.ok) return [];
    const data = await response.json();
    return data.models?.map((m: { name: string }) => m.name) || [];
  } catch {
    return [];
  }
}

// Check for special commands
function detectSpecialCommand(query: string): { type: 'meeting_brief' | 'draft_email' | 'analyze_blockers' | 'neglected' | null; target?: string } {
  const lowerQuery = query.toLowerCase();
  
  // Meeting brief request
  const briefMatch = query.match(/(?:prepare|generate|create|give me)(?:\s+a)?\s+(?:meeting\s+)?brief(?:\s+for)?\s+(.+?)(?:\?|$)/i);
  if (briefMatch) {
    return { type: 'meeting_brief', target: briefMatch[1].trim() };
  }
  
  // Draft email request
  const emailMatch = query.match(/draft(?:\s+an?)?\s+(?:email|update|message)(?:\s+for|\s+to)?\s+(.+?)(?:\?|$)/i);
  if (emailMatch) {
    return { type: 'draft_email', target: emailMatch[1].trim() };
  }
  
  // Analyze blockers
  if (lowerQuery.includes('blocker') || lowerQuery.includes('at risk') || lowerQuery.includes('concerns')) {
    return { type: 'analyze_blockers' };
  }
  
  // Neglected stakeholders
  if (lowerQuery.includes('neglect') || lowerQuery.includes('overdue') || lowerQuery.includes('haven\'t contacted')) {
    return { type: 'neglected' };
  }
  
  return { type: null };
}

export async function processQuery(
  userQuery: string,
  projectContext: {
    projectName: string;
    stakeholderCount: number;
    workstreamCount: number;
    projectId?: string;
  },
  model: string = 'llama3.2'
): Promise<ChatResponse> {
  // Check for special commands first
  const command = detectSpecialCommand(userQuery);
  
  if (command.type === 'meeting_brief' && command.target) {
    return await generateMeetingBrief(command.target, projectContext, model);
  }
  
  if (command.type === 'draft_email' && command.target) {
    return await generateDraftEmail(command.target, projectContext, model);
  }
  
  if (command.type === 'analyze_blockers') {
    return await analyzeBlockers(projectContext, model);
  }
  
  if (command.type === 'neglected') {
    return await findNeglectedStakeholders(projectContext, model);
  }
  
  // Standard query processing
  const intent = parseIntent(userQuery);
  
  let sqlResults: unknown[] = [];
  let contextData = '';
  
  if (intent.sqlQuery) {
    try {
      sqlResults = executeRawQuery(intent.sqlQuery);
      contextData = `\nQuery results from database:\n${JSON.stringify(sqlResults, null, 2)}`;
    } catch (error) {
      console.error('SQL execution error:', error);
    }
  }
  
  const systemPrompt = `You are an AI assistant helping a program manager understand their stakeholder data for the project "${projectContext.projectName}".

The project has ${projectContext.stakeholderCount} stakeholders and ${projectContext.workstreamCount} workstreams.

RACI roles mean:
- R (Responsible): Does the work
- A (Accountable): Ultimately answerable for the work
- C (Consulted): Provides input before/during work
- I (Informed): Kept updated on progress

Communication frequencies: daily, weekly, biweekly, monthly, quarterly, as-needed
Communication channels: email, slack, jira, briefing, meeting

Support levels: champion (active advocate), supporter (positive), neutral, resistant (has concerns)
Influence levels: high (key decision maker), medium, low

Special capabilities you can help with:
- "Prepare brief for [name]" - Generate a meeting prep sheet
- "Draft email for [stakeholder/group]" - Create a communication draft
- "Who have I neglected?" - Find overdue contacts
- "Who are the blockers?" - Identify high-influence resistors

Be concise and helpful. Format your responses clearly. Use **bold** for names and important terms.`;

  const userPrompt = `User question: ${userQuery}
${contextData}

Please provide a helpful response based on the question and any data provided.`;

  try {
    const llmResponse = await queryOllama(
      `${systemPrompt}\n\n${userPrompt}`,
      model
    );
    
    return {
      content: llmResponse,
      sqlResults: sqlResults.length > 0 ? sqlResults : undefined,
    };
  } catch (error) {
    if (sqlResults.length > 0) {
      return {
        content: formatFallbackResponse(intent.type, sqlResults),
        sqlResults,
        error: 'Ollama not available - showing raw results',
      };
    }
    
    return {
      content: "I couldn't connect to the AI service (Ollama). Please make sure Ollama is running locally on port 11434.",
      error: 'Ollama connection failed',
    };
  }
}

async function generateMeetingBrief(
  targetName: string,
  projectContext: { projectName: string; projectId?: string },
  model: string
): Promise<ChatResponse> {
  // Find the stakeholder
  const stakeholderQuery = `
    SELECT s.*, ps.id as project_stakeholder_id
    FROM stakeholders s
    JOIN project_stakeholders ps ON s.id = ps.stakeholder_id
    WHERE LOWER(s.name) LIKE '%${targetName.toLowerCase()}%'
    LIMIT 1
  `;
  const stakeholders = executeRawQuery(stakeholderQuery) as any[];
  
  if (stakeholders.length === 0) {
    return { content: `Could not find a stakeholder matching "${targetName}". Please check the name and try again.` };
  }
  
  const stakeholder = stakeholders[0];
  
  // Get their RACI roles
  const raciQuery = `
    SELECT w.name as workstream, r.role
    FROM raci_assignments r
    JOIN workstreams w ON r.workstream_id = w.id
    WHERE r.project_stakeholder_id = '${stakeholder.project_stakeholder_id}'
  `;
  const raciRoles = executeRawQuery(raciQuery);
  
  // Get recent engagement logs
  const recentLogs = engagementLogsRepo.getByProjectStakeholder(stakeholder.project_stakeholder_id).slice(0, 5);
  
  // Get support history
  const history = stakeholderHistoryRepo.getByStakeholder(stakeholder.id).slice(0, 3);
  
  const briefPrompt = `Generate a concise meeting preparation brief for meeting with ${stakeholder.name}.

STAKEHOLDER PROFILE:
- Name: ${stakeholder.name}
- Title: ${stakeholder.job_title || 'Not specified'}
- Department: ${stakeholder.department || 'Not specified'}
- Influence Level: ${stakeholder.influence_level}
- Support Level: ${stakeholder.support_level}
- Notes: ${stakeholder.notes || 'None'}

RACI ROLES:
${raciRoles.length > 0 ? JSON.stringify(raciRoles) : 'No RACI assignments'}

RECENT INTERACTIONS:
${recentLogs.length > 0 ? recentLogs.map(l => `- ${l.date}: ${l.type} (${l.sentiment}) - ${l.summary}`).join('\n') : 'No recent interactions recorded'}

RECENT CHANGES:
${history.length > 0 ? history.map(h => `- ${h.field}: ${h.oldValue} → ${h.newValue}`).join('\n') : 'No recent changes'}

Please create a brief with:
1. Key talking points based on their role and influence
2. Relationship status summary
3. Suggested meeting goals based on their current support level
4. Any risks or opportunities to address

Keep it concise and actionable.`;

  try {
    const response = await queryOllama(briefPrompt, model);
    return {
      content: `## Meeting Brief: ${stakeholder.name}\n\n${response}`,
    };
  } catch {
    // Fallback without AI
    let brief = `## Meeting Brief: ${stakeholder.name}\n\n`;
    brief += `**Profile:** ${stakeholder.job_title || 'No title'} - ${stakeholder.department || 'No dept'}\n`;
    brief += `**Influence:** ${stakeholder.influence_level} | **Support:** ${stakeholder.support_level}\n\n`;
    
    if (raciRoles.length > 0) {
      brief += `**RACI Roles:**\n`;
      (raciRoles as any[]).forEach(r => {
        brief += `• ${r.role} for ${r.workstream}\n`;
      });
    }
    
    if (recentLogs.length > 0) {
      brief += `\n**Recent Interactions:**\n`;
      recentLogs.forEach(l => {
        brief += `• ${l.date}: ${l.type} - ${l.summary}\n`;
      });
    }
    
    return { content: brief, error: 'AI unavailable - showing basic brief' };
  }
}

async function generateDraftEmail(
  target: string,
  projectContext: { projectName: string },
  model: string
): Promise<ChatResponse> {
  // Try to find stakeholders matching the target
  const stakeholderQuery = `
    SELECT s.name, s.job_title, s.email, s.influence_level, s.support_level
    FROM stakeholders s
    JOIN project_stakeholders ps ON s.id = ps.stakeholder_id
    WHERE LOWER(s.name) LIKE '%${target.toLowerCase()}%'
       OR LOWER(s.department) LIKE '%${target.toLowerCase()}%'
       OR LOWER(s.support_level) LIKE '%${target.toLowerCase()}%'
    LIMIT 10
  `;
  const recipients = executeRawQuery(stakeholderQuery) as any[];
  
  if (recipients.length === 0) {
    return { content: `Could not find stakeholders matching "${target}". Try a name, department, or support level like "champions".` };
  }
  
  const emailPrompt = `Draft a professional project update email for the following stakeholder(s):

RECIPIENTS:
${recipients.map(r => `- ${r.name} (${r.job_title || 'Unknown role'}) - ${r.support_level} support, ${r.influence_level} influence`).join('\n')}

PROJECT: ${projectContext.projectName}

Please draft a concise, professional email that:
1. Is appropriate for their support/influence level
2. Provides a brief status update
3. Highlights any relevant next steps or asks
4. Uses a professional but friendly tone

Provide the email with Subject line and body.`;

  try {
    const response = await queryOllama(emailPrompt, model);
    return {
      content: `## Draft Email for ${target}\n\n${response}`,
    };
  } catch {
    return {
      content: `Found ${recipients.length} recipient(s) for "${target}", but could not generate draft. AI service unavailable.`,
      error: 'Ollama connection failed',
    };
  }
}

async function analyzeBlockers(
  projectContext: { projectName: string },
  model: string
): Promise<ChatResponse> {
  const blockerQuery = `
    SELECT s.name, s.job_title, s.department, s.influence_level, s.support_level, s.notes
    FROM stakeholders s
    JOIN project_stakeholders ps ON s.id = ps.stakeholder_id
    WHERE s.influence_level = 'high' AND s.support_level IN ('resistant', 'neutral')
  `;
  const blockers = executeRawQuery(blockerQuery) as any[];
  
  if (blockers.length === 0) {
    return { content: '✅ **Good news!** No high-influence blockers found. All key stakeholders are either supportive or champions.' };
  }
  
  const analysisPrompt = `Analyze these potential blockers and provide engagement strategies:

BLOCKERS (High influence, resistant/neutral):
${blockers.map(b => `- ${b.name} (${b.job_title || 'Unknown'}) - ${b.support_level}, Notes: ${b.notes || 'None'}`).join('\n')}

PROJECT: ${projectContext.projectName}

For each blocker, provide:
1. Risk level (Critical/High/Medium)
2. Likely concerns based on their role
3. Recommended engagement strategy
4. Key stakeholders who might help influence them

Be concise and actionable.`;

  try {
    const response = await queryOllama(analysisPrompt, model);
    return {
      content: `## Blocker Analysis\n\n${response}`,
      sqlResults: blockers,
    };
  } catch {
    let content = `## Blockers Identified (${blockers.length})\n\n`;
    blockers.forEach(b => {
      content += `**${b.name}** - ${b.job_title || 'Unknown role'}\n`;
      content += `• Influence: ${b.influence_level} | Support: ${b.support_level}\n`;
      if (b.notes) content += `• Notes: ${b.notes}\n`;
      content += '\n';
    });
    return { content, sqlResults: blockers, error: 'AI unavailable - showing raw blocker list' };
  }
}

async function findNeglectedStakeholders(
  projectContext: { projectName: string },
  model: string
): Promise<ChatResponse> {
  const overdueQuery = `
    SELECT s.name, s.job_title, s.influence_level, c.frequency, c.last_contact_date
    FROM stakeholders s
    JOIN project_stakeholders ps ON s.id = ps.stakeholder_id
    LEFT JOIN comm_plans c ON ps.id = c.project_stakeholder_id
    WHERE c.last_contact_date IS NOT NULL OR c.id IS NOT NULL
  `;
  const stakeholdersWithPlans = executeRawQuery(overdueQuery) as any[];
  
  const today = new Date();
  const neglected = stakeholdersWithPlans.filter(s => {
    if (!s.last_contact_date) return true; // Never contacted
    const lastContact = new Date(s.last_contact_date);
    const daysSince = Math.floor((today.getTime() - lastContact.getTime()) / (1000 * 60 * 60 * 24));
    
    const expectedDays: Record<string, number> = {
      daily: 1, weekly: 7, biweekly: 14, monthly: 30, quarterly: 90, 'as-needed': 30
    };
    return daysSince > (expectedDays[s.frequency] || 30);
  });
  
  if (neglected.length === 0) {
    return { content: '✅ **All caught up!** No stakeholders are overdue for communication based on their plans.' };
  }
  
  let content = `## Stakeholders Needing Attention (${neglected.length})\n\n`;
  neglected.forEach(s => {
    const daysSince = s.last_contact_date 
      ? Math.floor((today.getTime() - new Date(s.last_contact_date).getTime()) / (1000 * 60 * 60 * 24))
      : null;
    content += `**${s.name}** (${s.influence_level} influence)\n`;
    content += `• Expected: ${s.frequency} | Last contact: ${daysSince !== null ? `${daysSince} days ago` : 'Never'}\n\n`;
  });
  
  return { content, sqlResults: neglected };
}

function formatFallbackResponse(queryType: string, results: unknown[]): string {
  if (results.length === 0) {
    return 'No matching stakeholders found for your query.';
  }
  
  const items = results as Record<string, unknown>[];
  
  switch (queryType) {
    case 'raci':
      return `Found ${items.length} stakeholder(s):\n\n` +
        items.map((r) => `• **${r.name}** (${r.job_title}) - ${r.role} for ${r.workstream}`).join('\n');
    
    case 'communication':
      return `Stakeholders with this communication plan:\n\n` +
        items.map((r) => `• **${r.name}** - ${r.channel} ${r.frequency}`).join('\n');
    
    case 'influence':
      return `Found ${items.length} stakeholder(s):\n\n` +
        items.map((r) => `• **${r.name}** (${r.job_title}) - ${r.influence_level} influence, ${r.support_level}`).join('\n');
    
    case 'department':
      return `Stakeholders in department:\n\n` +
        items.map((r) => `• **${r.name}** - ${r.job_title}`).join('\n');
    
    default:
      return `Found ${items.length} result(s):\n\n` +
        items.map((r) => `• ${JSON.stringify(r)}`).join('\n');
  }
}
