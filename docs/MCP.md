# MCP Server Documentation

The stakeholder tool includes a Model Context Protocol (MCP) server that exposes stakeholder data as tools for AI agents.

## Running the MCP Server

```bash
go run ./cmd/mcp
```

The MCP server uses stdio transport (stdin/stdout) for communication with AI agents.

## Available Tools

### stakeholder_search
Search for stakeholders by name, department, influence, or support level.

**Parameters:**
- `query` (string) — Search term
- `influence_level` (string, optional) — Filter: high, medium, low
- `support_level` (string, optional) — Filter: champion, supporter, neutral, resistant

### stakeholder_get
Get detailed information about a specific stakeholder.

**Parameters:**
- `id` (string) — Stakeholder UUID

### project_summary
Get a project overview with KPI metrics.

**Parameters:**
- `project_id` (string) — Project UUID

### raci_matrix
Get RACI assignments for a project.

**Parameters:**
- `project_id` (string) — Project UUID

### engagement_log
Log an interaction with a stakeholder.

**Parameters:**
- `project_stakeholder_id` (string) — Project-stakeholder assignment UUID
- `type` (string) — meeting, email, call, decision, note
- `summary` (string) — Description of the interaction
- `sentiment` (string) — positive, neutral, negative

### export_ontology
Export stakeholder data in RDF/Turtle format aligned with compliance-ontology.

**Parameters:**
- `project_id` (string, optional) — Export a specific project (or all if omitted)

## Integration with AI Agents

### Cursor / Claude

Add to your MCP configuration:

```json
{
  "mcpServers": {
    "stakeholder-tool": {
      "command": "go",
      "args": ["run", "./cmd/mcp"],
      "cwd": "/path/to/stakeholder-tool"
    }
  }
}
```

### Example Prompts

- "Search for high-influence stakeholders in the Engineering department"
- "Get the RACI matrix for project X"
- "Log a meeting with Jane Smith — discussed timeline concerns, sentiment was neutral"
- "Export the stakeholder data as RDF for compliance review"
