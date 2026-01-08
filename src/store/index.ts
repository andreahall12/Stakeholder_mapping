import { create } from 'zustand';
import type {
  Project,
  Stakeholder,
  Workstream,
  ProjectStakeholder,
  RACIAssignment,
  CommunicationPlan,
  ViewType,
  ChatMessage,
  EngagementLog,
  EngagementType,
  Sentiment,
  StakeholderHistory,
  Tag,
  Relationship,
  RelationshipType,
  RelationshipStrength,
} from '@/types';
import {
  initDatabase,
  projectsRepo,
  stakeholdersRepo,
  workstreamsRepo,
  projectStakeholdersRepo,
  raciRepo,
  commPlansRepo,
  engagementLogsRepo,
  stakeholderHistoryRepo,
  tagsRepo,
  relationshipsRepo,
} from '@/db/database';

interface StoreState {
  // Initialization
  initialized: boolean;
  initialize: () => Promise<void>;

  // Current selections
  currentProjectId: string | null;
  currentView: ViewType;
  setCurrentProject: (id: string | null) => void;
  setCurrentView: (view: ViewType) => void;

  // Projects
  projects: Project[];
  loadProjects: () => void;
  createProject: (project: Omit<Project, 'id' | 'createdAt'>) => Project;
  updateProject: (id: string, project: Partial<Project>) => void;
  deleteProject: (id: string) => void;

  // Stakeholders
  stakeholders: Stakeholder[];
  loadStakeholders: () => void;
  createStakeholder: (stakeholder: Omit<Stakeholder, 'id'>) => Stakeholder;
  updateStakeholder: (id: string, stakeholder: Partial<Stakeholder>) => void;
  deleteStakeholder: (id: string) => void;

  // Workstreams
  workstreams: Workstream[];
  loadWorkstreams: (projectId: string) => void;
  createWorkstream: (workstream: Omit<Workstream, 'id'>) => Workstream;
  updateWorkstream: (id: string, workstream: Partial<Workstream>) => void;
  deleteWorkstream: (id: string) => void;

  // Project Stakeholders (assignments)
  projectStakeholders: (Stakeholder & { projectFunction: string; projectStakeholderId: string })[];
  loadProjectStakeholders: (projectId: string) => void;
  assignStakeholder: (stakeholderId: string, projectId: string, projectFunction: string) => ProjectStakeholder;
  updateAssignment: (projectStakeholderId: string, projectFunction: string) => void;
  unassignStakeholder: (stakeholderId: string, projectId: string) => void;

  // RACI
  raciAssignments: (RACIAssignment & { workstreamName: string; stakeholderName: string; stakeholderId: string })[];
  loadRACIAssignments: (projectId: string) => void;
  setRACIRole: (projectStakeholderId: string, workstreamId: string, role: 'R' | 'A' | 'C' | 'I') => void;
  removeRACIRole: (projectStakeholderId: string, workstreamId: string) => void;

  // Communication Plans
  commPlans: (CommunicationPlan & { stakeholderName: string; stakeholderId: string })[];
  loadCommPlans: (projectId: string) => void;
  setCommPlan: (
    projectStakeholderId: string,
    channel: CommunicationPlan['channel'],
    frequency: CommunicationPlan['frequency'],
    notes?: string
  ) => void;

  // Engagement Logs
  engagementLogs: (EngagementLog & { stakeholderName?: string; stakeholderId?: string })[];
  loadEngagementLogs: (projectId: string) => void;
  addEngagementLog: (log: Omit<EngagementLog, 'id' | 'createdAt'>) => EngagementLog;
  updateEngagementLog: (id: string, log: Partial<EngagementLog>) => void;
  deleteEngagementLog: (id: string) => void;

  // Stakeholder History
  stakeholderHistory: (StakeholderHistory & { stakeholderName?: string })[];
  loadStakeholderHistory: () => void;

  // Tags
  tags: Tag[];
  loadTags: () => void;
  createTag: (name: string, color?: string) => Tag;
  updateTag: (id: string, name: string, color: string) => void;
  deleteTag: (id: string) => void;
  addTagToStakeholder: (stakeholderId: string, tagId: string) => void;
  removeTagFromStakeholder: (stakeholderId: string, tagId: string) => void;
  getStakeholderTags: (stakeholderId: string) => Tag[];

  // Relationships
  relationships: (Relationship & { fromName: string; toName: string })[];
  loadRelationships: () => void;
  createRelationship: (rel: Omit<Relationship, 'id'>) => Relationship;
  updateRelationship: (id: string, rel: Partial<Relationship>) => void;
  deleteRelationship: (id: string) => void;

  // Chat
  chatMessages: ChatMessage[];
  chatOpen: boolean;
  addChatMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  clearChat: () => void;
  toggleChat: () => void;

  // UI State
  sidebarOpen: boolean;
  anonymousMode: boolean;
  toggleSidebar: () => void;
  toggleAnonymousMode: () => void;

  // Dashboard helpers
  getOverdueStakeholders: () => (Stakeholder & { projectStakeholderId: string; daysSinceContact: number })[];
  getBlockers: () => (Stakeholder & { projectStakeholderId: string })[];
  getRACICoverageGaps: () => { workstreamId: string; workstreamName: string; missingRole: string }[];
}

// Helper to calculate days between dates
function daysBetween(date1: string, date2: string): number {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  return Math.floor((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
}

// Helper to get expected days based on frequency
function getExpectedDays(frequency: string): number {
  switch (frequency) {
    case 'daily': return 1;
    case 'weekly': return 7;
    case 'biweekly': return 14;
    case 'monthly': return 30;
    case 'quarterly': return 90;
    default: return 30; // as-needed defaults to monthly
  }
}

export const useStore = create<StoreState>((set, get) => ({
  // Initialization
  initialized: false,
  initialize: async () => {
    await initDatabase();
    const projects = projectsRepo.getAll();
    const stakeholders = stakeholdersRepo.getAll();
    const tags = tagsRepo.getAll();
    const relationships = relationshipsRepo.getAll();
    set({
      initialized: true,
      projects,
      stakeholders,
      tags,
      relationships,
      currentProjectId: projects[0]?.id || null,
      currentView: 'dashboard',
    });
    if (projects[0]) {
      get().loadWorkstreams(projects[0].id);
      get().loadProjectStakeholders(projects[0].id);
      get().loadRACIAssignments(projects[0].id);
      get().loadCommPlans(projects[0].id);
      get().loadEngagementLogs(projects[0].id);
    }
    get().loadStakeholderHistory();
  },

  // Current selections
  currentProjectId: null,
  currentView: 'dashboard',
  setCurrentProject: (id) => {
    set({ currentProjectId: id });
    if (id) {
      get().loadWorkstreams(id);
      get().loadProjectStakeholders(id);
      get().loadRACIAssignments(id);
      get().loadCommPlans(id);
      get().loadEngagementLogs(id);
    } else {
      set({ workstreams: [], projectStakeholders: [], raciAssignments: [], commPlans: [], engagementLogs: [] });
    }
  },
  setCurrentView: (view) => set({ currentView: view }),

  // Projects
  projects: [],
  loadProjects: () => {
    const projects = projectsRepo.getAll();
    set({ projects });
  },
  createProject: (project) => {
    const newProject = projectsRepo.create(project);
    get().loadProjects();
    return newProject;
  },
  updateProject: (id, project) => {
    projectsRepo.update(id, project);
    get().loadProjects();
  },
  deleteProject: (id) => {
    projectsRepo.delete(id);
    get().loadProjects();
    const { projects, currentProjectId } = get();
    if (currentProjectId === id) {
      set({ currentProjectId: projects[0]?.id || null });
    }
  },

  // Stakeholders
  stakeholders: [],
  loadStakeholders: () => {
    const stakeholders = stakeholdersRepo.getAll();
    set({ stakeholders });
  },
  createStakeholder: (stakeholder) => {
    const newStakeholder = stakeholdersRepo.create(stakeholder);
    get().loadStakeholders();
    return newStakeholder;
  },
  updateStakeholder: (id, stakeholder) => {
    // Track history for influence and support level changes
    const existing = stakeholdersRepo.getById(id);
    if (existing) {
      if (stakeholder.influenceLevel !== undefined && stakeholder.influenceLevel !== existing.influenceLevel) {
        stakeholderHistoryRepo.create({
          stakeholderId: id,
          field: 'influenceLevel',
          oldValue: existing.influenceLevel,
          newValue: stakeholder.influenceLevel,
        });
      }
      if (stakeholder.supportLevel !== undefined && stakeholder.supportLevel !== existing.supportLevel) {
        stakeholderHistoryRepo.create({
          stakeholderId: id,
          field: 'supportLevel',
          oldValue: existing.supportLevel,
          newValue: stakeholder.supportLevel,
        });
      }
    }
    stakeholdersRepo.update(id, stakeholder);
    get().loadStakeholders();
    get().loadStakeholderHistory();
    const { currentProjectId } = get();
    if (currentProjectId) {
      get().loadProjectStakeholders(currentProjectId);
    }
  },
  deleteStakeholder: (id) => {
    stakeholdersRepo.delete(id);
    get().loadStakeholders();
    const { currentProjectId } = get();
    if (currentProjectId) {
      get().loadProjectStakeholders(currentProjectId);
      get().loadRACIAssignments(currentProjectId);
      get().loadCommPlans(currentProjectId);
    }
  },

  // Workstreams
  workstreams: [],
  loadWorkstreams: (projectId) => {
    const workstreams = workstreamsRepo.getByProject(projectId);
    set({ workstreams });
  },
  createWorkstream: (workstream) => {
    const newWorkstream = workstreamsRepo.create(workstream);
    get().loadWorkstreams(workstream.projectId);
    return newWorkstream;
  },
  updateWorkstream: (id, workstream) => {
    workstreamsRepo.update(id, workstream);
    const { currentProjectId } = get();
    if (currentProjectId) {
      get().loadWorkstreams(currentProjectId);
    }
  },
  deleteWorkstream: (id) => {
    workstreamsRepo.delete(id);
    const { currentProjectId } = get();
    if (currentProjectId) {
      get().loadWorkstreams(currentProjectId);
      get().loadRACIAssignments(currentProjectId);
    }
  },

  // Project Stakeholders
  projectStakeholders: [],
  loadProjectStakeholders: (projectId) => {
    const projectStakeholders = stakeholdersRepo.getByProject(projectId);
    set({ projectStakeholders });
  },
  assignStakeholder: (stakeholderId, projectId, projectFunction) => {
    const assignment = projectStakeholdersRepo.create({
      projectId,
      stakeholderId,
      projectFunction,
    });
    get().loadProjectStakeholders(projectId);
    return assignment;
  },
  updateAssignment: (projectStakeholderId, projectFunction) => {
    projectStakeholdersRepo.updateFunction(projectStakeholderId, projectFunction);
    const { currentProjectId } = get();
    if (currentProjectId) {
      get().loadProjectStakeholders(currentProjectId);
    }
  },
  unassignStakeholder: (stakeholderId, projectId) => {
    projectStakeholdersRepo.deleteByStakeholderAndProject(stakeholderId, projectId);
    get().loadProjectStakeholders(projectId);
    get().loadRACIAssignments(projectId);
    get().loadCommPlans(projectId);
  },

  // RACI
  raciAssignments: [],
  loadRACIAssignments: (projectId) => {
    const raciAssignments = raciRepo.getByProject(projectId);
    set({ raciAssignments });
  },
  setRACIRole: (projectStakeholderId, workstreamId, role) => {
    raciRepo.set(projectStakeholderId, workstreamId, role);
    const { currentProjectId } = get();
    if (currentProjectId) {
      get().loadRACIAssignments(currentProjectId);
    }
  },
  removeRACIRole: (projectStakeholderId, workstreamId) => {
    raciRepo.remove(projectStakeholderId, workstreamId);
    const { currentProjectId } = get();
    if (currentProjectId) {
      get().loadRACIAssignments(currentProjectId);
    }
  },

  // Communication Plans
  commPlans: [],
  loadCommPlans: (projectId) => {
    const commPlans = commPlansRepo.getByProject(projectId);
    set({ commPlans });
  },
  setCommPlan: (projectStakeholderId, channel, frequency, notes = '') => {
    commPlansRepo.set(projectStakeholderId, channel, frequency, notes);
    const { currentProjectId } = get();
    if (currentProjectId) {
      get().loadCommPlans(currentProjectId);
    }
  },

  // Engagement Logs
  engagementLogs: [],
  loadEngagementLogs: (projectId) => {
    const engagementLogs = engagementLogsRepo.getByProject(projectId);
    set({ engagementLogs });
  },
  addEngagementLog: (log) => {
    const newLog = engagementLogsRepo.create(log);
    const { currentProjectId } = get();
    if (currentProjectId) {
      get().loadEngagementLogs(currentProjectId);
      get().loadCommPlans(currentProjectId); // Refresh comm plans for last contact date
    }
    return newLog;
  },
  updateEngagementLog: (id, log) => {
    engagementLogsRepo.update(id, log);
    const { currentProjectId } = get();
    if (currentProjectId) {
      get().loadEngagementLogs(currentProjectId);
    }
  },
  deleteEngagementLog: (id) => {
    engagementLogsRepo.delete(id);
    const { currentProjectId } = get();
    if (currentProjectId) {
      get().loadEngagementLogs(currentProjectId);
    }
  },

  // Stakeholder History
  stakeholderHistory: [],
  loadStakeholderHistory: () => {
    const stakeholderHistory = stakeholderHistoryRepo.getRecentChanges(50);
    set({ stakeholderHistory });
  },

  // Tags
  tags: [],
  loadTags: () => {
    const tags = tagsRepo.getAll();
    set({ tags });
  },
  createTag: (name, color = '#6366f1') => {
    const tag = tagsRepo.create(name, color);
    get().loadTags();
    return tag;
  },
  updateTag: (id, name, color) => {
    tagsRepo.update(id, name, color);
    get().loadTags();
  },
  deleteTag: (id) => {
    tagsRepo.delete(id);
    get().loadTags();
  },
  addTagToStakeholder: (stakeholderId, tagId) => {
    tagsRepo.addToStakeholder(stakeholderId, tagId);
  },
  removeTagFromStakeholder: (stakeholderId, tagId) => {
    tagsRepo.removeFromStakeholder(stakeholderId, tagId);
  },
  getStakeholderTags: (stakeholderId) => {
    return tagsRepo.getByStakeholder(stakeholderId);
  },

  // Relationships
  relationships: [],
  loadRelationships: () => {
    const relationships = relationshipsRepo.getAll();
    set({ relationships });
  },
  createRelationship: (rel) => {
    const newRel = relationshipsRepo.create(rel);
    get().loadRelationships();
    return newRel;
  },
  updateRelationship: (id, rel) => {
    relationshipsRepo.update(id, rel);
    get().loadRelationships();
  },
  deleteRelationship: (id) => {
    relationshipsRepo.delete(id);
    get().loadRelationships();
  },

  // Chat
  chatMessages: [],
  chatOpen: false,
  addChatMessage: (message) => {
    const newMessage: ChatMessage = {
      ...message,
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
    };
    set((state) => ({ chatMessages: [...state.chatMessages, newMessage] }));
  },
  clearChat: () => set({ chatMessages: [] }),
  toggleChat: () => set((state) => ({ chatOpen: !state.chatOpen })),

  // UI State
  sidebarOpen: true,
  anonymousMode: false,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  toggleAnonymousMode: () => set((state) => ({ anonymousMode: !state.anonymousMode })),

  // Dashboard helpers
  getOverdueStakeholders: () => {
    const { projectStakeholders, commPlans } = get();
    const today = new Date().toISOString();
    const overdue: (Stakeholder & { projectStakeholderId: string; daysSinceContact: number })[] = [];

    for (const ps of projectStakeholders) {
      const plan = commPlans.find(c => c.projectStakeholderId === ps.projectStakeholderId);
      if (plan && plan.lastContactDate) {
        const expectedDays = getExpectedDays(plan.frequency);
        const actualDays = daysBetween(plan.lastContactDate, today);
        if (actualDays > expectedDays) {
          overdue.push({ ...ps, daysSinceContact: actualDays });
        }
      } else if (plan && !plan.lastContactDate) {
        // Has a plan but never contacted
        overdue.push({ ...ps, daysSinceContact: 999 });
      }
    }

    return overdue.sort((a, b) => b.daysSinceContact - a.daysSinceContact);
  },

  getBlockers: () => {
    const { projectStakeholders } = get();
    return projectStakeholders.filter(
      s => s.influenceLevel === 'high' && (s.supportLevel === 'resistant' || s.supportLevel === 'neutral')
    );
  },

  getRACICoverageGaps: () => {
    const { workstreams, raciAssignments } = get();
    const gaps: { workstreamId: string; workstreamName: string; missingRole: string }[] = [];

    for (const ws of workstreams) {
      const wsAssignments = raciAssignments.filter(r => r.workstreamId === ws.id);
      const hasR = wsAssignments.some(r => r.role === 'R');
      const hasA = wsAssignments.some(r => r.role === 'A');
      
      if (!hasR) {
        gaps.push({ workstreamId: ws.id, workstreamName: ws.name, missingRole: 'Responsible' });
      }
      if (!hasA) {
        gaps.push({ workstreamId: ws.id, workstreamName: ws.name, missingRole: 'Accountable' });
      }
    }

    return gaps;
  },
}));
