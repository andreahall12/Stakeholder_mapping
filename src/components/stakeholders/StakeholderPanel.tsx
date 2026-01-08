import { useState } from 'react';
import { useStore } from '@/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { StakeholderDialog } from './StakeholderDialog';
import { AssignmentDialog } from './AssignmentDialog';
import { WorkstreamDialog } from './WorkstreamDialog';
import {
  Plus,
  Search,
  UserPlus,
  Settings2,
  ChevronUp,
  ChevronDown,
  Users,
  Briefcase,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Stakeholder } from '@/types';

export function StakeholderPanel() {
  const {
    currentProjectId,
    projectStakeholders,
    stakeholders,
    workstreams,
  } = useStore();

  const [expanded, setExpanded] = useState(true);
  const [search, setSearch] = useState('');
  const [stakeholderDialogOpen, setStakeholderDialogOpen] = useState(false);
  const [assignmentDialogOpen, setAssignmentDialogOpen] = useState(false);
  const [workstreamDialogOpen, setWorkstreamDialogOpen] = useState(false);
  const [editingStakeholder, setEditingStakeholder] = useState<Stakeholder | null>(null);

  const filteredStakeholders = projectStakeholders.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.jobTitle.toLowerCase().includes(search.toLowerCase()) ||
      s.department.toLowerCase().includes(search.toLowerCase())
  );

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
            <div className="relative">
              <Search className="absolute left-2.5 top-2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-8 w-48 pl-9 bg-background/50 border-border/50 text-sm"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAssignmentDialogOpen(true)}
              className="gap-2 h-8 border-border/50"
            >
              <UserPlus className="h-3.5 w-3.5" />
              Assign
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
            {filteredStakeholders.map((stakeholder) => (
              <StakeholderCard
                key={stakeholder.id}
                stakeholder={stakeholder}
                onEdit={() => handleEditStakeholder(stakeholder)}
              />
            ))}
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
    </div>
  );
}

interface StakeholderCardProps {
  stakeholder: Stakeholder & { projectFunction: string; projectStakeholderId: string };
  onEdit: () => void;
}

function StakeholderCard({ stakeholder, onEdit }: StakeholderCardProps) {
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
        supportColors[stakeholder.supportLevel]
      )}
      onClick={onEdit}
    >
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <h4 className="truncate text-sm font-medium">{stakeholder.name}</h4>
          <p className="truncate text-xs text-muted-foreground">
            {stakeholder.jobTitle}
          </p>
          {stakeholder.department && (
            <p className="truncate text-xs text-muted-foreground/60">
              {stakeholder.department}
            </p>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 opacity-0 group-hover:opacity-100"
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
        >
          <Settings2 className="h-3 w-3" />
        </Button>
      </div>
      <div className="mt-2 flex items-center gap-2 text-[10px]">
        <span className={cn('uppercase tracking-wider', influenceColors[stakeholder.influenceLevel])}>
          {stakeholder.influenceLevel}
        </span>
        <span className="text-muted-foreground/50">•</span>
        <span className="text-muted-foreground capitalize">{stakeholder.supportLevel}</span>
      </div>
    </div>
  );
}
