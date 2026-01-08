import { useState } from 'react';
import { useStore } from '@/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { StakeholderDialog } from './StakeholderDialog';
import { AssignmentDialog } from './AssignmentDialog';
import { WorkstreamDialog } from './WorkstreamDialog';
import { EngagementLogDialog } from './EngagementLogDialog';
import { AIQuickAddDialog } from './AIQuickAddDialog';
import { BulkOperationsDialog } from './BulkOperationsDialog';
import { SavedFiltersDropdown, FilterControls } from './SavedFiltersDropdown';
import type { SavedFilter } from '@/types';
import { tagsRepo } from '@/db/database';
import {
  Plus,
  Search,
  UserPlus,
  Settings2,
  ChevronUp,
  ChevronDown,
  Users,
  Briefcase,
  MessageSquare,
  Clock,
  Sparkles,
  ListChecks,
} from 'lucide-react';
import { cn, getDisplayName } from '@/lib/utils';
import type { Stakeholder } from '@/types';

export function StakeholderPanel() {
  const {
    currentProjectId,
    projectStakeholders,
    stakeholders,
    workstreams,
    commPlans,
    anonymousMode,
  } = useStore();

  const [expanded, setExpanded] = useState(true);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<SavedFilter['filters']>({});
  const [showFilters, setShowFilters] = useState(false);
  const [stakeholderDialogOpen, setStakeholderDialogOpen] = useState(false);
  const [assignmentDialogOpen, setAssignmentDialogOpen] = useState(false);
  const [workstreamDialogOpen, setWorkstreamDialogOpen] = useState(false);
  const [engagementDialogOpen, setEngagementDialogOpen] = useState(false);
  const [aiQuickAddOpen, setAiQuickAddOpen] = useState(false);
  const [bulkOpsOpen, setBulkOpsOpen] = useState(false);
  const [editingStakeholder, setEditingStakeholder] = useState<Stakeholder | null>(null);
  const [selectedForEngagement, setSelectedForEngagement] = useState<{
    projectStakeholderId: string;
    name: string;
  } | null>(null);

  const filteredStakeholders = projectStakeholders.filter((s) => {
    // Text search
    const matchesSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.jobTitle.toLowerCase().includes(search.toLowerCase()) ||
      s.department.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;

    // Filter by influence level
    if (filters.influenceLevel && s.influenceLevel !== filters.influenceLevel) {
      return false;
    }

    // Filter by support level
    if (filters.supportLevel && s.supportLevel !== filters.supportLevel) {
      return false;
    }

    // Filter by department
    if (filters.department && s.department !== filters.department) {
      return false;
    }

    // Filter by tag
    if (filters.tagId) {
      const stakeholderTags = tagsRepo.getByStakeholder(s.id);
      if (!stakeholderTags.some((t) => t.id === filters.tagId)) {
        return false;
      }
    }

    return true;
  });

  const unassignedStakeholders = stakeholders.filter(
    (s) => !projectStakeholders.some((ps) => ps.id === s.id)
  );

  const handleEditStakeholder = (stakeholder: Stakeholder) => {
    setEditingStakeholder(stakeholder);
    setStakeholderDialogOpen(true);
  };

  const handleNewStakeholder = () => {
    setEditingStakeholder(null);
    setStakeholderDialogOpen(true);
  };

  const handleOpenEngagementLog = (
    projectStakeholderId: string,
    name: string,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    setSelectedForEngagement({ projectStakeholderId, name });
    setEngagementDialogOpen(true);
  };

  // Helper to check if stakeholder is overdue for communication
  const getCommStatus = (projectStakeholderId: string): { isOverdue: boolean; daysSince: number | null } => {
    const plan = commPlans.find((c) => c.projectStakeholderId === projectStakeholderId);
    if (!plan) return { isOverdue: false, daysSince: null };
    if (!plan.lastContactDate) return { isOverdue: true, daysSince: null };

    const expectedDays: Record<string, number> = {
      daily: 1,
      weekly: 7,
      biweekly: 14,
      monthly: 30,
      quarterly: 90,
      'as-needed': 30,
    };

    const daysSince = Math.floor(
      (new Date().getTime() - new Date(plan.lastContactDate).getTime()) / (1000 * 60 * 60 * 24)
    );
    const expected = expectedDays[plan.frequency] || 30;

    return { isOverdue: daysSince > expected, daysSince };
  };

  if (!currentProjectId) {
    return null;
  }

  return (
    <div
      className={cn(
        'border-t border-border/50 bg-card/30 transition-all duration-300',
        expanded ? 'h-64' : 'h-11'
      )}
    >
      {/* Header */}
      <div className="flex h-11 items-center justify-between border-b border-border/50 px-6">
        <div className="flex items-center gap-6">
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            {expanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronUp className="h-4 w-4" />
            )}
            <Users className="h-4 w-4" />
            Stakeholders
            <Badge variant="secondary" className="ml-1 bg-muted text-muted-foreground">
              {projectStakeholders.length}
            </Badge>
          </button>

          {expanded && (
            <>
              <div className="h-4 w-px bg-border/50" />
              <button
                onClick={() => setWorkstreamDialogOpen(true)}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <Briefcase className="h-4 w-4" />
                Workstreams
                <Badge variant="outline" className="ml-1 border-border/50">
                  {workstreams.length}
                </Badge>
              </button>
            </>
          )}
        </div>

        {expanded && (
          <div className="flex items-center gap-2">
            <SavedFiltersDropdown
              currentFilters={filters}
              onApplyFilter={setFilters}
            />
            <div className="relative">
              <Search className="absolute left-2.5 top-2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-8 w-36 pl-9 bg-background/50 border-border/50 text-sm"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setBulkOpsOpen(true)}
              className="gap-2 h-8 border-border/50"
            >
              <ListChecks className="h-3.5 w-3.5" />
              Bulk
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAssignmentDialogOpen(true)}
              className="gap-2 h-8 border-border/50"
            >
              <UserPlus className="h-3.5 w-3.5" />
              Assign
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAiQuickAddOpen(true)}
              className="gap-2 h-8 border-border/50"
            >
              <Sparkles className="h-3.5 w-3.5" />
              AI Add
            </Button>
            <Button size="sm" onClick={handleNewStakeholder} className="gap-2 h-8">
              <Plus className="h-3.5 w-3.5" />
              New
            </Button>
          </div>
        )}
      </div>

      {/* Content */}
      {expanded && (
        <ScrollArea className="h-[calc(100%-2.75rem)]">
          <div className="grid grid-cols-1 gap-2 p-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {filteredStakeholders.map((stakeholder) => {
              const commStatus = getCommStatus(stakeholder.projectStakeholderId);
              return (
                <StakeholderCard
                  key={stakeholder.id}
                  stakeholder={stakeholder}
                  onEdit={() => handleEditStakeholder(stakeholder)}
                  onOpenEngagement={(e) =>
                    handleOpenEngagementLog(stakeholder.projectStakeholderId, stakeholder.name, e)
                  }
                  isOverdue={commStatus.isOverdue}
                  daysSinceContact={commStatus.daysSince}
                  anonymousMode={anonymousMode}
                />
              );
            })}
            {filteredStakeholders.length === 0 && (
              <div className="col-span-full flex flex-col items-center justify-center py-8 text-center">
                <Users className="mb-2 h-8 w-8 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">
                  {search
                    ? 'No stakeholders match your search'
                    : 'No stakeholders assigned to this project'}
                </p>
                <Button
                  variant="link"
                  size="sm"
                  onClick={() => setAssignmentDialogOpen(true)}
                  className="mt-2 text-primary"
                >
                  Assign stakeholders
                </Button>
              </div>
            )}
          </div>
        </ScrollArea>
      )}

      {/* Dialogs */}
      <StakeholderDialog
        open={stakeholderDialogOpen}
        onOpenChange={setStakeholderDialogOpen}
        stakeholder={editingStakeholder}
      />
      <AssignmentDialog
        open={assignmentDialogOpen}
        onOpenChange={setAssignmentDialogOpen}
        unassignedStakeholders={unassignedStakeholders}
      />
      <WorkstreamDialog
        open={workstreamDialogOpen}
        onOpenChange={setWorkstreamDialogOpen}
      />
      {selectedForEngagement && (
        <EngagementLogDialog
          open={engagementDialogOpen}
          onOpenChange={setEngagementDialogOpen}
          projectStakeholderId={selectedForEngagement.projectStakeholderId}
          stakeholderName={selectedForEngagement.name}
        />
      )}
      <AIQuickAddDialog open={aiQuickAddOpen} onOpenChange={setAiQuickAddOpen} />
      <BulkOperationsDialog open={bulkOpsOpen} onOpenChange={setBulkOpsOpen} />
    </div>
  );
}

interface StakeholderCardProps {
  stakeholder: Stakeholder & { projectFunction: string; projectStakeholderId: string };
  onEdit: () => void;
  onOpenEngagement: (e: React.MouseEvent) => void;
  isOverdue: boolean;
  daysSinceContact: number | null;
  anonymousMode: boolean;
}

function StakeholderCard({
  stakeholder,
  onEdit,
  onOpenEngagement,
  isOverdue,
  daysSinceContact,
  anonymousMode,
}: StakeholderCardProps) {
  const displayName = getDisplayName(stakeholder.name, anonymousMode, stakeholder.jobTitle);
  const influenceColors = {
    high: 'text-amber-400',
    medium: 'text-blue-400',
    low: 'text-muted-foreground',
  };

  const supportColors = {
    champion: 'border-l-emerald-500',
    supporter: 'border-l-blue-500',
    neutral: 'border-l-muted-foreground',
    resistant: 'border-l-amber-500',
  };

  return (
    <div
      className={cn(
        'group relative rounded-md border border-border/50 bg-card/50 p-3 transition-all hover:bg-card hover:border-border cursor-pointer border-l-2',
        supportColors[stakeholder.supportLevel],
        isOverdue && 'ring-1 ring-amber-500/50'
      )}
      onClick={onEdit}
    >
      {/* Overdue indicator */}
      {isOverdue && (
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-amber-500 animate-pulse" />
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">
              {daysSinceContact === null
                ? 'Never contacted'
                : `Last contact: ${daysSinceContact} days ago`}
            </p>
          </TooltipContent>
        </Tooltip>
      )}

      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <h4 className="truncate text-sm font-medium">{displayName}</h4>
          {!anonymousMode && (
            <>
              <p className="truncate text-xs text-muted-foreground">{stakeholder.jobTitle}</p>
              {stakeholder.department && (
                <p className="truncate text-xs text-muted-foreground/60">{stakeholder.department}</p>
              )}
            </>
          )}
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={onOpenEngagement}
          >
            <MessageSquare className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
          >
            <Settings2 className="h-3 w-3" />
          </Button>
        </div>
      </div>
      <div className="mt-2 flex items-center gap-2 text-[10px]">
        <span className={cn('uppercase tracking-wider', influenceColors[stakeholder.influenceLevel])}>
          {stakeholder.influenceLevel}
        </span>
        <span className="text-muted-foreground/50">•</span>
        <span className="text-muted-foreground capitalize">{stakeholder.supportLevel}</span>
        {isOverdue && (
          <>
            <span className="text-muted-foreground/50">•</span>
            <span className="text-amber-500 flex items-center gap-0.5">
              <Clock className="h-2.5 w-2.5" />
              overdue
            </span>
          </>
        )}
      </div>
    </div>
  );
}
