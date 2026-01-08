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
  Database, 
  Upload, 
  AlertTriangle, 
  Check,
  FileDown,
} from 'lucide-react';
import { importDatabase } from '@/db/database';

interface ImportDatabaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ImportDatabaseDialog({ open, onOpenChange }: ImportDatabaseDialogProps) {
  const { initialize } = useStore();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validate file type
    if (!file.name.endsWith('.db') && !file.name.endsWith('.sqlite') && !file.name.endsWith('.sqlite3')) {
      setError('Please select a valid database file (.db, .sqlite, or .sqlite3)');
      setSelectedFile(null);
      return;
    }
    
    setError(null);
    setSelectedFile(file);
  }, []);

  const handleImport = async () => {
    if (!selectedFile) return;
    
    setIsImporting(true);
    setError(null);
    
    try {
      // Read file as ArrayBuffer
      const arrayBuffer = await selectedFile.arrayBuffer();
      const data = new Uint8Array(arrayBuffer);
      
      // Validate it's a valid SQLite database (check magic header)
      const header = String.fromCharCode(...data.slice(0, 16));
      if (!header.startsWith('SQLite format 3')) {
        throw new Error('Invalid database file. This does not appear to be a valid SQLite database.');
      }
      
      // Import the database
      importDatabase(data);
      
      // Reinitialize the store to load the new data
      await initialize();
      
      setSuccess(true);
    } catch (err) {
      console.error('Import error:', err);
      setError(err instanceof Error ? err.message : 'Failed to import database');
    } finally {
      setIsImporting(false);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setError(null);
    setSuccess(false);
    onOpenChange(false);
    
    // Reload the page to ensure all components have fresh data
    if (success) {
      window.location.reload();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Database className="h-5 w-5 text-primary" />
            Import Database
          </DialogTitle>
          <DialogDescription>
            Load stakeholder data from a shared backup file.
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="rounded-full bg-emerald-500/20 p-4 mb-4">
              <Check className="h-8 w-8 text-emerald-500" />
            </div>
            <h3 className="text-lg font-medium">Import Successful</h3>
            <p className="text-sm text-muted-foreground text-center mt-2">
              The database has been imported. Click Done to reload the application with the new data.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Warning */}
            <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-amber-600 dark:text-amber-400">
                  This will replace all existing data
                </p>
                <p className="text-muted-foreground mt-1">
                  Export a backup of your current data first if you want to keep it.
                </p>
              </div>
            </div>

            {/* File Input */}
            <div className="space-y-2">
              <Label htmlFor="db-file">Select Database File</Label>
              <div className="flex gap-2">
                <Input
                  id="db-file"
                  type="file"
                  accept=".db,.sqlite,.sqlite3"
                  onChange={handleFileSelect}
                  className="flex-1"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Supported formats: .db, .sqlite, .sqlite3
              </p>
            </div>

            {/* Selected File Info */}
            {selectedFile && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-muted">
                <FileDown className="h-4 w-4 text-primary" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{selectedFile.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(selectedFile.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                {error}
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          {success ? (
            <Button onClick={handleClose}>Done</Button>
          ) : (
            <>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button 
                onClick={handleImport} 
                disabled={!selectedFile || isImporting}
              >
                {isImporting ? (
                  <>
                    <Upload className="h-4 w-4 mr-2 animate-pulse" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Import & Replace Data
                  </>
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
