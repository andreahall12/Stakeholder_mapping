import { useEffect, useState } from 'react';
import { useStore } from '@/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { Trash2 } from 'lucide-react';
import type { Stakeholder } from '@/types';

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
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

        <Tabs defaultValue="basic" className="mt-2">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="contact">Contact</TabsTrigger>
            <TabsTrigger value="attributes">Attributes</TabsTrigger>
          </TabsList>

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

