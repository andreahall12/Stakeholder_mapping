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
  lastContactDate?: string;
}

// Engagement Log types
export type EngagementType = 'meeting' | 'email' | 'call' | 'decision' | 'note';
export type Sentiment = 'positive' | 'neutral' | 'negative';

export interface EngagementLog {
  id: string;
  projectStakeholderId: string;
  date: string;
  type: EngagementType;
  summary: string;
  sentiment: Sentiment;
  createdAt: string;
}

// Stakeholder History types
export interface StakeholderHistory {
  id: string;
  stakeholderId: string;
  field: 'influenceLevel' | 'supportLevel';
  oldValue: string;
  newValue: string;
  changedAt: string;
  notes?: string;
}

// Tag types
export interface Tag {
  id: string;
  name: string;
  color: string;
}

export interface StakeholderTag {
  stakeholderId: string;
  tagId: string;
}

// Relationship types
export type RelationshipType = 'reports_to' | 'influences' | 'allied_with' | 'conflicts_with';
export type RelationshipStrength = 'strong' | 'moderate' | 'weak';

export interface Relationship {
  id: string;
  fromStakeholderId: string;
  toStakeholderId: string;
  type: RelationshipType;
  strength: RelationshipStrength;
  notes?: string;
}

// View types
export type ViewType = 'dashboard' | 'network' | 'influence' | 'orgchart' | 'raci';

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

// Saved filter view
export interface SavedFilter {
  id: string;
  name: string;
  filters: {
    influenceLevel?: string;
    supportLevel?: string;
    department?: string;
    tagId?: string;
  };
}
