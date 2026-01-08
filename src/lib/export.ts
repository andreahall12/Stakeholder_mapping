import { projectsRepo, stakeholdersRepo, workstreamsRepo, raciRepo, commPlansRepo, exportDatabase, engagementLogsRepo } from '@/db/database';

export function exportToCSV(projectId: string): { stakeholders: string; raci: string; commPlans: string } {
  // Export stakeholders
  const stakeholders = stakeholdersRepo.getByProject(projectId);
  const stakeholderCSV = [
    ['Name', 'Job Title', 'Department', 'Email', 'Slack', 'Influence Level', 'Support Level', 'Project Function', 'Notes'].join(','),
    ...stakeholders.map((s) =>
      [
        escapeCSV(s.name),
        escapeCSV(s.jobTitle),
        escapeCSV(s.department),
        escapeCSV(s.email),
        escapeCSV(s.slack),
        s.influenceLevel,
        s.supportLevel,
        escapeCSV(s.projectFunction),
        escapeCSV(s.notes),
      ].join(',')
    ),
  ].join('\n');

  // Export RACI
  const raciAssignments = raciRepo.getByProject(projectId);
  const raciCSV = [
    ['Stakeholder', 'Workstream', 'Role'].join(','),
    ...raciAssignments.map((r) =>
      [escapeCSV(r.stakeholderName), escapeCSV(r.workstreamName), r.role].join(',')
    ),
  ].join('\n');

  // Export Communication Plans
  const commPlans = commPlansRepo.getByProject(projectId);
  const commCSV = [
    ['Stakeholder', 'Channel', 'Frequency', 'Notes'].join(','),
    ...commPlans.map((c) =>
      [escapeCSV(c.stakeholderName), c.channel, c.frequency, escapeCSV(c.notes)].join(',')
    ),
  ].join('\n');

  return {
    stakeholders: stakeholderCSV,
    raci: raciCSV,
    commPlans: commCSV,
  };
}

export function exportToJSON(projectId: string): string {
  const project = projectsRepo.getById(projectId);
  const stakeholders = stakeholdersRepo.getByProject(projectId);
  const workstreams = workstreamsRepo.getByProject(projectId);
  const raciAssignments = raciRepo.getByProject(projectId);
  const commPlans = commPlansRepo.getByProject(projectId);

  return JSON.stringify(
    {
      exportedAt: new Date().toISOString(),
      project,
      stakeholders,
      workstreams,
      raciAssignments,
      commPlans,
    },
    null,
    2
  );
}

export function exportFullDatabase(): Uint8Array {
  return exportDatabase();
}

export function downloadFile(content: string | Uint8Array, filename: string, type: string) {
  let blob: Blob;
  if (content instanceof Uint8Array) {
    const buffer = new ArrayBuffer(content.length);
    const view = new Uint8Array(buffer);
    view.set(content);
    blob = new Blob([buffer], { type });
  } else {
    blob = new Blob([content], { type });
  }
  
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function escapeCSV(value: string): string {
  if (!value) return '';
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

// Generate a printable HTML report for PDF export
export function generatePDFReport(projectId: string): string {
  const project = projectsRepo.getById(projectId);
  const stakeholders = stakeholdersRepo.getByProject(projectId);
  const workstreams = workstreamsRepo.getByProject(projectId);
  const raciAssignments = raciRepo.getByProject(projectId);
  const commPlans = commPlansRepo.getByProject(projectId);

  if (!project) return '';

  // Calculate stats
  const bySupport = {
    champion: stakeholders.filter((s) => s.supportLevel === 'champion').length,
    supporter: stakeholders.filter((s) => s.supportLevel === 'supporter').length,
    neutral: stakeholders.filter((s) => s.supportLevel === 'neutral').length,
    resistant: stakeholders.filter((s) => s.supportLevel === 'resistant').length,
  };

  const byInfluence = {
    high: stakeholders.filter((s) => s.influenceLevel === 'high').length,
    medium: stakeholders.filter((s) => s.influenceLevel === 'medium').length,
    low: stakeholders.filter((s) => s.influenceLevel === 'low').length,
  };

  const blockers = stakeholders.filter(
    (s) => s.influenceLevel === 'high' && (s.supportLevel === 'resistant' || s.supportLevel === 'neutral')
  );

  // Build RACI matrix data
  const raciMatrix: Record<string, Record<string, string>> = {};
  workstreams.forEach((ws) => {
    raciMatrix[ws.name] = {};
  });
  raciAssignments.forEach((r) => {
    if (raciMatrix[r.workstreamName]) {
      raciMatrix[r.workstreamName][r.stakeholderName] = r.role;
    }
  });

  const today = new Date().toLocaleDateString();

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${project.name} - Stakeholder Landscape</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 11px;
      line-height: 1.4;
      color: #1a1a1a;
      padding: 40px;
      max-width: 1000px;
      margin: 0 auto;
    }
    h1 { font-size: 24px; margin-bottom: 8px; }
    h2 { font-size: 14px; margin: 20px 0 10px; border-bottom: 2px solid #6366f1; padding-bottom: 4px; }
    h3 { font-size: 12px; margin: 12px 0 6px; }
    .header { margin-bottom: 24px; }
    .header p { color: #666; font-size: 12px; }
    .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 20px; }
    .stat-card { 
      padding: 12px; 
      border-radius: 8px; 
      background: #f8f8f8; 
      border: 1px solid #e5e5e5;
    }
    .stat-card .label { font-size: 10px; color: #666; text-transform: uppercase; }
    .stat-card .value { font-size: 20px; font-weight: 600; margin-top: 4px; }
    .stat-card .breakdown { font-size: 10px; color: #888; margin-top: 4px; }
    .alert { 
      padding: 10px 12px; 
      border-radius: 6px; 
      margin-bottom: 12px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .alert.warning { background: #fef3c7; border-left: 4px solid #f59e0b; }
    .alert.danger { background: #fee2e2; border-left: 4px solid #ef4444; }
    table { width: 100%; border-collapse: collapse; margin: 10px 0; font-size: 10px; }
    th, td { padding: 6px 8px; text-align: left; border: 1px solid #e5e5e5; }
    th { background: #f8f8f8; font-weight: 600; }
    .badge { 
      display: inline-block; 
      padding: 2px 6px; 
      border-radius: 4px; 
      font-size: 9px; 
      font-weight: 500;
    }
    .badge.high { background: #fef3c7; color: #92400e; }
    .badge.champion { background: #d1fae5; color: #065f46; }
    .badge.supporter { background: #dbeafe; color: #1e40af; }
    .badge.neutral { background: #f3f4f6; color: #4b5563; }
    .badge.resistant { background: #fee2e2; color: #991b1b; }
    .footer { margin-top: 30px; padding-top: 16px; border-top: 1px solid #e5e5e5; color: #888; font-size: 10px; }
    @media print {
      body { padding: 20px; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>${project.name}</h1>
    <p>${project.description || 'Stakeholder Landscape Report'}</p>
    <p>Generated: ${today}</p>
  </div>

  <div class="grid">
    <div class="stat-card">
      <div class="label">Total Stakeholders</div>
      <div class="value">${stakeholders.length}</div>
    </div>
    <div class="stat-card">
      <div class="label">Workstreams</div>
      <div class="value">${workstreams.length}</div>
    </div>
    <div class="stat-card">
      <div class="label">Support Distribution</div>
      <div class="breakdown">
        ${bySupport.champion} Champions · ${bySupport.supporter} Supporters<br>
        ${bySupport.neutral} Neutral · ${bySupport.resistant} Resistant
      </div>
    </div>
    <div class="stat-card">
      <div class="label">Influence Levels</div>
      <div class="breakdown">
        ${byInfluence.high} High · ${byInfluence.medium} Medium · ${byInfluence.low} Low
      </div>
    </div>
  </div>

  ${blockers.length > 0 ? `
    <h2>⚠️ Key Risks</h2>
    ${blockers.map(b => `
      <div class="alert warning">
        <strong>${b.name}</strong> (${b.jobTitle || 'Unknown role'}) - High influence, ${b.supportLevel}
      </div>
    `).join('')}
  ` : ''}

  <h2>Stakeholder Overview</h2>
  <table>
    <thead>
      <tr>
        <th>Name</th>
        <th>Title</th>
        <th>Department</th>
        <th>Influence</th>
        <th>Support</th>
      </tr>
    </thead>
    <tbody>
      ${stakeholders.map(s => `
        <tr>
          <td><strong>${s.name}</strong></td>
          <td>${s.jobTitle || '-'}</td>
          <td>${s.department || '-'}</td>
          <td><span class="badge ${s.influenceLevel}">${s.influenceLevel}</span></td>
          <td><span class="badge ${s.supportLevel}">${s.supportLevel}</span></td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  ${workstreams.length > 0 ? `
    <h2>RACI Summary</h2>
    <table>
      <thead>
        <tr>
          <th>Workstream</th>
          <th>Responsible</th>
          <th>Accountable</th>
          <th>Consulted</th>
          <th>Informed</th>
        </tr>
      </thead>
      <tbody>
        ${workstreams.map(ws => {
          const wsRaci = raciAssignments.filter(r => r.workstreamName === ws.name);
          const responsible = wsRaci.filter(r => r.role === 'R').map(r => r.stakeholderName).join(', ') || '-';
          const accountable = wsRaci.filter(r => r.role === 'A').map(r => r.stakeholderName).join(', ') || '-';
          const consulted = wsRaci.filter(r => r.role === 'C').map(r => r.stakeholderName).join(', ') || '-';
          const informed = wsRaci.filter(r => r.role === 'I').map(r => r.stakeholderName).join(', ') || '-';
          return `
            <tr>
              <td><strong>${ws.name}</strong></td>
              <td>${responsible}</td>
              <td>${accountable}</td>
              <td>${consulted}</td>
              <td>${informed}</td>
            </tr>
          `;
        }).join('')}
      </tbody>
    </table>
  ` : ''}

  <div class="footer">
    <p>Report generated by Stakeholder Mapping Tool</p>
  </div>

  <script>
    // Auto-print when loaded
    window.onload = function() {
      window.print();
    };
  </script>
</body>
</html>
  `.trim();
}
