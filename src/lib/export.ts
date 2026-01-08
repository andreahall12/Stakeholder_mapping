import { projectsRepo, stakeholdersRepo, workstreamsRepo, raciRepo, commPlansRepo, exportDatabase } from '@/db/database';

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
  const blob = content instanceof Uint8Array
    ? new Blob([content], { type })
    : new Blob([content], { type });
  
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

