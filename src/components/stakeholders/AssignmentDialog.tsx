import { useState } from 'react';
import { useStore } from '@/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Search, UserPlus } from 'lucide-react';
import type { Stakeholder } from '@/types';

interface AssignmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  unassignedStakeholders: Stakeholder[];
}

export function AssignmentDialog({
  open,
  onOpenChange,
  unassignedStakeholders,
}: AssignmentDialogProps) {
  const { currentProjectId, assignStakeholder, projectStakeholders, unassignStakeholder } =
    useStore();
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [projectFunction, setProjectFunction] = useState('');

  const filteredUnassigned = unassignedStakeholders.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.jobTitle.toLowerCase().includes(search.toLowerCase())
  );

  const handleToggle = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleAssign = () => {
    if (!currentProjectId) return;
    selectedIds.forEach((stakeholderId) => {
      assignStakeholder(stakeholderId, currentProjectId, projectFunction);
    });
    setSelectedIds(new Set());
    setProjectFunction('');
    onOpenChange(false);
  };

  const handleUnassign = (stakeholderId: string) => {
    if (!currentProjectId) return;
    unassignStakeholder(stakeholderId, currentProjectId);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Manage Project Assignments</DialogTitle>
          <DialogDescription>
            Assign or remove stakeholders from this project.
          </DialogDescription>
        </DialogHeader>

        {/* Currently Assigned */}
        {projectStakeholders.length > 0 && (
          <div className="mb-4">
            <Label className="text-xs text-muted-foreground">
              Currently Assigned ({projectStakeholders.length})
            </Label>
            <ScrollArea className="mt-2 h-32 rounded-md border">
              <div className="p-2 space-y-1">
                {projectStakeholders.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between rounded-md px-2 py-1.5 hover:bg-muted"
                  >
                    <div>
                      <span className="text-sm font-medium">{s.name}</span>
                      <span className="ml-2 text-xs text-muted-foreground">
                        {s.jobTitle}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs text-destructive hover:text-destructive"
                      onClick={() => handleUnassign(s.id)}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* Unassigned Stakeholders */}
        <div>
          <Label className="text-xs text-muted-foreground">
            Available Stakeholders ({unassignedStakeholders.length})
          </Label>
          <div className="relative mt-2">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <ScrollArea className="mt-2 h-40 rounded-md border">
            <div className="p-2 space-y-1">
              {filteredUnassigned.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  {unassignedStakeholders.length === 0
                    ? 'All stakeholders are assigned'
                    : 'No matches found'}
                </p>
              ) : (
                filteredUnassigned.map((stakeholder) => (
                  <label
                    key={stakeholder.id}
                    className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-1.5 hover:bg-muted"
                  >
                    <Checkbox
                      checked={selectedIds.has(stakeholder.id)}
                      onCheckedChange={() => handleToggle(stakeholder.id)}
                    />
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium">{stakeholder.name}</span>
                      <span className="ml-2 text-xs text-muted-foreground">
                        {stakeholder.jobTitle}
                      </span>
                    </div>
                  </label>
                ))
              )}
            </div>
          </ScrollArea>
        </div>

        {selectedIds.size > 0 && (
          <div className="grid gap-2">
            <Label htmlFor="projectFunction">Project Function (optional)</Label>
            <Input
              id="projectFunction"
              placeholder="e.g., Technical Lead, Sponsor"
              value={projectFunction}
              onChange={(e) => setProjectFunction(e.target.value)}
            />
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          {selectedIds.size > 0 && (
            <Button onClick={handleAssign}>
              <UserPlus className="mr-2 h-4 w-4" />
              Assign {selectedIds.size} Stakeholder{selectedIds.size > 1 ? 's' : ''}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

