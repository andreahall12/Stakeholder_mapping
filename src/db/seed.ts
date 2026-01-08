import { projectsRepo, stakeholdersRepo, workstreamsRepo, projectStakeholdersRepo, raciRepo, commPlansRepo } from './database';

export async function seedSampleData() {
  // Find the "test 1" project or create one
  let projects = projectsRepo.getAll();
  let project = projects.find(p => p.name.toLowerCase().includes('test'));
  
  if (!project) {
    project = projectsRepo.create({
      name: 'Test Project',
      description: 'A sample project for demonstration',
      status: 'active',
    });
  }

  // Sample stakeholders
  const stakeholderData = [
    { name: 'Sarah Chen', jobTitle: 'VP of Engineering', department: 'Engineering', email: 'sarah.chen@company.com', slack: '@schen', influenceLevel: 'high' as const, supportLevel: 'champion' as const, notes: 'Key technical decision maker' },
    { name: 'Marcus Johnson', jobTitle: 'Product Director', department: 'Product', email: 'marcus.j@company.com', slack: '@marcusj', influenceLevel: 'high' as const, supportLevel: 'supporter' as const, notes: 'Owns product roadmap' },
    { name: 'Emily Rodriguez', jobTitle: 'Design Lead', department: 'Design', email: 'emily.r@company.com', slack: '@emilyr', influenceLevel: 'medium' as const, supportLevel: 'champion' as const, notes: 'UX expertise' },
    { name: 'James Wilson', jobTitle: 'Senior Engineer', department: 'Engineering', email: 'james.w@company.com', slack: '@jamesw', influenceLevel: 'medium' as const, supportLevel: 'neutral' as const, notes: 'Backend specialist' },
    { name: 'Lisa Park', jobTitle: 'Marketing Manager', department: 'Marketing', email: 'lisa.p@company.com', slack: '@lisap', influenceLevel: 'medium' as const, supportLevel: 'supporter' as const, notes: 'Go-to-market strategy' },
    { name: 'David Thompson', jobTitle: 'CFO', department: 'Finance', email: 'david.t@company.com', slack: '@davidt', influenceLevel: 'high' as const, supportLevel: 'resistant' as const, notes: 'Budget approval needed' },
    { name: 'Anna Kim', jobTitle: 'QA Lead', department: 'Engineering', email: 'anna.k@company.com', slack: '@annak', influenceLevel: 'low' as const, supportLevel: 'supporter' as const, notes: 'Quality assurance' },
    { name: 'Robert Garcia', jobTitle: 'Sales Director', department: 'Sales', email: 'robert.g@company.com', slack: '@robertg', influenceLevel: 'medium' as const, supportLevel: 'neutral' as const, notes: 'Customer feedback channel' },
  ];

  // Create stakeholders and assign to project
  const createdStakeholders: { stakeholder: ReturnType<typeof stakeholdersRepo.create>; assignment: ReturnType<typeof projectStakeholdersRepo.create> }[] = [];
  
  for (const data of stakeholderData) {
    const stakeholder = stakeholdersRepo.create(data);
    const assignment = projectStakeholdersRepo.create({
      projectId: project.id,
      stakeholderId: stakeholder.id,
      projectFunction: data.jobTitle,
    });
    createdStakeholders.push({ stakeholder, assignment });
  }

  // Create workstreams
  const workstreamNames = ['Design', 'Development', 'Testing', 'Launch', 'Marketing'];
  const workstreams = workstreamNames.map(name => 
    workstreamsRepo.create({ projectId: project.id, name, description: `${name} workstream` })
  );

  // Assign some RACI roles
  // Sarah (VP Eng) - Accountable for Development, Consulted on Design
  raciRepo.set(createdStakeholders[0].assignment.id, workstreams[1].id, 'A');
  raciRepo.set(createdStakeholders[0].assignment.id, workstreams[0].id, 'C');
  
  // Marcus (Product) - Responsible for Launch, Accountable for Design
  raciRepo.set(createdStakeholders[1].assignment.id, workstreams[3].id, 'R');
  raciRepo.set(createdStakeholders[1].assignment.id, workstreams[0].id, 'A');
  
  // Emily (Design) - Responsible for Design
  raciRepo.set(createdStakeholders[2].assignment.id, workstreams[0].id, 'R');
  
  // James (Engineer) - Responsible for Development
  raciRepo.set(createdStakeholders[3].assignment.id, workstreams[1].id, 'R');
  
  // Lisa (Marketing) - Responsible for Marketing, Informed on Launch
  raciRepo.set(createdStakeholders[4].assignment.id, workstreams[4].id, 'R');
  raciRepo.set(createdStakeholders[4].assignment.id, workstreams[3].id, 'I');
  
  // David (CFO) - Consulted on Launch
  raciRepo.set(createdStakeholders[5].assignment.id, workstreams[3].id, 'C');
  
  // Anna (QA) - Responsible for Testing
  raciRepo.set(createdStakeholders[6].assignment.id, workstreams[2].id, 'R');

  // Set communication plans
  commPlansRepo.set(createdStakeholders[0].assignment.id, 'meeting', 'weekly', 'Weekly sync');
  commPlansRepo.set(createdStakeholders[1].assignment.id, 'email', 'weekly', 'Status updates');
  commPlansRepo.set(createdStakeholders[5].assignment.id, 'briefing', 'monthly', 'Budget review');
  commPlansRepo.set(createdStakeholders[4].assignment.id, 'slack', 'daily', 'Quick updates');

  console.log('Sample data seeded successfully!');
  return { project, stakeholders: createdStakeholders.length, workstreams: workstreams.length };
}
