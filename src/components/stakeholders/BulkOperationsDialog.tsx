import { useState } from 'react';
import { useStore } from '@/store';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Trash2, Tags, UserMinus, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Stakeholder } from '@/types';

interface BulkOperationsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type BulkAction = 'update_support' | 'update_influence' | 'add_tag' | 'remove_tag' | 'unassign' | 'delete';

export function BulkOperationsDialog({ open, onOpenChange }: BulkOperationsDialogProps) {
  const {
    projectStakeholders,
    currentProjectId,
    updateStakeholder,
    deleteStakeholder,
    unassignStakeholder,
    tags,
    addTagToStakeholder,
    removeTagFromStakeholder,
  } = useStore();

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [action, setAction] = useState<BulkAction>('update_support');
  const [newValue, setNewValue] = useState('');
  const [confirming, setConfirming] = useState(false);

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedIds.size === projectStakeholders.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(projectStakeholders.map((s) => s.id)));
    }
  };

  const handleApply = () => {
    if (selectedIds.size === 0) return;

    if ((action === 'delete' || action === 'unassign') && !confirming) {
      setConfirming(true);
      return;
    }

    const selectedStakeholders = projectStakeholders.filter((s) => selectedIds.has(s.id));

    switch (action) {
      case 'update_support':
        if (newValue) {
          selectedStakeholders.forEach((s) => {
            updateStakeholder(s.id, { supportLevel: newValue as any });
          });
        }
        break;
      case 'update_influence':
        if (newValue) {
          selectedStakeholders.forEach((s) => {
            updateStakeholder(s.id, { influenceLevel: newValue as any });
          });
        }
        break;
      case 'add_tag':
        if (newValue) {
          selectedStakeholders.forEach((s) => {
            addTagToStakeholder(s.id, newValue);
          });
        }
        break;
      case 'remove_tag':
        if (newValue) {
          selectedStakeholders.forEach((s) => {
            removeTagFromStakeholder(s.id, newValue);
          });
        }
        break;
      case 'unassign':
        if (currentProjectId) {
          selectedStakeholders.forEach((s) => {
            unassignStakeholder(s.id, currentProjectId);
          });
        }
        break;
      case 'delete':
        selectedStakeholders.forEach((s) => {
          deleteStakeholder(s.id);
        });
        break;
    }

    setSelectedIds(new Set());
    setConfirming(false);
    onOpenChange(false);
  };

  const handleClose = () => {
    setSelectedIds(new Set());
    setConfirming(false);
    setAction('update_support');
    setNewValue('');
    onOpenChange(false);
  };

  const getActionLabel = () => {
    switch (action) {
      case 'update_support':
        return 'Update Support Level';
      case 'update_influence':
        return 'Update Influence Level';
      case 'add_tag':
        return 'Add Tag';
      case 'remove_tag':
        return 'Remove Tag';
      case 'unassign':
        return 'Unassign from Project';
      case 'delete':
        return 'Delete Stakeholders';
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Bulk Operations</DialogTitle>
          <DialogDescription>
            Select stakeholders and apply bulk actions
          </DialogDescription>
        </DialogHeader>

        {/* Select All */}
        <div className="flex items-center justify-between py-2 border-b">
          <div className="flex items-center gap-2">
            <Checkbox
              checked={selectedIds.size === projectStakeholders.length && projectStakeholders.length > 0}
              onCheckedChange={handleSelectAll}
            />
            <span className="text-sm">
              {selectedIds.size > 0 ? `${selectedIds.size} selected` : 'Select all'}
            </span>
          </div>
        </div>

        {/* Stakeholder List */}
        <ScrollArea className="flex-1 max-h-48">
          <div className="space-y-1 py-2">
            {projectStakeholders.map((s) => (
              <div
                key={s.id}
                className={cn(
                  'flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-muted/50',
                  selectedIds.has(s.id) && 'bg-primary/10'
                )}
                onClick={() => handleToggleSelect(s.id)}
              >
                <Checkbox checked={selectedIds.has(s.id)} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{s.name}</div>
                  <div className="text-xs text-muted-foreground truncate">
                    {s.jobTitle} · {s.influenceLevel} · {s.supportLevel}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* Action Selection */}
        {selectedIds.size > 0 && (
          <div className="space-y-4 pt-4 border-t">
            <div className="grid gap-2">
              <Label>Action</Label>
              <Select value={action} onValueChange={(v) => { setAction(v as BulkAction); setNewValue(''); setConfirming(false); }}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="update_support">Update Support Level</SelectItem>
                  <SelectItem value="update_influence">Update Influence Level</SelectItem>
                  <SelectItem value="add_tag">Add Tag</SelectItem>
                  <SelectItem value="remove_tag">Remove Tag</SelectItem>
                  <SelectItem value="unassign">Unassign from Project</SelectItem>
                  <SelectItem value="delete">Delete Stakeholders</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Action-specific options */}
            {action === 'update_support' && (
              <div className="grid gap-2">
                <Label>New Support Level</Label>
                <Select value={newValue} onValueChange={setNewValue}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select level..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="champion">Champion</SelectItem>
                    <SelectItem value="supporter">Supporter</SelectItem>
                    <SelectItem value="neutral">Neutral</SelectItem>
                    <SelectItem value="resistant">Resistant</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {action === 'update_influence' && (
              <div className="grid gap-2">
                <Label>New Influence Level</Label>
                <Select value={newValue} onValueChange={setNewValue}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select level..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {(action === 'add_tag' || action === 'remove_tag') && (
              <div className="grid gap-2">
                <Label>Tag</Label>
                <Select value={newValue} onValueChange={setNewValue}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select tag..." />
                  </SelectTrigger>
                  <SelectContent>
                    {tags.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        <div className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: t.color }} />
                          {t.name}
                        </div>
                      </SelectItem>
                    ))}
                    {tags.length === 0 && (
                      <SelectItem value="_none" disabled>No tags available</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}

            {(action === 'unassign' || action === 'delete') && (
              <div className={cn(
                'p-3 rounded-lg',
                action === 'delete' ? 'bg-destructive/10 text-destructive' : 'bg-amber-500/10 text-amber-500'
              )}>
                <p className="text-sm">
                  {confirming
                    ? `Are you sure? This will ${action === 'delete' ? 'permanently delete' : 'unassign'} ${selectedIds.size} stakeholder(s).`
                    : `This will ${action === 'delete' ? 'permanently delete' : 'unassign from the current project'} the selected stakeholders.`}
                </p>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={handleApply}
            disabled={
              selectedIds.size === 0 ||
              (action === 'update_support' && !newValue) ||
              (action === 'update_influence' && !newValue) ||
              ((action === 'add_tag' || action === 'remove_tag') && !newValue)
            }
            variant={action === 'delete' ? 'destructive' : 'default'}
          >
            {confirming ? 'Confirm' : `Apply to ${selectedIds.size}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
