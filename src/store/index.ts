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
} from '@/types';
import {
  initDatabase,
  projectsRepo,
  stakeholdersRepo,
  workstreamsRepo,
  projectStakeholdersRepo,
  raciRepo,
  commPlansRepo,
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

  // Chat
  chatMessages: ChatMessage[];
  chatOpen: boolean;
  addChatMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  clearChat: () => void;
  toggleChat: () => void;

  // UI State
  sidebarOpen: boolean;
  toggleSidebar: () => void;
}

export const useStore = create<StoreState>((set, get) => ({
  // Initialization
  initialized: false,
  initialize: async () => {
    await initDatabase();
    const projects = projectsRepo.getAll();
    const stakeholders = stakeholdersRepo.getAll();
    set({
      initialized: true,
      projects,
      stakeholders,
      currentProjectId: projects[0]?.id || null,
    });
    if (projects[0]) {
      get().loadWorkstreams(projects[0].id);
      get().loadProjectStakeholders(projects[0].id);
      get().loadRACIAssignments(projects[0].id);
      get().loadCommPlans(projects[0].id);
    }
  },

  // Current selections
  currentProjectId: null,
  currentView: 'network',
  setCurrentProject: (id) => {
    set({ currentProjectId: id });
    if (id) {
      get().loadWorkstreams(id);
      get().loadProjectStakeholders(id);
      get().loadRACIAssignments(id);
      get().loadCommPlans(id);
    } else {
      set({ workstreams: [], projectStakeholders: [], raciAssignments: [], commPlans: [] });
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
    stakeholdersRepo.update(id, stakeholder);
    get().loadStakeholders();
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
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
}));

