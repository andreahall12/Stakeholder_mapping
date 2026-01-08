import { useEffect, useState } from 'react';
import { useStore } from '@/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trash2, Plus, X, Link2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Stakeholder, Tag, RelationshipType, RelationshipStrength } from '@/types';
import { tagsRepo, relationshipsRepo } from '@/db/database';

interface StakeholderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stakeholder: Stakeholder | null;
}

export function StakeholderDialog({
  open,
  onOpenChange,
  stakeholder,
}: StakeholderDialogProps) {
  const {
    createStakeholder,
    updateStakeholder,
    deleteStakeholder,
    currentProjectId,
    assignStakeholder,
    tags,
    addTagToStakeholder,
    removeTagFromStakeholder,
    stakeholders,
    createRelationship,
    deleteRelationship,
    loadRelationships,
  } = useStore();

  const [formData, setFormData] = useState({
    name: '',
    jobTitle: '',
    department: '',
    email: '',
    slack: '',
    influenceLevel: 'medium' as 'high' | 'medium' | 'low',
    supportLevel: 'neutral' as 'champion' | 'supporter' | 'neutral' | 'resistant',
    notes: '',
  });

  const [stakeholderTags, setStakeholderTags] = useState<Tag[]>([]);
  const [stakeholderRelationships, setStakeholderRelationships] = useState<
    { id: string; toId: string; toName: string; type: RelationshipType; strength: RelationshipStrength }[]
  >([]);
  const [newRelTarget, setNewRelTarget] = useState('');
  const [newRelType, setNewRelType] = useState<RelationshipType>('influences');
  const [newRelStrength, setNewRelStrength] = useState<RelationshipStrength>('moderate');

  useEffect(() => {
    if (stakeholder) {
      setFormData({
        name: stakeholder.name,
        jobTitle: stakeholder.jobTitle,
        department: stakeholder.department,
        email: stakeholder.email,
        slack: stakeholder.slack,
        influenceLevel: stakeholder.influenceLevel,
        supportLevel: stakeholder.supportLevel,
        notes: stakeholder.notes,
      });
      // Load tags
      const sTags = tagsRepo.getByStakeholder(stakeholder.id);
      setStakeholderTags(sTags);
      // Load relationships
      const rels = relationshipsRepo.getByStakeholder(stakeholder.id);
      const formatted = rels
        .filter((r) => r.fromStakeholderId === stakeholder.id)
        .map((r) => ({
          id: r.id,
          toId: r.toStakeholderId,
          toName: r.toName,
          type: r.type,
          strength: r.strength,
        }));
      setStakeholderRelationships(formatted);
    } else {
      setFormData({
        name: '',
        jobTitle: '',
        department: '',
        email: '',
        slack: '',
        influenceLevel: 'medium',
        supportLevel: 'neutral',
        notes: '',
      });
      setStakeholderTags([]);
      setStakeholderRelationships([]);
    }
  }, [stakeholder, open]);

  const handleSubmit = () => {
    if (!formData.name.trim()) return;

    if (stakeholder) {
      updateStakeholder(stakeholder.id, formData);
    } else {
      const newStakeholder = createStakeholder(formData);
      // Auto-assign to current project
      if (currentProjectId) {
        assignStakeholder(newStakeholder.id, currentProjectId, '');
      }
    }
    onOpenChange(false);
  };

  const handleDelete = () => {
    if (stakeholder && confirm('Are you sure you want to delete this stakeholder?')) {
      deleteStakeholder(stakeholder.id);
      onOpenChange(false);
    }
  };

  const handleToggleTag = (tag: Tag) => {
    if (!stakeholder) return;
    const hasTag = stakeholderTags.some((t) => t.id === tag.id);
    if (hasTag) {
      removeTagFromStakeholder(stakeholder.id, tag.id);
      setStakeholderTags(stakeholderTags.filter((t) => t.id !== tag.id));
    } else {
      addTagToStakeholder(stakeholder.id, tag.id);
      setStakeholderTags([...stakeholderTags, tag]);
    }
  };

  const handleAddRelationship = () => {
    if (!stakeholder || !newRelTarget) return;
    createRelationship({
      fromStakeholderId: stakeholder.id,
      toStakeholderId: newRelTarget,
      type: newRelType,
      strength: newRelStrength,
    });
    // Refresh relationships
    const rels = relationshipsRepo.getByStakeholder(stakeholder.id);
    const formatted = rels
      .filter((r) => r.fromStakeholderId === stakeholder.id)
      .map((r) => ({
        id: r.id,
        toId: r.toStakeholderId,
        toName: r.toName,
        type: r.type,
        strength: r.strength,
      }));
    setStakeholderRelationships(formatted);
    setNewRelTarget('');
  };

  const handleRemoveRelationship = (id: string) => {
    deleteRelationship(id);
    setStakeholderRelationships(stakeholderRelationships.filter((r) => r.id !== id));
  };

  const otherStakeholders = stakeholders.filter((s) => s.id !== stakeholder?.id);

  const relationshipTypeLabels: Record<RelationshipType, string> = {
    reports_to: 'Reports To',
    influences: 'Influences',
    allied_with: 'Allied With',
    conflicts_with: 'Conflicts With',
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {stakeholder ? 'Edit Stakeholder' : 'Add New Stakeholder'}
          </DialogTitle>
          <DialogDescription>
            {stakeholder
              ? 'Update stakeholder information and attributes.'
              : 'Add a new stakeholder to track in your projects.'}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="basic" className="mt-2 flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basic">Basic</TabsTrigger>
            <TabsTrigger value="contact">Contact</TabsTrigger>
            <TabsTrigger value="attributes">Attributes</TabsTrigger>
            {stakeholder && <TabsTrigger value="relations">Relations</TabsTrigger>}
            {!stakeholder && <TabsTrigger value="attributes" disabled className="opacity-50">Relations</TabsTrigger>}
          </TabsList>

          <div className="flex-1 overflow-y-auto">
            <TabsContent value="basic" className="space-y-4 pt-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  placeholder="Full name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="jobTitle">Job Title</Label>
                <Input
                  id="jobTitle"
                  placeholder="e.g., Senior Product Manager"
                  value={formData.jobTitle}
                  onChange={(e) =>
                    setFormData({ ...formData, jobTitle: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="department">Department</Label>
                <Input
                  id="department"
                  placeholder="e.g., Engineering, Marketing"
                  value={formData.department}
                  onChange={(e) =>
                    setFormData({ ...formData, department: e.target.value })
                  }
                />
              </div>
            </TabsContent>

            <TabsContent value="contact" className="space-y-4 pt-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="email@company.com"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="slack">Slack Handle</Label>
                <Input
                  id="slack"
                  placeholder="@username"
                  value={formData.slack}
                  onChange={(e) =>
                    setFormData({ ...formData, slack: e.target.value })
                  }
                />
              </div>
            </TabsContent>

            <TabsContent value="attributes" className="space-y-4 pt-4">
              <div className="grid gap-2">
                <Label>Influence Level</Label>
                <Select
                  value={formData.influenceLevel}
                  onValueChange={(value: 'high' | 'medium' | 'low') =>
                    setFormData({ ...formData, influenceLevel: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">High - Key decision maker</SelectItem>
                    <SelectItem value="medium">Medium - Significant input</SelectItem>
                    <SelectItem value="low">Low - Limited influence</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Support Level</Label>
                <Select
                  value={formData.supportLevel}
                  onValueChange={(
                    value: 'champion' | 'supporter' | 'neutral' | 'resistant'
                  ) => setFormData({ ...formData, supportLevel: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="champion">Champion - Active advocate</SelectItem>
                    <SelectItem value="supporter">Supporter - Generally positive</SelectItem>
                    <SelectItem value="neutral">Neutral - No strong opinion</SelectItem>
                    <SelectItem value="resistant">Resistant - Has concerns</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Tags */}
              {stakeholder && (
                <div className="grid gap-2">
                  <Label>Tags</Label>
                  <div className="flex flex-wrap gap-2">
                    {tags.length === 0 && (
                      <span className="text-xs text-muted-foreground">No tags created yet</span>
                    )}
                    {tags.map((tag) => {
                      const isActive = stakeholderTags.some((t) => t.id === tag.id);
                      return (
                        <button
                          key={tag.id}
                          onClick={() => handleToggleTag(tag)}
                          className={cn(
                            'px-2 py-1 rounded-md text-xs transition-all border',
                            isActive
                              ? 'text-white border-transparent'
                              : 'bg-transparent border-border text-muted-foreground hover:text-foreground'
                          )}
                          style={isActive ? { backgroundColor: tag.color } : undefined}
                        >
                          {tag.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="grid gap-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Additional notes about this stakeholder..."
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  rows={3}
                />
              </div>
            </TabsContent>

            {stakeholder && (
              <TabsContent value="relations" className="space-y-4 pt-4">
                <p className="text-sm text-muted-foreground">
                  Define relationships with other stakeholders to map influence networks.
                </p>

                {/* Add Relationship */}
                <div className="flex gap-2 items-end">
                  <div className="flex-1">
                    <Label className="text-xs">Person</Label>
                    <Select value={newRelTarget} onValueChange={setNewRelTarget}>
                      <SelectTrigger className="h-8">
                        <SelectValue placeholder="Select stakeholder..." />
                      </SelectTrigger>
                      <SelectContent>
                        {otherStakeholders.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Type</Label>
                    <Select value={newRelType} onValueChange={(v) => setNewRelType(v as RelationshipType)}>
                      <SelectTrigger className="h-8 w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="reports_to">Reports To</SelectItem>
                        <SelectItem value="influences">Influences</SelectItem>
                        <SelectItem value="allied_with">Allied With</SelectItem>
                        <SelectItem value="conflicts_with">Conflicts With</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button size="sm" className="h-8" onClick={handleAddRelationship} disabled={!newRelTarget}>
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>

                {/* Relationship List */}
                <div className="space-y-2">
                  {stakeholderRelationships.length === 0 && (
                    <p className="text-xs text-muted-foreground text-center py-4">
                      No relationships defined
                    </p>
                  )}
                  {stakeholderRelationships.map((rel) => (
                    <div
                      key={rel.id}
                      className="flex items-center gap-2 p-2 rounded-lg border bg-muted/30"
                    >
                      <Link2 className="h-3 w-3 text-muted-foreground" />
                      <span className="text-sm font-medium">{relationshipTypeLabels[rel.type]}</span>
                      <span className="text-sm text-muted-foreground">→</span>
                      <span className="text-sm">{rel.toName}</span>
                      <Badge variant="outline" className="text-[10px] ml-auto">
                        {rel.strength}
                      </Badge>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6"
                        onClick={() => handleRemoveRelationship(rel.id)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </TabsContent>
            )}
          </div>
        </Tabs>

        <DialogFooter className="mt-4">
          {stakeholder && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              className="mr-auto"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          )}
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!formData.name.trim()}>
            {stakeholder ? 'Save Changes' : 'Add Stakeholder'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
