import { useState, useEffect } from 'react';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar, 
  Mail, 
  Phone, 
  Users, 
  FileText, 
  MessageSquare,
  ThumbsUp,
  Minus,
  ThumbsDown,
  Trash2,
  Plus,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { EngagementType, Sentiment, EngagementLog } from '@/types';
import { engagementLogsRepo } from '@/db/database';

interface EngagementLogDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectStakeholderId: string;
  stakeholderName: string;
}

const engagementTypeIcons: Record<EngagementType, React.ReactNode> = {
  meeting: <Users className="h-4 w-4" />,
  email: <Mail className="h-4 w-4" />,
  call: <Phone className="h-4 w-4" />,
  decision: <FileText className="h-4 w-4" />,
  note: <MessageSquare className="h-4 w-4" />,
};

const sentimentIcons: Record<Sentiment, React.ReactNode> = {
  positive: <ThumbsUp className="h-4 w-4" />,
  neutral: <Minus className="h-4 w-4" />,
  negative: <ThumbsDown className="h-4 w-4" />,
};

const sentimentColors: Record<Sentiment, string> = {
  positive: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/30',
  neutral: 'text-blue-500 bg-blue-500/10 border-blue-500/30',
  negative: 'text-amber-500 bg-amber-500/10 border-amber-500/30',
};

export function EngagementLogDialog({
  open,
  onOpenChange,
  projectStakeholderId,
  stakeholderName,
}: EngagementLogDialogProps) {
  const { addEngagementLog, deleteEngagementLog, currentProjectId, loadEngagementLogs, loadCommPlans } = useStore();
  const [logs, setLogs] = useState<EngagementLog[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    type: 'meeting' as EngagementType,
    summary: '',
    sentiment: 'neutral' as Sentiment,
  });

  useEffect(() => {
    if (open && projectStakeholderId) {
      const stakeholderLogs = engagementLogsRepo.getByProjectStakeholder(projectStakeholderId);
      setLogs(stakeholderLogs);
    }
  }, [open, projectStakeholderId]);

  const handleSubmit = () => {
    if (!formData.summary.trim()) return;

    addEngagementLog({
      projectStakeholderId,
      date: formData.date,
      type: formData.type,
      summary: formData.summary,
      sentiment: formData.sentiment,
    });

    // Refresh logs
    const stakeholderLogs = engagementLogsRepo.getByProjectStakeholder(projectStakeholderId);
    setLogs(stakeholderLogs);

    // Reset form
    setFormData({
      date: new Date().toISOString().split('T')[0],
      type: 'meeting',
      summary: '',
      sentiment: 'neutral',
    });
    setShowForm(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this engagement log?')) {
      deleteEngagementLog(id);
      const stakeholderLogs = engagementLogsRepo.getByProjectStakeholder(projectStakeholderId);
      setLogs(stakeholderLogs);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Engagement Log</DialogTitle>
          <DialogDescription>
            Track interactions with {stakeholderName}
          </DialogDescription>
        </DialogHeader>

        {/* Add New Entry Button */}
        {!showForm && (
          <Button
            variant="outline"
            onClick={() => setShowForm(true)}
            className="gap-2 w-full"
          >
            <Plus className="h-4 w-4" />
            Log New Interaction
          </Button>
        )}

        {/* Add Entry Form */}
        {showForm && (
          <div className="space-y-4 p-4 rounded-lg border bg-muted/30">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Date</Label>
                <Input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label>Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(v) => setFormData({ ...formData, type: v as EngagementType })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="meeting">Meeting</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="call">Call</SelectItem>
                    <SelectItem value="decision">Decision</SelectItem>
                    <SelectItem value="note">Note</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Sentiment</Label>
              <div className="flex gap-2">
                {(['positive', 'neutral', 'negative'] as Sentiment[]).map((s) => (
                  <Button
                    key={s}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setFormData({ ...formData, sentiment: s })}
                    className={cn(
                      'flex-1 gap-2',
                      formData.sentiment === s && sentimentColors[s]
                    )}
                  >
                    {sentimentIcons[s]}
                    <span className="capitalize">{s}</span>
                  </Button>
                ))}
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Summary</Label>
              <Textarea
                placeholder="What was discussed? Any key outcomes or action items?"
                value={formData.summary}
                onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={!formData.summary.trim()}>
                Add Entry
              </Button>
            </div>
          </div>
        )}

        {/* Engagement History */}
        <ScrollArea className="flex-1 -mx-6 px-6">
          <div className="space-y-3 py-2">
            {logs.length === 0 && !showForm && (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No engagement history yet</p>
              </div>
            )}

            {logs.map((log) => (
              <div
                key={log.id}
                className="group relative rounded-lg border p-3 hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
                    {engagementTypeIcons[log.type]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium capitalize">{log.type}</span>
                      <Badge
                        variant="outline"
                        className={cn('text-xs px-1.5 py-0', sentimentColors[log.sentiment])}
                      >
                        {log.sentiment}
                      </Badge>
                      <span className="text-xs text-muted-foreground ml-auto">
                        {new Date(log.date).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{log.summary}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-0 group-hover:opacity-100 shrink-0"
                    onClick={() => handleDelete(log.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
