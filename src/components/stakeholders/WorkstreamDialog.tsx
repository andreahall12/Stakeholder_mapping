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
import { Plus, Trash2, Briefcase } from 'lucide-react';

interface WorkstreamDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function WorkstreamDialog({ open, onOpenChange }: WorkstreamDialogProps) {
  const { currentProjectId, workstreams, createWorkstream, deleteWorkstream } =
    useStore();
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');

  const handleAdd = () => {
    if (!newName.trim() || !currentProjectId) return;
    createWorkstream({
      projectId: currentProjectId,
      name: newName,
      description: newDescription,
    });
    setNewName('');
    setNewDescription('');
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this workstream? RACI assignments will be removed.')) {
      deleteWorkstream(id);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Manage Workstreams</DialogTitle>
          <DialogDescription>
            Workstreams are used to assign RACI roles for different areas of work.
          </DialogDescription>
        </DialogHeader>

        {/* Current Workstreams */}
        <div>
          <Label className="text-xs text-muted-foreground">
            Current Workstreams ({workstreams.length})
          </Label>
          <ScrollArea className="mt-2 h-48 rounded-md border">
            <div className="p-2 space-y-1">
              {workstreams.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Briefcase className="mb-2 h-8 w-8 text-muted-foreground/50" />
                  <p className="text-sm text-muted-foreground">
                    No workstreams defined yet
                  </p>
                </div>
              ) : (
                workstreams.map((ws) => (
                  <div
                    key={ws.id}
                    className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2"
                  >
                    <div>
                      <span className="font-medium">{ws.name}</span>
                      {ws.description && (
                        <p className="text-xs text-muted-foreground">
                          {ws.description}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={() => handleDelete(ws.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Add New */}
        <div className="space-y-3 border-t pt-4">
          <Label>Add New Workstream</Label>
          <div className="grid gap-2">
            <Input
              placeholder="Workstream name (e.g., Design, Engineering)"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
            <Input
              placeholder="Description (optional)"
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
            />
            <Button
              onClick={handleAdd}
              disabled={!newName.trim()}
              className="w-full"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Workstream
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

