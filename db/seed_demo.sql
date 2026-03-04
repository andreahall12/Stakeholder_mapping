-- Demo Data: Cloud Platform Migration Program
-- This creates a realistic stakeholder scenario for exploring the tool.
-- Run with: make demo
-- Clear with: make reset

-- ============================================================
-- PROJECT
-- ============================================================
INSERT INTO projects (id, name, description, status) VALUES
  ('proj-demo-001', 'Cloud Platform Migration', 'Enterprise migration from on-premise data centers to AWS. Involves 40+ applications, 12 teams, and a 16-month timeline.', 'active');

-- ============================================================
-- STAKEHOLDERS
-- ============================================================
INSERT INTO stakeholders (id, name, job_title, department, email, slack, influence_level, support_level, notes) VALUES
  ('sh-001', 'Maria Chen',       'CTO',                      'Technology',    'maria.chen@example.com',    '@maria',    'high',   'champion',   'Executive sponsor. Driving the cloud strategy. Strong advocate for modernization.'),
  ('sh-002', 'David Okonkwo',    'VP Engineering',            'Engineering',   'david.o@example.com',       '@david.o',  'high',   'supporter',  'Owns the migration execution. Needs more headcount to meet timeline.'),
  ('sh-003', 'Sarah Mitchell',   'CISO',                      'Security',      'sarah.m@example.com',       '@sarah.m',  'high',   'neutral',    'Concerned about data residency and compliance gaps during migration. Requires security review at each phase gate.'),
  ('sh-004', 'James Rivera',     'CFO',                       'Finance',       'james.r@example.com',       '@james.r',  'high',   'resistant',  'Worried about cost overruns. Wants monthly burn-rate reports and ROI projections before approving next phase.'),
  ('sh-005', 'Aisha Patel',      'Director of Product',       'Product',       'aisha.p@example.com',       '@aisha',    'medium', 'supporter',  'Excited about improved deployment speed. Wants to ensure zero downtime for customer-facing services.'),
  ('sh-006', 'Tom Brennan',      'Infrastructure Lead',       'Engineering',   'tom.b@example.com',         '@tom.b',    'medium', 'champion',   'Technical lead for the migration. Deep AWS expertise. Running the hands-on work.'),
  ('sh-007', 'Lisa Park',        'Head of HR',                'Human Resources','lisa.p@example.com',       '@lisa.p',   'medium', 'neutral',    'Needs to understand impact on team structure and potential role changes.'),
  ('sh-008', 'Marcus Johnson',   'Director of Operations',    'Operations',    'marcus.j@example.com',      '@marcus.j', 'medium', 'resistant',  'Comfortable with current infrastructure. Sees migration as unnecessary risk to uptime SLAs.'),
  ('sh-009', 'Emily Watson',     'Lead Architect',            'Engineering',   'emily.w@example.com',        '@emily.w',  'medium', 'supporter',  'Designed the target architecture. Key technical decision-maker for service decomposition.'),
  ('sh-010', 'Raj Krishnamurthy','Compliance Manager',        'Legal',         'raj.k@example.com',         '@raj.k',    'low',    'neutral',    'Reviewing regulatory implications. Needs data processing addendum for cloud provider.'),
  ('sh-011', 'Karen Foster',     'Customer Success Lead',     'Customer Success','karen.f@example.com',     '@karen.f',  'low',    'supporter',  'Wants to communicate migration benefits to enterprise customers.'),
  ('sh-012', 'Ben Thompson',     'DevOps Engineer',           'Engineering',   'ben.t@example.com',         '@ben.t',    'low',    'champion',   'Building the CI/CD pipelines for the cloud environment. Enthusiastic about IaC.');

-- ============================================================
-- PROJECT STAKEHOLDER ASSIGNMENTS
-- ============================================================
INSERT INTO project_stakeholders (id, project_id, stakeholder_id, project_function) VALUES
  ('ps-001', 'proj-demo-001', 'sh-001', 'Executive Sponsor'),
  ('ps-002', 'proj-demo-001', 'sh-002', 'Program Lead'),
  ('ps-003', 'proj-demo-001', 'sh-003', 'Security Advisor'),
  ('ps-004', 'proj-demo-001', 'sh-004', 'Budget Approver'),
  ('ps-005', 'proj-demo-001', 'sh-005', 'Product Liaison'),
  ('ps-006', 'proj-demo-001', 'sh-006', 'Technical Lead'),
  ('ps-007', 'proj-demo-001', 'sh-007', 'HR Partner'),
  ('ps-008', 'proj-demo-001', 'sh-008', 'Operations Stakeholder'),
  ('ps-009', 'proj-demo-001', 'sh-009', 'Architecture Lead'),
  ('ps-010', 'proj-demo-001', 'sh-010', 'Compliance Reviewer'),
  ('ps-011', 'proj-demo-001', 'sh-011', 'Customer Comms'),
  ('ps-012', 'proj-demo-001', 'sh-012', 'DevOps Lead');

-- ============================================================
-- WORKSTREAMS
-- ============================================================
INSERT INTO workstreams (id, project_id, name, description) VALUES
  ('ws-001', 'proj-demo-001', 'Infrastructure Setup',    'Provision AWS accounts, VPCs, networking, and IAM roles'),
  ('ws-002', 'proj-demo-001', 'Application Migration',   'Lift-and-shift and re-platform 40+ applications'),
  ('ws-003', 'proj-demo-001', 'Security & Compliance',   'Implement cloud security controls and pass compliance audits'),
  ('ws-004', 'proj-demo-001', 'Data Migration',          'Migrate databases and data lakes with zero data loss'),
  ('ws-005', 'proj-demo-001', 'Team Enablement',         'Train engineering teams on AWS services and cloud-native patterns');

-- ============================================================
-- RACI ASSIGNMENTS
-- ============================================================
-- Infrastructure Setup
INSERT INTO raci_assignments (id, project_stakeholder_id, workstream_id, role) VALUES
  ('ra-001', 'ps-006', 'ws-001', 'R'),
  ('ra-002', 'ps-002', 'ws-001', 'A'),
  ('ra-003', 'ps-009', 'ws-001', 'C'),
  ('ra-004', 'ps-003', 'ws-001', 'I');

-- Application Migration
INSERT INTO raci_assignments (id, project_stakeholder_id, workstream_id, role) VALUES
  ('ra-005', 'ps-009', 'ws-002', 'R'),
  ('ra-006', 'ps-002', 'ws-002', 'A'),
  ('ra-007', 'ps-005', 'ws-002', 'C'),
  ('ra-008', 'ps-008', 'ws-002', 'I');

-- Security & Compliance
INSERT INTO raci_assignments (id, project_stakeholder_id, workstream_id, role) VALUES
  ('ra-009', 'ps-003', 'ws-003', 'R'),
  ('ra-010', 'ps-001', 'ws-003', 'A'),
  ('ra-011', 'ps-010', 'ws-003', 'C'),
  ('ra-012', 'ps-002', 'ws-003', 'I');

-- Data Migration
INSERT INTO raci_assignments (id, project_stakeholder_id, workstream_id, role) VALUES
  ('ra-013', 'ps-012', 'ws-004', 'R'),
  ('ra-014', 'ps-006', 'ws-004', 'A'),
  ('ra-015', 'ps-003', 'ws-004', 'C'),
  ('ra-016', 'ps-005', 'ws-004', 'I');

-- Team Enablement
INSERT INTO raci_assignments (id, project_stakeholder_id, workstream_id, role) VALUES
  ('ra-017', 'ps-002', 'ws-005', 'R'),
  ('ra-018', 'ps-001', 'ws-005', 'A'),
  ('ra-019', 'ps-007', 'ws-005', 'C'),
  ('ra-020', 'ps-012', 'ws-005', 'I');

-- ============================================================
-- RELATIONSHIPS
-- ============================================================
INSERT INTO relationships (id, from_stakeholder_id, to_stakeholder_id, type, strength, notes) VALUES
  ('rel-001', 'sh-002', 'sh-001', 'reports_to',     'strong',   'Direct report'),
  ('rel-002', 'sh-006', 'sh-002', 'reports_to',     'strong',   'Direct report'),
  ('rel-003', 'sh-009', 'sh-002', 'reports_to',     'strong',   'Direct report'),
  ('rel-004', 'sh-012', 'sh-006', 'reports_to',     'strong',   'Direct report'),
  ('rel-005', 'sh-001', 'sh-004', 'influences',     'moderate', 'Peer executives — Maria is building the business case for James'),
  ('rel-006', 'sh-003', 'sh-004', 'allied_with',    'moderate', 'Both focused on risk — Sarah provides security justification for James budget concerns'),
  ('rel-007', 'sh-008', 'sh-004', 'allied_with',    'weak',     'Both skeptical of migration pace'),
  ('rel-008', 'sh-006', 'sh-009', 'allied_with',    'strong',   'Close technical collaborators'),
  ('rel-009', 'sh-008', 'sh-002', 'conflicts_with', 'moderate', 'Disagree on migration timeline — Marcus wants slower rollout');

-- ============================================================
-- COMMUNICATION PLANS
-- ============================================================
INSERT INTO comm_plans (id, project_stakeholder_id, channel, frequency, notes, last_contact_date) VALUES
  ('cp-001', 'ps-001', 'meeting',  'weekly',    'Monday exec sync — 30min',                '2026-01-27'),
  ('cp-002', 'ps-002', 'meeting',  'daily',     'Daily standup + weekly 1:1',               '2026-02-05'),
  ('cp-003', 'ps-003', 'email',    'biweekly',  'Security review checkpoint emails',        '2026-01-20'),
  ('cp-004', 'ps-004', 'briefing', 'monthly',   'Monthly budget review presentation',       '2026-01-15'),
  ('cp-005', 'ps-005', 'slack',    'weekly',     'Weekly async update in #cloud-migration',  '2026-02-03'),
  ('cp-006', 'ps-008', 'meeting',  'biweekly',  'Alignment meeting — address concerns',     '2026-01-13');

-- ============================================================
-- ENGAGEMENT LOGS
-- ============================================================
INSERT INTO engagement_logs (id, project_stakeholder_id, date, type, summary, sentiment) VALUES
  ('el-001', 'ps-001', '2026-02-03', 'meeting',  'Exec sync: Maria approved Phase 2 budget. Wants customer comms plan by next week.', 'positive'),
  ('el-002', 'ps-002', '2026-02-05', 'meeting',  'Standup: David flagged resource gap on data migration workstream. Needs 2 more engineers.', 'neutral'),
  ('el-003', 'ps-003', '2026-01-28', 'email',    'Sarah sent security review findings. 3 medium-risk items need remediation before Phase 2.', 'neutral'),
  ('el-004', 'ps-004', '2026-01-15', 'meeting',  'Monthly review: James pushed back on cloud egress costs. Wants comparison with on-prem TCO.', 'negative'),
  ('el-005', 'ps-006', '2026-02-04', 'decision', 'Tom chose EKS over ECS for container orchestration. Architecture council approved.', 'positive'),
  ('el-006', 'ps-008', '2026-01-22', 'meeting',  'Marcus raised SLA concerns for migration weekend. Agreed to add rollback plan and extend maintenance window.', 'neutral'),
  ('el-007', 'ps-009', '2026-02-01', 'note',     'Emily completed target architecture v2 doc. Shared with all engineering leads for review.', 'positive'),
  ('el-008', 'ps-011', '2026-01-30', 'email',    'Karen drafted customer FAQ for migration. Needs product team review before publishing.', 'positive');

-- ============================================================
-- TAGS
-- ============================================================
INSERT INTO tags (id, name, color) VALUES
  ('tag-001', 'Executive',    '#d2a8ff'),
  ('tag-002', 'Technical',    '#58a6ff'),
  ('tag-003', 'Blocker Risk', '#f85149'),
  ('tag-004', 'Budget Owner', '#f0883e'),
  ('tag-005', 'Key Ally',     '#3fb950');

INSERT INTO stakeholder_tags (stakeholder_id, tag_id) VALUES
  ('sh-001', 'tag-001'),
  ('sh-001', 'tag-005'),
  ('sh-002', 'tag-001'),
  ('sh-003', 'tag-001'),
  ('sh-003', 'tag-003'),
  ('sh-004', 'tag-001'),
  ('sh-004', 'tag-003'),
  ('sh-004', 'tag-004'),
  ('sh-006', 'tag-002'),
  ('sh-006', 'tag-005'),
  ('sh-008', 'tag-003'),
  ('sh-009', 'tag-002'),
  ('sh-012', 'tag-002');

-- ============================================================
-- STAKEHOLDER HISTORY (shows level changes over time)
-- ============================================================
INSERT INTO stakeholder_history (id, stakeholder_id, field, old_value, new_value, changed_at, notes) VALUES
  ('hist-001', 'sh-003', 'supportLevel', 'resistant', 'neutral', '2026-01-10', 'Moved from resistant after security review process was agreed upon'),
  ('hist-002', 'sh-005', 'supportLevel', 'neutral',   'supporter', '2025-12-15', 'Became supportive after seeing deployment speed improvements in POC');
