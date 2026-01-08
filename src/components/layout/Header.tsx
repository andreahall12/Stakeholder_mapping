import { useState } from 'react';
import { useStore } from '@/store';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Plus,
  MessageSquare,
  Download,
  Upload,
  FileJson,
  FileSpreadsheet,
  Database,
  Users,
  Eye,
  EyeOff,
  Tags,
  FileText,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { exportToCSV, exportToJSON, exportFullDatabase, downloadFile, generatePDFReport } from '@/lib/export';
import { ImportDialog } from '@/components/stakeholders/ImportDialog';
import { TagsManagerDialog } from '@/components/stakeholders/TagsManagerDialog';
import { KeyboardShortcutsDialog } from './KeyboardShortcutsDialog';
import { Keyboard } from 'lucide-react';

export function Header() {
  const {
    projects,
    currentProjectId,
    setCurrentProject,
    createProject,
    chatOpen,
    toggleChat,
    projectStakeholders,
    anonymousMode,
    toggleAnonymousMode,
  } = useStore();

  const [newProjectOpen, setNewProjectOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [tagsDialogOpen, setTagsDialogOpen] = useState(false);
  const [shortcutsDialogOpen, setShortcutsDialogOpen] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');

  const currentProject = projects.find((p) => p.id === currentProjectId);

  const handleCreateProject = () => {
    if (!projectName.trim()) return;
    const project = createProject({
      name: projectName,
      description: projectDescription,
      status: 'active',
    });
    setCurrentProject(project.id);
    setNewProjectOpen(false);
    setProjectName('');
    setProjectDescription('');
  };

  const handleExportDatabase = () => {
    const data = exportFullDatabase();
    downloadFile(
      data,
      `stakeholders-backup-${new Date().toISOString().split('T')[0]}.sqlite`,
      'application/octet-stream'
    );
  };

  const handleExportJSON = () => {
    if (!currentProjectId) return;
    const json = exportToJSON(currentProjectId);
    downloadFile(
      json,
      `${currentProject?.name || 'project'}-${new Date().toISOString().split('T')[0]}.json`,
      'application/json'
    );
  };

  const handleExportCSV = () => {
    if (!currentProjectId) return;
    const csvData = exportToCSV(currentProjectId);
    const dateStr = new Date().toISOString().split('T')[0];
    downloadFile(csvData.stakeholders, `stakeholders-${dateStr}.csv`, 'text/csv');
    downloadFile(csvData.raci, `raci-matrix-${dateStr}.csv`, 'text/csv');
    downloadFile(csvData.commPlans, `comm-plans-${dateStr}.csv`, 'text/csv');
  };

  const handleExportPDF = () => {
    if (!currentProjectId) return;
    const html = generatePDFReport(currentProjectId);
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
    }
  };

  return (
    <header className="flex h-14 items-center justify-between border-b border-border/50 bg-card/50 px-6">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
            <Users className="h-4 w-4 text-primary" />
          </div>
          <div>
            <span className="text-sm font-semibold tracking-tight">Stakeholder Mapping</span>
          </div>
        </div>

        <div className="h-6 w-px bg-border/50" />

        <div className="flex items-center gap-2">
          <Select
            value={currentProjectId || ''}
            onValueChange={(value) => setCurrentProject(value)}
          >
            <SelectTrigger className="w-[200px] h-9 bg-background/50 border-border/50 text-sm">
              <SelectValue placeholder="Select project" />
            </SelectTrigger>
            <SelectContent>
              {projects.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  <div className="flex items-center gap-2">
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        project.status === 'active'
                          ? 'bg-emerald-500'
                          : project.status === 'planning'
                          ? 'bg-amber-500'
                          : 'bg-gray-500'
                      }`}
                    />
                    {project.name}
                  </div>
                </SelectItem>
              ))}
              {projects.length === 0 && (
                <SelectItem value="empty" disabled>
                  No projects
                </SelectItem>
              )}
            </SelectContent>
          </Select>

          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setNewProjectOpen(true)}
            className="h-9 w-9"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {currentProject && (
          <>
            <div className="h-6 w-px bg-border/50" />
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>{projectStakeholders.length} stakeholders</span>
            </div>
          </>
        )}
      </div>

      <div className="flex items-center gap-2">
        {/* Keyboard Shortcuts */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShortcutsDialogOpen(true)}
          className="h-9 w-9"
          title="Keyboard shortcuts"
        >
          <Keyboard className="h-4 w-4" />
        </Button>

        {/* Tags Manager */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setTagsDialogOpen(true)}
          className="gap-2 h-9"
        >
          <Tags className="h-4 w-4" />
          Tags
        </Button>

        {/* Anonymous Mode Toggle */}
        <Button
          variant={anonymousMode ? 'default' : 'outline'}
          size="icon"
          onClick={toggleAnonymousMode}
          className="h-9 w-9"
          title={anonymousMode ? 'Show names' : 'Hide names (presentation mode)'}
        >
          {anonymousMode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </Button>

        {/* AI Chat Assistant */}
        <Button
          variant={chatOpen ? 'default' : 'outline'}
          size="sm"
          onClick={toggleChat}
          className="gap-2 h-9"
          title="Ask questions about your stakeholders"
        >
          <MessageSquare className="h-4 w-4" />
          AI Chat
        </Button>

        {/* Import Button */}
        <Button
          variant="outline"
          size="icon"
          onClick={() => setImportDialogOpen(true)}
          className="h-9 w-9"
          title="Import stakeholders from CSV"
        >
          <Upload className="h-4 w-4" />
        </Button>

        {/* Export Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" className="h-9 w-9">
              <Download className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel className="text-xs text-muted-foreground">Export</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleExportPDF} disabled={!currentProjectId}>
              <FileText className="mr-2 h-4 w-4" />
              PDF Report
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleExportJSON} disabled={!currentProjectId}>
              <FileJson className="mr-2 h-4 w-4" />
              Project (JSON)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleExportCSV} disabled={!currentProjectId}>
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Project (CSV)
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleExportDatabase}>
              <Database className="mr-2 h-4 w-4" />
              Full Database
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* New Project Dialog */}
      <Dialog open={newProjectOpen} onOpenChange={setNewProjectOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>New Project</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Create a new project to track stakeholders.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="project-name" className="text-sm">Name</Label>
              <Input
                id="project-name"
                placeholder="e.g., Q1 Product Launch"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                className="bg-background/50"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="project-description" className="text-sm">Description</Label>
              <Textarea
                id="project-description"
                placeholder="Brief description..."
                value={projectDescription}
                onChange={(e) => setProjectDescription(e.target.value)}
                className="bg-background/50"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setNewProjectOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateProject} disabled={!projectName.trim()}>
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import Dialog */}
      <ImportDialog open={importDialogOpen} onOpenChange={setImportDialogOpen} />

      {/* Tags Manager Dialog */}
      <TagsManagerDialog open={tagsDialogOpen} onOpenChange={setTagsDialogOpen} />

      {/* Keyboard Shortcuts Dialog */}
      <KeyboardShortcutsDialog open={shortcutsDialogOpen} onOpenChange={setShortcutsDialogOpen} />
    </header>
  );
}
