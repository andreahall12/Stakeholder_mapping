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
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Edit2, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TagsManagerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const TAG_COLORS = [
  '#ef4444', // red
  '#f97316', // orange
  '#eab308', // yellow
  '#22c55e', // green
  '#14b8a6', // teal
  '#3b82f6', // blue
  '#6366f1', // indigo
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#6b7280', // gray
];

export function TagsManagerDialog({ open, onOpenChange }: TagsManagerDialogProps) {
  const { tags, createTag, updateTag, deleteTag } = useStore();
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#6366f1');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('');

  const handleCreateTag = () => {
    if (!newTagName.trim()) return;
    createTag(newTagName.trim(), newTagColor);
    setNewTagName('');
    setNewTagColor('#6366f1');
  };

  const handleStartEdit = (id: string, name: string, color: string) => {
    setEditingId(id);
    setEditName(name);
    setEditColor(color);
  };

  const handleSaveEdit = () => {
    if (!editingId || !editName.trim()) return;
    updateTag(editingId, editName.trim(), editColor);
    setEditingId(null);
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this tag? It will be removed from all stakeholders.')) {
      deleteTag(id);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Manage Tags</DialogTitle>
          <DialogDescription>
            Create and manage tags to categorize stakeholders
          </DialogDescription>
        </DialogHeader>

        {/* Create New Tag */}
        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <Label className="text-sm">New Tag</Label>
            <Input
              placeholder="Tag name (e.g., Steering Committee)"
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateTag()}
            />
          </div>
          <div className="flex gap-1">
            {TAG_COLORS.slice(0, 5).map((color) => (
              <button
                key={color}
                className={cn(
                  'h-8 w-8 rounded-md transition-all',
                  newTagColor === color && 'ring-2 ring-offset-2 ring-offset-background ring-white'
                )}
                style={{ backgroundColor: color }}
                onClick={() => setNewTagColor(color)}
              />
            ))}
          </div>
          <Button onClick={handleCreateTag} disabled={!newTagName.trim()}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {/* More Colors */}
        <div className="flex gap-1 justify-end">
          {TAG_COLORS.slice(5).map((color) => (
            <button
              key={color}
              className={cn(
                'h-6 w-6 rounded transition-all',
                newTagColor === color && 'ring-2 ring-offset-1 ring-offset-background ring-white'
              )}
              style={{ backgroundColor: color }}
              onClick={() => setNewTagColor(color)}
            />
          ))}
        </div>

        {/* Tag List */}
        <ScrollArea className="max-h-64">
          <div className="space-y-2">
            {tags.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">
                No tags created yet
              </p>
            )}
            {tags.map((tag) => (
              <div
                key={tag.id}
                className="flex items-center gap-2 p-2 rounded-lg border hover:bg-muted/30"
              >
                {editingId === tag.id ? (
                  <>
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="flex-1 h-8"
                      autoFocus
                    />
                    <div className="flex gap-1">
                      {TAG_COLORS.map((color) => (
                        <button
                          key={color}
                          className={cn(
                            'h-5 w-5 rounded transition-all',
                            editColor === color && 'ring-2 ring-offset-1 ring-offset-background ring-white'
                          )}
                          style={{ backgroundColor: color }}
                          onClick={() => setEditColor(color)}
                        />
                      ))}
                    </div>
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={handleSaveEdit}>
                      <Check className="h-3 w-3" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7"
                      onClick={() => setEditingId(null)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </>
                ) : (
                  <>
                    <Badge
                      className="px-2 py-0.5"
                      style={{ backgroundColor: tag.color, color: 'white' }}
                    >
                      {tag.name}
                    </Badge>
                    <div className="flex-1" />
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7"
                      onClick={() => handleStartEdit(tag.id, tag.name, tag.color)}
                    >
                      <Edit2 className="h-3 w-3" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={() => handleDelete(tag.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
