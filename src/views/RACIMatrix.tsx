import { useState } from 'react';
import { useStore } from '@/store';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { Plus, X } from 'lucide-react';
import type { RACIRole, CommunicationChannel, CommunicationFrequency } from '@/types';

export function RACIMatrix() {
  const {
    currentProjectId,
    projectStakeholders,
    workstreams,
    raciAssignments,
    commPlans,
    setRACIRole,
    removeRACIRole,
    setCommPlan,
  } = useStore();

  const [selectedCell, setSelectedCell] = useState<{
    projectStakeholderId: string;
    workstreamId: string;
    stakeholderName: string;
    workstreamName: string;
  } | null>(null);

  const [commDialogOpen, setCommDialogOpen] = useState(false);
  const [selectedStakeholder, setSelectedStakeholder] = useState<{
    projectStakeholderId: string;
    name: string;
  } | null>(null);

  if (!currentProjectId) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">Select a project to view the RACI matrix</p>
      </div>
    );
  }

  if (workstreams.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">No workstreams defined</p>
          <p className="text-sm text-muted-foreground/70">
            Add workstreams from the stakeholder panel to create a RACI matrix
          </p>
        </div>
      </div>
    );
  }

  if (projectStakeholders.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">No stakeholders assigned to this project</p>
      </div>
    );
  }

  const getRole = (projectStakeholderId: string, workstreamId: string): RACIRole | null => {
    const assignment = raciAssignments.find(
      (r) =>
        r.projectStakeholderId === projectStakeholderId && r.workstreamId === workstreamId
    );
    return assignment?.role as RACIRole || null;
  };

  const getCommPlan = (stakeholderId: string) => {
    const ps = projectStakeholders.find((s) => s.id === stakeholderId);
    if (!ps) return null;
    return commPlans.find((c) => c.projectStakeholderId === ps.projectStakeholderId);
  };

  const handleCellClick = (
    projectStakeholderId: string,
    workstreamId: string,
    stakeholderName: string,
    workstreamName: string
  ) => {
    setSelectedCell({
      projectStakeholderId,
      workstreamId,
      stakeholderName,
      workstreamName,
    });
  };

  const handleRoleSelect = (role: RACIRole | 'clear') => {
    if (!selectedCell) return;
    if (role === 'clear') {
      removeRACIRole(selectedCell.projectStakeholderId, selectedCell.workstreamId);
    } else {
      setRACIRole(selectedCell.projectStakeholderId, selectedCell.workstreamId, role);
    }
    setSelectedCell(null);
  };

  const handleCommClick = (projectStakeholderId: string, name: string) => {
    setSelectedStakeholder({ projectStakeholderId, name });
    setCommDialogOpen(true);
  };

  const roleColors: Record<RACIRole, string> = {
    R: 'bg-responsible hover:bg-responsible/90',
    A: 'bg-accountable hover:bg-accountable/90',
    C: 'bg-consulted hover:bg-consulted/90',
    I: 'bg-informed hover:bg-informed/90',
  };

  return (
    <div className="flex h-full flex-col p-4">
      <div className="mb-4">
        <h2 className="text-lg font-semibold">RACI Matrix</h2>
        <p className="text-sm text-muted-foreground">
          Click cells to assign roles. R = Responsible, A = Accountable, C = Consulted, I = Informed
        </p>
      </div>

      <ScrollArea className="flex-1" orientation="both">
        <div className="min-w-max">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="sticky left-0 z-10 min-w-[180px] border-b-2 bg-background p-2 text-left text-sm font-semibold">
                  Workstream
                </th>
                {projectStakeholders.map((s) => (
                  <th
                    key={s.id}
                    className="min-w-[120px] border-b-2 bg-background p-2 text-center text-sm font-semibold"
                  >
                    <div className="flex flex-col items-center gap-1">
                      <span className="truncate max-w-[100px]">{s.name}</span>
                      <button
                        onClick={() =>
                          handleCommClick(s.projectStakeholderId, s.name)
                        }
                        className="text-xs text-muted-foreground hover:text-primary"
                      >
                        {getCommPlan(s.id)?.frequency || 'Set comm plan'}
                      </button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {workstreams.map((ws) => (
                <tr key={ws.id} className="hover:bg-muted/30">
                  <td className="sticky left-0 z-10 border-b bg-background p-2 text-sm font-medium">
                    {ws.name}
                    {ws.description && (
                      <p className="text-xs text-muted-foreground font-normal">
                        {ws.description}
                      </p>
                    )}
                  </td>
                  {projectStakeholders.map((s) => {
                    const role = getRole(s.projectStakeholderId, ws.id);
                    return (
                      <td
                        key={`${ws.id}-${s.id}`}
                        className="border-b p-1 text-center"
                      >
                        <button
                          onClick={() =>
                            handleCellClick(
                              s.projectStakeholderId,
                              ws.id,
                              s.name,
                              ws.name
                            )
                          }
                          className={cn(
                            'flex h-10 w-full items-center justify-center rounded-md text-sm font-bold text-white transition-colors',
                            role
                              ? roleColors[role]
                              : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                          )}
                        >
                          {role || <Plus className="h-4 w-4 opacity-50" />}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ScrollArea>

      {/* Role Selection Popover */}
      <Dialog open={!!selectedCell} onOpenChange={() => setSelectedCell(null)}>
        <DialogContent className="max-w-xs">
          <DialogHeader>
            <DialogTitle>Set RACI Role</DialogTitle>
            <DialogDescription>
              {selectedCell?.stakeholderName} for {selectedCell?.workstreamName}
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-2">
            {(['R', 'A', 'C', 'I'] as RACIRole[]).map((role) => (
              <Button
                key={role}
                variant="outline"
                className={cn('h-16 text-lg font-bold', roleColors[role], 'text-white')}
                onClick={() => handleRoleSelect(role)}
              >
                {role}
                <span className="ml-2 text-xs font-normal">
                  {role === 'R'
                    ? 'Responsible'
                    : role === 'A'
                    ? 'Accountable'
                    : role === 'C'
                    ? 'Consulted'
                    : 'Informed'}
                </span>
              </Button>
            ))}
          </div>
          <Button
            variant="ghost"
            onClick={() => handleRoleSelect('clear')}
            className="w-full text-muted-foreground"
          >
            <X className="mr-2 h-4 w-4" />
            Clear Role
          </Button>
        </DialogContent>
      </Dialog>

      {/* Communication Plan Dialog */}
      <CommPlanDialog
        open={commDialogOpen}
        onOpenChange={setCommDialogOpen}
        stakeholder={selectedStakeholder}
        currentPlan={
          selectedStakeholder
            ? commPlans.find(
                (c) => c.projectStakeholderId === selectedStakeholder.projectStakeholderId
              )
            : undefined
        }
        onSave={(channel, frequency, notes) => {
          if (selectedStakeholder) {
            setCommPlan(selectedStakeholder.projectStakeholderId, channel, frequency, notes);
          }
          setCommDialogOpen(false);
        }}
      />
    </div>
  );
}

interface CommPlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stakeholder: { projectStakeholderId: string; name: string } | null;
  currentPlan?: { channel: CommunicationChannel; frequency: CommunicationFrequency; notes: string };
  onSave: (channel: CommunicationChannel, frequency: CommunicationFrequency, notes: string) => void;
}

function CommPlanDialog({ open, onOpenChange, stakeholder, currentPlan, onSave }: CommPlanDialogProps) {
  const [channel, setChannel] = useState<CommunicationChannel>(currentPlan?.channel || 'email');
  const [frequency, setFrequency] = useState<CommunicationFrequency>(currentPlan?.frequency || 'weekly');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Communication Plan</DialogTitle>
          <DialogDescription>
            Set how to communicate with {stakeholder?.name}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid gap-2">
            <label className="text-sm font-medium">Channel</label>
            <Select value={channel} onValueChange={(v) => setChannel(v as CommunicationChannel)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="slack">Slack</SelectItem>
                <SelectItem value="jira">Jira Updates</SelectItem>
                <SelectItem value="briefing">Briefing</SelectItem>
                <SelectItem value="meeting">Meeting</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium">Frequency</label>
            <Select value={frequency} onValueChange={(v) => setFrequency(v as CommunicationFrequency)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="biweekly">Bi-weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="quarterly">Quarterly</SelectItem>
                <SelectItem value="as-needed">As Needed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={() => onSave(channel, frequency, '')}>
            Save Plan
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

