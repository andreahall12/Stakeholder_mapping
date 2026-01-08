import { useState } from 'react';
import { useStore } from '@/store';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
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
import { Sparkles, Loader2, Check, X, Edit2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AIQuickAddDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ParsedStakeholder {
  name: string;
  jobTitle: string;
  department: string;
  email: string;
  slack: string;
  selected: boolean;
}

const OLLAMA_BASE_URL = 'http://localhost:11434';

export function AIQuickAddDialog({ open, onOpenChange }: AIQuickAddDialogProps) {
  const { createStakeholder, assignStakeholder, currentProjectId } = useStore();
  const [inputText, setInputText] = useState('');
  const [parsedResults, setParsedResults] = useState<ParsedStakeholder[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const handleParse = async () => {
    if (!inputText.trim()) return;

    setIsParsing(true);
    setError(null);
    setParsedResults([]);

    try {
      const prompt = `Extract stakeholder information from the following text. Return a JSON array of objects with these fields: name, jobTitle, department, email, slack.

If a field is not found, use an empty string. Extract as many stakeholders as you can find.

Text to parse:
${inputText}

Return ONLY valid JSON array, no other text. Example format:
[{"name": "John Smith", "jobTitle": "VP Engineering", "department": "Engineering", "email": "john@company.com", "slack": "@jsmith"}]`;

      const response = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'llama3.2',
          prompt,
          stream: false,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to connect to Ollama');
      }

      const data = await response.json();
      const responseText = data.response || '';

      // Try to extract JSON from response
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('Could not parse AI response');
      }

      const parsed = JSON.parse(jsonMatch[0]) as Partial<ParsedStakeholder>[];
      const results: ParsedStakeholder[] = parsed.map((p) => ({
        name: p.name || '',
        jobTitle: p.jobTitle || '',
        department: p.department || '',
        email: p.email || '',
        slack: p.slack || '',
        selected: true,
      })).filter((p) => p.name.trim() !== '');

      if (results.length === 0) {
        setError('No stakeholders found in the text');
      } else {
        setParsedResults(results);
      }
    } catch (err) {
      console.error('Parse error:', err);
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to parse text. Make sure Ollama is running.'
      );
    } finally {
      setIsParsing(false);
    }
  };

  const handleToggleSelect = (index: number) => {
    setParsedResults((prev) =>
      prev.map((p, i) => (i === index ? { ...p, selected: !p.selected } : p))
    );
  };

  const handleUpdateField = (index: number, field: keyof ParsedStakeholder, value: string) => {
    setParsedResults((prev) =>
      prev.map((p, i) => (i === index ? { ...p, [field]: value } : p))
    );
  };

  const handleImport = () => {
    const selected = parsedResults.filter((p) => p.selected);
    for (const p of selected) {
      const stakeholder = createStakeholder({
        name: p.name,
        jobTitle: p.jobTitle,
        department: p.department,
        email: p.email,
        slack: p.slack,
        influenceLevel: 'medium',
        supportLevel: 'neutral',
        notes: '',
      });
      if (currentProjectId) {
        assignStakeholder(stakeholder.id, currentProjectId, '');
      }
    }
    handleClose();
  };

  const handleClose = () => {
    setInputText('');
    setParsedResults([]);
    setError(null);
    setEditingIndex(null);
    onOpenChange(false);
  };

  const selectedCount = parsedResults.filter((p) => p.selected).length;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Quick Add
          </DialogTitle>
          <DialogDescription>
            Paste text containing stakeholder information and let AI extract the details.
          </DialogDescription>
        </DialogHeader>

        {parsedResults.length === 0 ? (
          // Input Step
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label>Paste stakeholder information</Label>
              <Textarea
                placeholder={`Paste email signatures, team lists, or any text containing stakeholder info...

Example:
Sarah Chen
VP of Engineering
sarah.chen@company.com
Slack: @schen

John Smith - Product Manager
john.smith@company.com`}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                rows={8}
                className="font-mono text-sm"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                <X className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}
          </div>
        ) : (
          // Results Step
          <ScrollArea className="flex-1">
            <div className="space-y-2 py-2">
              {parsedResults.map((result, index) => (
                <div
                  key={index}
                  className={cn(
                    'rounded-lg border p-3 transition-all',
                    result.selected ? 'border-primary/50 bg-primary/5' : 'border-border/50 opacity-60'
                  )}
                >
                  {editingIndex === index ? (
                    // Edit Mode
                    <div className="space-y-2">
                      <Input
                        placeholder="Name"
                        value={result.name}
                        onChange={(e) => handleUpdateField(index, 'name', e.target.value)}
                        className="h-8"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          placeholder="Job Title"
                          value={result.jobTitle}
                          onChange={(e) => handleUpdateField(index, 'jobTitle', e.target.value)}
                          className="h-8"
                        />
                        <Input
                          placeholder="Department"
                          value={result.department}
                          onChange={(e) => handleUpdateField(index, 'department', e.target.value)}
                          className="h-8"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          placeholder="Email"
                          value={result.email}
                          onChange={(e) => handleUpdateField(index, 'email', e.target.value)}
                          className="h-8"
                        />
                        <Input
                          placeholder="Slack"
                          value={result.slack}
                          onChange={(e) => handleUpdateField(index, 'slack', e.target.value)}
                          className="h-8"
                        />
                      </div>
                      <Button size="sm" onClick={() => setEditingIndex(null)}>
                        Done Editing
                      </Button>
                    </div>
                  ) : (
                    // View Mode
                    <div className="flex items-start gap-3">
                      <button
                        onClick={() => handleToggleSelect(index)}
                        className={cn(
                          'mt-1 h-4 w-4 rounded border shrink-0 flex items-center justify-center',
                          result.selected
                            ? 'bg-primary border-primary text-primary-foreground'
                            : 'border-muted-foreground'
                        )}
                      >
                        {result.selected && <Check className="h-3 w-3" />}
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium">{result.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {[result.jobTitle, result.department].filter(Boolean).join(' · ') || 'No details'}
                        </div>
                        {(result.email || result.slack) && (
                          <div className="text-xs text-muted-foreground mt-1">
                            {result.email && <span>{result.email}</span>}
                            {result.email && result.slack && <span> · </span>}
                            {result.slack && <span>{result.slack}</span>}
                          </div>
                        )}
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 shrink-0"
                        onClick={() => setEditingIndex(index)}
                      >
                        <Edit2 className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        )}

        <DialogFooter>
          {parsedResults.length === 0 ? (
            <>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={handleParse} disabled={!inputText.trim() || isParsing}>
                {isParsing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Parsing...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Parse with AI
                  </>
                )}
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => setParsedResults([])}>
                Back
              </Button>
              <Button onClick={handleImport} disabled={selectedCount === 0}>
                Import {selectedCount} Stakeholder{selectedCount !== 1 ? 's' : ''}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
