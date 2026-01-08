import { useStore } from '@/store';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LayoutDashboard, Network, Grid3X3, GitBranch, Table2 } from 'lucide-react';
import type { ViewType } from '@/types';

const views: { id: ViewType; label: string; icon: React.ReactNode }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="h-4 w-4" /> },
  { id: 'network', label: 'Network', icon: <Network className="h-4 w-4" /> },
  { id: 'influence', label: 'Influence Matrix', icon: <Grid3X3 className="h-4 w-4" /> },
  { id: 'orgchart', label: 'Org Chart', icon: <GitBranch className="h-4 w-4" /> },
  { id: 'raci', label: 'RACI Matrix', icon: <Table2 className="h-4 w-4" /> },
];

export function ViewTabs() {
  const { currentView, setCurrentView, currentProjectId } = useStore();

  if (!currentProjectId) {
    return (
      <div className="flex h-11 items-center justify-center border-b border-border/50 bg-background px-6">
        <span className="text-sm text-muted-foreground">
          Select or create a project to get started
        </span>
      </div>
    );
  }

  return (
    <div className="flex h-11 items-center border-b border-border/50 bg-background px-6">
      <Tabs
        value={currentView}
        onValueChange={(value) => setCurrentView(value as ViewType)}
      >
        <TabsList className="bg-transparent h-11 p-0 gap-0">
          {views.map((view) => (
            <TabsTrigger 
              key={view.id} 
              value={view.id} 
              className="gap-2 h-11 px-4 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground text-muted-foreground hover:text-foreground transition-colors"
            >
              {view.icon}
              <span className="text-sm">{view.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    </div>
  );
}
