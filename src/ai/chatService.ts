import { parseIntent } from './intentParser';
import { executeRawQuery } from '@/db/database';

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

export async function processQuery(
  userQuery: string,
  projectContext: {
    projectName: string;
    stakeholderCount: number;
    workstreamCount: number;
  },
  model: string = 'llama3.2'
): Promise<ChatResponse> {
  // Step 1: Parse intent and check for deterministic query
  const intent = parseIntent(userQuery);
  
  let sqlResults: unknown[] = [];
  let contextData = '';
  
  // Step 2: Execute SQL if we have a deterministic query
  if (intent.sqlQuery) {
    try {
      sqlResults = executeRawQuery(intent.sqlQuery);
      contextData = `\nQuery results from database:\n${JSON.stringify(sqlResults, null, 2)}`;
    } catch (error) {
      console.error('SQL execution error:', error);
    }
  }
  
  // Step 3: Build prompt for LLM
  const systemPrompt = `You are an AI assistant helping a program manager understand their stakeholder data for the project "${projectContext.projectName}".

The project has ${projectContext.stakeholderCount} stakeholders and ${projectContext.workstreamCount} workstreams.

RACI roles mean:
- R (Responsible): Does the work
- A (Accountable): Ultimately answerable for the work
- C (Consulted): Provides input before/during work
- I (Informed): Kept updated on progress

Communication frequencies: daily, weekly, biweekly, monthly, quarterly, as-needed
Communication channels: email, slack, jira, briefing, meeting

Be concise and helpful. Format your responses clearly. If you have data from the database, summarize it naturally.`;

  const userPrompt = `User question: ${userQuery}
${contextData}

Please provide a helpful response based on the question and any data provided.`;

  // Step 4: Query Ollama for synthesis
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
    // Fallback: if Ollama is not available, format results ourselves
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

