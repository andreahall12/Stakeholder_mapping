import { parseIntent } from './intentParser';
import { executeRawQuery, engagementLogsRepo, stakeholderHistoryRepo } from '@/db/database';

const OLLAMA_BASE_URL = 'http://localhost:11434';

// Built-in help responses for "how do I" questions
const HELP_RESPONSES: Record<string, string> = {
  'add stakeholder': `**How to Add a Stakeholder:**

1. Click the **"New"** button in the right sidebar
2. Fill in the stakeholder details:
   - **Name** (required)
   - **Job Title** (optional)
   - **Department** (optional)
   - **Email** and **Slack** (optional)
3. Set their **Influence Level**: High, Medium, or Low
4. Set their **Support Level**: Champion, Supporter, Neutral, or Resistant
5. Add any **Notes** about this person
6. Click **Save**

**Quick Tip:** You can also click **"AI Add"** and type naturally like "John Smith, VP of Engineering, high influence, champion"`,

  'create stakeholder': `**How to Add a Stakeholder:**

1. Click the **"New"** button in the right sidebar
2. Fill in the stakeholder details (name, title, department, contact info)
3. Set their **Influence Level** and **Support Level**
4. Click **Save**

**Quick Tip:** Use **"AI Add"** to type naturally: "Jane Doe, Product Manager, medium influence, supporter"`,

  'import csv': `**How to Import Stakeholders from CSV:**

1. Click the **Upload icon** (arrow pointing up) in the top header bar
2. Click **"Choose File"** and select your CSV file
3. Your CSV should have columns like: Name, Job Title, Department, Email
4. The tool will show a preview of the data
5. Click **Import** to add all stakeholders

**CSV Format Example:**
\`\`\`
Name,Job Title,Department,Email
John Smith,VP Engineering,Engineering,john@example.com
Jane Doe,Product Manager,Product,jane@example.com
\`\`\``,

  'import spreadsheet': `**How to Import from a Spreadsheet:**

1. In Excel or Google Sheets, save your file as **CSV** format
2. Click the **Upload icon** in the header
3. Select your CSV file
4. Review the preview and click **Import**

Your spreadsheet should have columns: Name, Job Title, Department, Email (at minimum)`,

  'export': `**How to Export Your Data:**

1. Click the **three-dot menu** (⋮) in the top-right header
2. Choose your export format:
   - **Export CSV** - Opens in Excel/Google Sheets (stakeholders, RACI, comm plans)
   - **Export JSON** - For backup or transferring to another system
   - **Export PDF Report** - Formatted stakeholder landscape document
   - **Export Database** - Complete backup of all your data

**Tip:** Use "Export Database" regularly to back up your work!`,

  'raci': `**How to Use the RACI Matrix:**

1. Click the **"RACI Matrix"** tab at the top
2. You'll see a grid with stakeholders as columns and workstreams as rows
3. Click on any cell to set a role:
   - **R** = Responsible (does the work)
   - **A** = Accountable (owns the outcome)
   - **C** = Consulted (provides input)
   - **I** = Informed (kept updated)
4. Click the role again to change or remove it

**Tip:** The Dashboard shows RACI gaps - workstreams missing R or A roles.`,

  'set raci': `**How to Assign RACI Roles:**

1. Go to the **RACI Matrix** tab
2. Find the stakeholder column and workstream row
3. Click the cell where they intersect
4. Select R, A, C, or I from the menu
5. The role is saved automatically

Each workstream should have at least one **R** (Responsible) and one **A** (Accountable).`,

  'communication plan': `**How to Set a Communication Plan:**

1. Click on a **stakeholder card** to open the edit dialog
2. Scroll down to the **Communication Plan** section
3. Select a **Channel**: Email, Slack, Meeting, Jira, or Briefing
4. Select a **Frequency**: Daily, Weekly, Biweekly, Monthly, Quarterly, or As-needed
5. Add any **Notes** about how to communicate with them
6. Click **Save**

The Dashboard will alert you when you're overdue based on this plan.`,

  'log engagement': `**How to Log an Engagement:**

1. Find the stakeholder card in the right sidebar
2. Click the **clipboard icon** on their card
3. Select the type: Meeting, Email, Call, Decision, or Note
4. Enter the **date** of the interaction
5. Write a brief **summary** of what happened
6. Set the **sentiment**: Positive, Neutral, or Negative
7. Click **Save**

This updates their "last contact" date and helps track your relationship history.`,

  'track meeting': `**How to Track a Meeting:**

1. Click the **clipboard icon** on the stakeholder's card
2. Select **"Meeting"** as the type
3. Enter the date and a summary
4. Set the sentiment (how did it go?)
5. Click **Save**`,

  'filter': `**How to Filter Stakeholders:**

1. Click the **"Filter"** button above the stakeholder list
2. Use the dropdowns to filter by:
   - **Influence Level**: High, Medium, Low
   - **Support Level**: Champion, Supporter, Neutral, Resistant
   - **Department**: Based on your stakeholders
   - **Tag**: Custom tags you've created
3. Filters apply immediately

**To Save a Filter:**
1. Apply your desired filters
2. Click **Filter** dropdown → **"Save Current Filter"**
3. Give it a name like "Engineering Blockers"
4. Access it anytime from the Filter dropdown`,

  'tag': `**How to Use Tags:**

1. Click the **Tag icon** in the header to manage tags
2. Create tags like "Executive Team", "Technical", "External"
3. Choose a color for each tag
4. To assign tags to a stakeholder, edit the stakeholder and select tags
5. Filter the list by tag using the Filter button`,

  'anonymous': `**How to Use Anonymous Mode:**

1. Click the **Eye icon** in the top header bar
2. All stakeholder names become "Stakeholder A", "Stakeholder B", etc.
3. This affects all views (Dashboard, Network, RACI, etc.)
4. Click the Eye icon again to reveal real names

**Use this for:** Presentations, screenshots, or discussing sensitive situations`,

  'presentation mode': `**How to Hide Names for Presentations:**

1. Click the **Eye icon** in the header
2. Names become "Stakeholder A", "Stakeholder B", etc.
3. Click again to show real names

This is perfect for discussing stakeholder dynamics without revealing identities.`,

  'scenario': `**How to Use Scenario Planning:**

1. Go to the **Dashboard** view
2. Click the **"Scenario Planning"** button
3. Select a stakeholder from the dropdown
4. Adjust their simulated **Influence** or **Support** level
5. See how the metrics change

**Note:** This is for planning only - it doesn't change your real data.`,

  'bulk': `**How to Perform Bulk Operations:**

1. Click the **"Bulk"** button in the sidebar
2. Check the boxes next to stakeholders you want to update
3. Choose an action:
   - **Update Field** - Change influence, support, or department for all
   - **Add Tag** - Apply a tag to all selected
   - **Delete** - Remove all selected (be careful!)
4. Click **Apply**`,

  'workstream': `**How to Create a Workstream:**

1. Look for the **"Workstreams"** count in the sidebar
2. Click the **folder icon** next to it
3. Click **"Add Workstream"**
4. Enter a name and optional description
5. Click **Save**

Workstreams appear as rows in the RACI Matrix.`,

  'views': `**How to Switch Between Views:**

Use the tabs at the top of the main area:

- **Dashboard** - Overview with KPIs, alerts, and quick actions
- **Network** - Visual graph showing stakeholder connections
- **Influence Matrix** - 2x2 grid (influence vs support)
- **Org Chart** - Hierarchical structure
- **RACI Matrix** - Responsibility assignments

**Keyboard Shortcut:** Press **Ctrl/Cmd + 1-5** to switch views quickly`,

  'keyboard': `**Keyboard Shortcuts:**

| Shortcut | Action |
|----------|--------|
| Cmd/Ctrl + / | Show this help |
| Cmd/Ctrl + N | New stakeholder |
| Cmd/Ctrl + F | Focus search |
| Escape | Close dialogs |

Press **Cmd/Ctrl + /** anytime to see the shortcuts panel.`,

  'search': `**How to Search for Stakeholders:**

1. Click in the **search box** at the top of the sidebar
2. Type any part of a stakeholder's name
3. The list filters instantly as you type
4. Clear the search box to see all stakeholders again

**Tip:** Press **Cmd/Ctrl + F** to quickly focus the search box.`,

  'delete': `**How to Delete a Stakeholder:**

1. Click on the stakeholder card to open the edit dialog
2. Scroll to the bottom
3. Click the **"Delete"** button (usually red)
4. Confirm the deletion

**Warning:** This cannot be undone. Export a backup first if unsure.`,

  'meeting brief': `**How to Generate a Meeting Brief:**

1. Open the **AI Chat** (chat bubble icon)
2. Type: **"Prepare brief for [Name]"**
   - Example: "Prepare brief for John Smith"
3. The AI generates a summary including:
   - Their profile and role
   - RACI assignments
   - Recent interactions
   - Suggested talking points

**Note:** Requires Ollama running for AI-powered briefs.`,
};

// Detect if a query is asking for help
function detectHelpIntent(query: string): string | null {
  const lowerQuery = query.toLowerCase().trim();
  
  // Check for "how do I", "how to", "how can I", etc.
  if (!lowerQuery.match(/^(how (do|can|should|would) i|how to|where (do|can) i|what('s| is) the (way|best way) to|help( me)? with|show me how|tell me how|explain how)/)) {
    return null;
  }
  
  // Match against help topics
  const topicMatches: [RegExp, string][] = [
    [/add(ing)?\s+(a\s+)?stakeholder/i, 'add stakeholder'],
    [/create\s+(a\s+)?stakeholder/i, 'create stakeholder'],
    [/new\s+stakeholder/i, 'add stakeholder'],
    [/import.*(csv|spreadsheet|excel)/i, 'import csv'],
    [/csv\s+import/i, 'import csv'],
    [/upload.*(csv|stakeholder|data)/i, 'import csv'],
    [/export/i, 'export'],
    [/download.*(data|backup|csv)/i, 'export'],
    [/backup/i, 'export'],
    [/raci\s*(matrix|role|assign)/i, 'raci'],
    [/set\s+(a\s+)?raci/i, 'set raci'],
    [/(assign|add)\s+raci/i, 'set raci'],
    [/responsible|accountable|consulted|informed/i, 'raci'],
    [/communication\s*(plan|schedule)/i, 'communication plan'],
    [/set\s+(up\s+)?(a\s+)?comm/i, 'communication plan'],
    [/contact\s+frequency/i, 'communication plan'],
    [/log\s+(an?\s+)?(engagement|interaction|meeting|call|email)/i, 'log engagement'],
    [/record\s+(an?\s+)?(meeting|call|interaction)/i, 'log engagement'],
    [/track\s+(an?\s+)?meeting/i, 'track meeting'],
    [/filter/i, 'filter'],
    [/search/i, 'search'],
    [/find\s+stakeholder/i, 'search'],
    [/tag/i, 'tag'],
    [/label/i, 'tag'],
    [/categorize/i, 'tag'],
    [/anonymous/i, 'anonymous'],
    [/hide\s+(name|identit)/i, 'anonymous'],
    [/presentation\s+mode/i, 'presentation mode'],
    [/scenario/i, 'scenario'],
    [/what.if/i, 'scenario'],
    [/bulk/i, 'bulk'],
    [/multiple\s+stakeholder/i, 'bulk'],
    [/mass\s+(update|edit|delete)/i, 'bulk'],
    [/workstream/i, 'workstream'],
    [/(switch|change|use)\s+(the\s+)?view/i, 'views'],
    [/different\s+view/i, 'views'],
    [/keyboard/i, 'keyboard'],
    [/shortcut/i, 'keyboard'],
    [/delete\s+(a\s+)?stakeholder/i, 'delete'],
    [/remove\s+(a\s+)?stakeholder/i, 'delete'],
    [/meeting\s+brief/i, 'meeting brief'],
    [/prepare\s+for\s+(a\s+)?meeting/i, 'meeting brief'],
  ];
  
  for (const [regex, topic] of topicMatches) {
    if (regex.test(lowerQuery)) {
      return topic;
    }
  }
  
  return null;
}

// Get help response for a topic
function getHelpResponse(topic: string): string {
  return HELP_RESPONSES[topic] || `I'm not sure how to help with that specific topic. Try asking:
- "How do I add a stakeholder?"
- "How do I use the RACI matrix?"
- "How do I export my data?"
- "How do I filter stakeholders?"
- "How do I log an engagement?"

Or ask about your stakeholder data, like "Who is responsible for design?"`;
}

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
  // Check for help/how-to questions first (no AI needed)
  const helpTopic = detectHelpIntent(userQuery);
  if (helpTopic) {
    return {
      content: getHelpResponse(helpTopic),
    };
  }
  
  // Check for special commands
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
      sqlResults = executeRawQuery(intent.sqlQuery, intent.sqlParams);
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
  // Find the stakeholder using parameterized query
  const stakeholderQuery = `
    SELECT s.*, ps.id as project_stakeholder_id
    FROM stakeholders s
    JOIN project_stakeholders ps ON s.id = ps.stakeholder_id
    WHERE LOWER(s.name) LIKE ?
    LIMIT 1
  `;
  const stakeholders = executeRawQuery(stakeholderQuery, [`%${targetName.toLowerCase()}%`]) as any[];
  
  if (stakeholders.length === 0) {
    return { content: `Could not find a stakeholder matching "${targetName}". Please check the name and try again.` };
  }
  
  const stakeholder = stakeholders[0];
  
  // Get their RACI roles using parameterized query
  const raciQuery = `
    SELECT w.name as workstream, r.role
    FROM raci_assignments r
    JOIN workstreams w ON r.workstream_id = w.id
    WHERE r.project_stakeholder_id = ?
  `;
  const raciRoles = executeRawQuery(raciQuery, [stakeholder.project_stakeholder_id]);
  
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
  // Try to find stakeholders matching the target using parameterized query
  const searchPattern = `%${target.toLowerCase()}%`;
  const stakeholderQuery = `
    SELECT s.name, s.job_title, s.email, s.influence_level, s.support_level
    FROM stakeholders s
    JOIN project_stakeholders ps ON s.id = ps.stakeholder_id
    WHERE LOWER(s.name) LIKE ?
       OR LOWER(s.department) LIKE ?
       OR LOWER(s.support_level) LIKE ?
    LIMIT 10
  `;
  const recipients = executeRawQuery(stakeholderQuery, [searchPattern, searchPattern, searchPattern]) as any[];
  
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
  // Use parameterized query for consistency and security
  const blockerQuery = `
    SELECT s.name, s.job_title, s.department, s.influence_level, s.support_level, s.notes
    FROM stakeholders s
    JOIN project_stakeholders ps ON s.id = ps.stakeholder_id
    WHERE s.influence_level = ? AND s.support_level IN (?, ?)
  `;
  const blockers = executeRawQuery(blockerQuery, ['high', 'resistant', 'neutral']) as any[];
  
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
  // Query uses no user input but uses parameterized style for consistency
  const overdueQuery = `
    SELECT s.name, s.job_title, s.influence_level, c.frequency, c.last_contact_date
    FROM stakeholders s
    JOIN project_stakeholders ps ON s.id = ps.stakeholder_id
    LEFT JOIN comm_plans c ON ps.id = c.project_stakeholder_id
    WHERE c.last_contact_date IS NOT NULL OR c.id IS NOT NULL
  `;
  const stakeholdersWithPlans = executeRawQuery(overdueQuery, []) as any[];
  
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
