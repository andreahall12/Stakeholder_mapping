import { useState, useCallback } from 'react';
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
import { 
  Upload, 
  FileSpreadsheet, 
  ArrowRight, 
  Check, 
  AlertCircle,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Step = 'upload' | 'mapping' | 'preview' | 'complete';

interface ParsedRow {
  [key: string]: string;
}

const STAKEHOLDER_FIELDS = [
  { key: 'name', label: 'Name', required: true },
  { key: 'jobTitle', label: 'Job Title', required: false },
  { key: 'department', label: 'Department', required: false },
  { key: 'email', label: 'Email', required: false },
  { key: 'slack', label: 'Slack Handle', required: false },
  { key: 'influenceLevel', label: 'Influence Level', required: false },
  { key: 'supportLevel', label: 'Support Level', required: false },
  { key: 'notes', label: 'Notes', required: false },
];

// Maximum allowed string length for imported fields
const MAX_FIELD_LENGTH = 500;

/**
 * Sanitize imported CSV values to prevent:
 * 1. CSV formula injection (=, +, -, @, tab, carriage return at start)
 * 2. Excessively long strings
 * 3. Control characters
 */
function sanitizeCSVValue(value: string | undefined | null): string {
  if (!value) return '';
  
  let sanitized = value.trim();
  
  // Remove control characters except newlines (which are handled by notes field)
  sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  
  // Prevent CSV formula injection - remove leading characters that could trigger formulas
  // when data is later exported to CSV/Excel
  if (/^[=+\-@\t\r]/.test(sanitized)) {
    sanitized = "'" + sanitized; // Prefix with single quote to neutralize formula
  }
  
  // Limit string length
  if (sanitized.length > MAX_FIELD_LENGTH) {
    sanitized = sanitized.substring(0, MAX_FIELD_LENGTH);
  }
  
  return sanitized;
}

export function ImportDialog({ open, onOpenChange }: ImportDialogProps) {
  const { createStakeholder, assignStakeholder, currentProjectId } = useStore();
  const [step, setStep] = useState<Step>('upload');
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvData, setCsvData] = useState<ParsedRow[]>([]);
  const [fieldMapping, setFieldMapping] = useState<Record<string, string>>({});
  const [assignToProject, setAssignToProject] = useState(true);
  const [importedCount, setImportedCount] = useState(0);
  const [errors, setErrors] = useState<string[]>([]);

  const resetState = () => {
    setStep('upload');
    setCsvHeaders([]);
    setCsvData([]);
    setFieldMapping({});
    setAssignToProject(true);
    setImportedCount(0);
    setErrors([]);
  };

  const handleClose = () => {
    resetState();
    onOpenChange(false);
  };

  const parseCSV = (text: string): { headers: string[]; rows: ParsedRow[] } => {
    const lines = text.split(/\r?\n/).filter(line => line.trim());
    if (lines.length === 0) return { headers: [], rows: [] };

    // Parse header
    const headers = parseCSVLine(lines[0]);

    // Parse rows
    const rows: ParsedRow[] = [];
    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
      const row: ParsedRow = {};
      headers.forEach((header, idx) => {
        row[header] = values[idx] || '';
      });
      rows.push(row);
    }

    return { headers, rows };
  };

  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const { headers, rows } = parseCSV(text);
      
      if (headers.length === 0 || rows.length === 0) {
        setErrors(['Could not parse CSV file. Please check the format.']);
        return;
      }

      setCsvHeaders(headers);
      setCsvData(rows);

      // Auto-map fields based on header names
      const autoMapping: Record<string, string> = {};
      headers.forEach(header => {
        const normalizedHeader = header.toLowerCase().replace(/[_\s-]/g, '');
        for (const field of STAKEHOLDER_FIELDS) {
          const normalizedField = field.key.toLowerCase();
          const normalizedLabel = field.label.toLowerCase().replace(/\s/g, '');
          if (
            normalizedHeader === normalizedField ||
            normalizedHeader === normalizedLabel ||
            normalizedHeader.includes(normalizedField) ||
            normalizedHeader.includes(normalizedLabel)
          ) {
            autoMapping[field.key] = header;
            break;
          }
        }
      });
      setFieldMapping(autoMapping);
      setStep('mapping');
    };
    reader.readAsText(file);
  }, []);

  const handleImport = () => {
    const newErrors: string[] = [];
    let count = 0;

    // Validate required fields are mapped
    if (!fieldMapping.name) {
      newErrors.push('Name field is required');
      setErrors(newErrors);
      return;
    }

    for (let i = 0; i < csvData.length; i++) {
      const row = csvData[i];
      try {
        // Sanitize the name field
        const name = sanitizeCSVValue(row[fieldMapping.name]);
        if (!name) {
          newErrors.push(`Row ${i + 2}: Missing name`);
          continue;
        }

        // Parse influence and support levels with validation
        let influenceLevel: 'high' | 'medium' | 'low' = 'medium';
        if (fieldMapping.influenceLevel) {
          const val = sanitizeCSVValue(row[fieldMapping.influenceLevel]).toLowerCase();
          if (val === 'high' || val === 'medium' || val === 'low') {
            influenceLevel = val;
          }
        }

        let supportLevel: 'champion' | 'supporter' | 'neutral' | 'resistant' = 'neutral';
        if (fieldMapping.supportLevel) {
          const val = sanitizeCSVValue(row[fieldMapping.supportLevel]).toLowerCase();
          if (val === 'champion' || val === 'supporter' || val === 'neutral' || val === 'resistant') {
            supportLevel = val;
          }
        }

        // Sanitize all imported values to prevent injection attacks
        const stakeholder = createStakeholder({
          name,
          jobTitle: sanitizeCSVValue(fieldMapping.jobTitle ? row[fieldMapping.jobTitle] : ''),
          department: sanitizeCSVValue(fieldMapping.department ? row[fieldMapping.department] : ''),
          email: sanitizeCSVValue(fieldMapping.email ? row[fieldMapping.email] : ''),
          slack: sanitizeCSVValue(fieldMapping.slack ? row[fieldMapping.slack] : ''),
          influenceLevel,
          supportLevel,
          notes: sanitizeCSVValue(fieldMapping.notes ? row[fieldMapping.notes] : ''),
        });

        if (assignToProject && currentProjectId) {
          assignStakeholder(stakeholder.id, currentProjectId, '');
        }

        count++;
      } catch (err) {
        newErrors.push(`Row ${i + 2}: Failed to import`);
      }
    }

    setImportedCount(count);
    setErrors(newErrors);
    setStep('complete');
  };

  const getMappedPreview = (row: ParsedRow): Partial<Record<string, string>> => {
    const result: Record<string, string> = {};
    for (const field of STAKEHOLDER_FIELDS) {
      if (fieldMapping[field.key]) {
        result[field.key] = row[fieldMapping[field.key]] || '';
      }
    }
    return result;
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Import Stakeholders</DialogTitle>
          <DialogDescription>
            {step === 'upload' && 'Upload a CSV file to import stakeholders in bulk.'}
            {step === 'mapping' && 'Map CSV columns to stakeholder fields.'}
            {step === 'preview' && 'Review the data before importing.'}
            {step === 'complete' && 'Import complete.'}
          </DialogDescription>
        </DialogHeader>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-2 py-4">
          {(['upload', 'mapping', 'preview', 'complete'] as Step[]).map((s, i) => (
            <div key={s} className="flex items-center">
              <div
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium',
                  step === s
                    ? 'bg-primary text-primary-foreground'
                    : ['upload'].indexOf(step) < i
                    ? 'bg-muted text-muted-foreground'
                    : 'bg-primary/20 text-primary'
                )}
              >
                {s === 'complete' && step === 'complete' ? (
                  <Check className="h-4 w-4" />
                ) : (
                  i + 1
                )}
              </div>
              {i < 3 && <ArrowRight className="h-4 w-4 mx-2 text-muted-foreground" />}
            </div>
          ))}
        </div>

        <ScrollArea className="flex-1">
          {/* Step 1: Upload */}
          {step === 'upload' && (
            <div className="flex flex-col items-center justify-center py-12">
              <FileSpreadsheet className="h-16 w-16 text-muted-foreground/50 mb-4" />
              <p className="text-sm text-muted-foreground mb-6">
                Upload a CSV file with stakeholder data
              </p>
              <Label
                htmlFor="csv-upload"
                className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Upload className="h-4 w-4" />
                Choose File
              </Label>
              <Input
                id="csv-upload"
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleFileUpload}
              />
              <p className="text-xs text-muted-foreground mt-4">
                Expected columns: Name, Job Title, Department, Email, etc.
              </p>
            </div>
          )}

          {/* Step 2: Mapping */}
          {step === 'mapping' && (
            <div className="space-y-4 p-4">
              <p className="text-sm text-muted-foreground">
                Found {csvData.length} rows. Map your CSV columns to stakeholder fields:
              </p>
              <div className="space-y-3">
                {STAKEHOLDER_FIELDS.map((field) => (
                  <div key={field.key} className="flex items-center gap-4">
                    <Label className="w-32 text-right text-sm">
                      {field.label}
                      {field.required && <span className="text-red-500 ml-1">*</span>}
                    </Label>
                    <Select
                      value={fieldMapping[field.key] || '_none_'}
                      onValueChange={(value) =>
                        setFieldMapping({
                          ...fieldMapping,
                          [field.key]: value === '_none_' ? '' : value,
                        })
                      }
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Select column..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="_none_">-- Not mapped --</SelectItem>
                        {csvHeaders.map((header) => (
                          <SelectItem key={header} value={header}>
                            {header}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2 pt-4 border-t">
                <Checkbox
                  id="assign-project"
                  checked={assignToProject}
                  onCheckedChange={(checked) => setAssignToProject(checked as boolean)}
                />
                <Label htmlFor="assign-project" className="text-sm">
                  Assign imported stakeholders to current project
                </Label>
              </div>
            </div>
          )}

          {/* Step 3: Preview */}
          {step === 'preview' && (
            <div className="space-y-4 p-4">
              <p className="text-sm text-muted-foreground">
                Preview of first 5 rows:
              </p>
              <div className="space-y-2">
                {csvData.slice(0, 5).map((row, i) => {
                  const mapped = getMappedPreview(row);
                  return (
                    <div key={i} className="rounded-lg border p-3 text-sm">
                      <div className="font-medium">{mapped.name || 'No name'}</div>
                      <div className="text-muted-foreground">
                        {[mapped.jobTitle, mapped.department].filter(Boolean).join(' · ') || 'No details'}
                      </div>
                      {(mapped.influenceLevel || mapped.supportLevel) && (
                        <div className="flex gap-2 mt-2">
                          {mapped.influenceLevel && (
                            <Badge variant="outline" className="text-xs">
                              {mapped.influenceLevel} influence
                            </Badge>
                          )}
                          {mapped.supportLevel && (
                            <Badge variant="outline" className="text-xs">
                              {mapped.supportLevel}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              {csvData.length > 5 && (
                <p className="text-sm text-muted-foreground text-center">
                  ...and {csvData.length - 5} more rows
                </p>
              )}
            </div>
          )}

          {/* Step 4: Complete */}
          {step === 'complete' && (
            <div className="flex flex-col items-center justify-center py-12">
              {importedCount > 0 ? (
                <>
                  <div className="rounded-full bg-emerald-500/20 p-4 mb-4">
                    <Check className="h-8 w-8 text-emerald-500" />
                  </div>
                  <h3 className="text-lg font-medium">Import Complete</h3>
                  <p className="text-muted-foreground">
                    Successfully imported {importedCount} stakeholder{importedCount !== 1 ? 's' : ''}
                  </p>
                </>
              ) : (
                <>
                  <div className="rounded-full bg-amber-500/20 p-4 mb-4">
                    <AlertCircle className="h-8 w-8 text-amber-500" />
                  </div>
                  <h3 className="text-lg font-medium">No Stakeholders Imported</h3>
                </>
              )}
              {errors.length > 0 && (
                <div className="mt-4 w-full max-w-md">
                  <p className="text-sm font-medium text-amber-500 mb-2">
                    {errors.length} issue{errors.length !== 1 ? 's' : ''}:
                  </p>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {errors.map((err, i) => (
                      <p key={i} className="text-xs text-muted-foreground">
                        {err}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </ScrollArea>

        {/* Errors */}
        {errors.length > 0 && step !== 'complete' && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
            <div>
              {errors.map((err, i) => (
                <p key={i}>{err}</p>
              ))}
            </div>
          </div>
        )}

        <DialogFooter>
          {step === 'upload' && (
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
          )}
          {step === 'mapping' && (
            <>
              <Button variant="outline" onClick={() => setStep('upload')}>
                Back
              </Button>
              <Button
                onClick={() => setStep('preview')}
                disabled={!fieldMapping.name}
              >
                Next
              </Button>
            </>
          )}
          {step === 'preview' && (
            <>
              <Button variant="outline" onClick={() => setStep('mapping')}>
                Back
              </Button>
              <Button onClick={handleImport}>
                Import {csvData.length} Stakeholder{csvData.length !== 1 ? 's' : ''}
              </Button>
            </>
          )}
          {step === 'complete' && (
            <Button onClick={handleClose}>Done</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
