# REST API Documentation

All endpoints are under `/api/v1/`. Responses are JSON.

If `STAKEHOLDER_API_KEY` is set, include either:
- `X-API-Key: <key>` header, or
- `Authorization: Bearer <key>` header

## Projects

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/projects` | List all projects with counts |
| POST | `/api/v1/projects` | Create project |
| GET | `/api/v1/projects/{id}` | Get project by ID |
| PUT | `/api/v1/projects/{id}` | Update project |
| DELETE | `/api/v1/projects/{id}` | Delete project |
| GET | `/api/v1/projects/{id}/kpis` | Get dashboard KPIs |
| POST | `/api/v1/projects/{id}/stakeholders` | Assign stakeholder to project |

### Create Project
```json
POST /api/v1/projects
{
  "name": "Cloud Migration",
  "description": "Migrate to AWS",
  "status": "active"
}
```

## Stakeholders

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/stakeholders` | List stakeholders (supports filters) |
| POST | `/api/v1/stakeholders` | Create stakeholder |
| GET | `/api/v1/stakeholders/{id}` | Get stakeholder by ID |
| PUT | `/api/v1/stakeholders/{id}` | Update stakeholder |
| DELETE | `/api/v1/stakeholders/{id}` | Delete stakeholder |
| POST | `/api/v1/stakeholders/bulk` | Bulk update a field |

### Query Parameters (GET /stakeholders)
- `search` — Search name, title, department
- `influence_level` — Filter: high, medium, low
- `support_level` — Filter: champion, supporter, neutral, resistant
- `department` — Filter by department

### Bulk Update
```json
POST /api/v1/stakeholders/bulk
{
  "ids": ["uuid-1", "uuid-2"],
  "field": "department",
  "value": "Engineering"
}
```

## Workstreams

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/projects/{id}/workstreams` | List project workstreams |
| POST | `/api/v1/projects/{id}/workstreams` | Create workstream |
| PUT | `/api/v1/workstreams/{id}` | Update workstream |
| DELETE | `/api/v1/workstreams/{id}` | Delete workstream |

## RACI Assignments

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/projects/{id}/raci` | List RACI assignments |
| POST | `/api/v1/raci` | Create assignment |
| PUT | `/api/v1/raci/{id}` | Update assignment role |
| DELETE | `/api/v1/raci/{id}` | Delete assignment |

## Relationships

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/relationships` | List all relationships |
| POST | `/api/v1/relationships` | Create relationship |
| DELETE | `/api/v1/relationships/{id}` | Delete relationship |

Query: `?stakeholder_id=<uuid>` to filter by stakeholder.

## Tags

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/tags` | List all tags |
| POST | `/api/v1/tags` | Create tag |
| DELETE | `/api/v1/tags/{id}` | Delete tag |
| POST | `/api/v1/stakeholders/{id}/tags/{tagId}` | Assign tag |
| DELETE | `/api/v1/stakeholders/{id}/tags/{tagId}` | Remove tag |

## AI Chat

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/ai/chat` | Send chat message |
| POST | `/api/v1/ai/meeting-brief` | Generate meeting brief |
| POST | `/api/v1/ai/email-draft` | Generate email draft |
| POST | `/api/v1/ai/analyze-blockers` | Analyze project blockers |

Requires Ollama running at `STAKEHOLDER_OLLAMA_URL`.

### Chat
```json
POST /api/v1/ai/chat
{
  "message": "Who are the key blockers?",
  "project_id": "optional-project-uuid"
}
```

## Export & Import

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/export/stakeholders.csv` | Export stakeholders as CSV |
| GET | `/api/v1/export/stakeholders.json` | Export stakeholders as JSON |
| GET | `/api/v1/export/full.json` | Export full database as JSON |
| POST | `/api/v1/import/stakeholders.csv` | Import stakeholders from CSV |

Query: `?project_id=<uuid>` to scope exports.

### CSV Import
```bash
curl -X POST http://localhost:1420/api/v1/import/stakeholders.csv \
  -F "file=@stakeholders.csv"
```

## Health

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/health` | Health check |

Response: `{"status": "ok", "version": "1.0.0"}`
