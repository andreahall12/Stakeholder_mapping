// Core entity types

export interface Project {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'archived' | 'planning';
  createdAt: string;
}

export interface Stakeholder {
  id: string;
  name: string;
  jobTitle: string;
  department: string;
  email: string;
  slack: string;
  influenceLevel: 'high' | 'medium' | 'low';
  supportLevel: 'champion' | 'supporter' | 'neutral' | 'resistant';
  notes: string;
}

export interface Workstream {
  id: string;
  projectId: string;
  name: string;
  description: string;
}

export interface ProjectStakeholder {
  id: string;
  projectId: string;
  stakeholderId: string;
  projectFunction: string;
}

export type RACIRole = 'R' | 'A' | 'C' | 'I';

export interface RACIAssignment {
  id: string;
  projectStakeholderId: string;
  workstreamId: string;
  role: RACIRole;
}

export type CommunicationChannel = 'email' | 'slack' | 'jira' | 'briefing' | 'meeting' | 'other';
export type CommunicationFrequency = 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'as-needed';

export interface CommunicationPlan {
  id: string;
  projectStakeholderId: string;
  channel: CommunicationChannel;
  frequency: CommunicationFrequency;
  notes: string;
}

// View types
export type ViewType = 'network' | 'influence' | 'orgchart' | 'raci';

// Extended types for UI
export interface StakeholderWithAssignments extends Stakeholder {
  assignments: ProjectStakeholder[];
}

export interface ProjectWithDetails extends Project {
  workstreams: Workstream[];
  stakeholderCount: number;
}

export interface StakeholderNode {
  id: string;
  data: {
    stakeholder: Stakeholder;
    projectFunction?: string;
    raciRoles?: { workstream: string; role: RACIRole }[];
  };
  position: { x: number; y: number };
}

// Chat types
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface QueryIntent {
  type: 'raci' | 'communication' | 'influence' | 'department' | 'general';
  filters: Record<string, string>;
  sqlQuery?: string;
}

