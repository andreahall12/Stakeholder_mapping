import { useEffect, useState } from 'react';
import { useStore } from '@/store';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Header } from '@/components/layout/Header';
import { ViewTabs } from '@/components/layout/ViewTabs';
import { StakeholderPanel } from '@/components/stakeholders/StakeholderPanel';
import { ChatPanel } from '@/components/chat/ChatPanel';
import { NetworkGraph } from '@/views/NetworkGraph';
import { InfluenceMatrix } from '@/views/InfluenceMatrix';
import { OrgChart } from '@/views/OrgChart';
import { RACIMatrix } from '@/views/RACIMatrix';
import { Button } from '@/components/ui/button';
import { Loader2, Sparkles } from 'lucide-react';
import { seedSampleData } from '@/db/seed';

function App() {
  const { initialized, initialize, currentView, chatOpen, projects, loadProjects, setCurrentProject, loadWorkstreams, loadProjectStakeholders, loadRACIAssignments, loadCommPlans, currentProjectId } = useStore();
  const [error, setError] = useState<string | null>(null);
  const [seeding, setSeeding] = useState(false);

  useEffect(() => {
    initialize().catch((err) => {
      console.error('Failed to initialize:', err);
      setError('Failed to initialize database');
    });
  }, [initialize]);

  const handleSeedData = async () => {
    setSeeding(true);
    try {
      const result = await seedSampleData();
      // Reload data
      loadProjects();
      if (result.project) {
        setCurrentProject(result.project.id);
        loadWorkstreams(result.project.id);
        loadProjectStakeholders(result.project.id);
        loadRACIAssignments(result.project.id);
        loadCommPlans(result.project.id);
      }
    } catch (err) {
      console.error('Failed to seed:', err);
    }
    setSeeding(false);
  };

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-destructive text-lg font-medium">{error}</p>
          <p className="text-muted-foreground mt-2">Please refresh the page to try again.</p>
        </div>
      </div>
    );
  }

  if (!initialized) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex items-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span className="text-lg text-muted-foreground">Loading Stakeholder Mapping...</span>
        </div>
      </div>
    );
  }

  const renderView = () => {
    switch (currentView) {
      case 'network':
        return <NetworkGraph />;
      case 'influence':
        return <InfluenceMatrix />;
      case 'orgchart':
        return <OrgChart />;
      case 'raci':
        return <RACIMatrix />;
      default:
        return <NetworkGraph />;
    }
  };

  return (
    <TooltipProvider>
      <div className="flex h-screen flex-col bg-background">
        <Header />
        <ViewTabs />
        <div className="flex flex-1 overflow-hidden">
          <main className="flex-1 overflow-hidden relative">
            {renderView()}
            {/* Seed data button - shows when no stakeholders */}
            {projects.length <= 1 && (
              <div className="absolute bottom-4 right-4">
                <Button onClick={handleSeedData} disabled={seeding} className="gap-2 shadow-lg">
                  {seeding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  Add Sample Data
                </Button>
              </div>
            )}
          </main>
          {chatOpen && <ChatPanel />}
        </div>
        <StakeholderPanel />
      </div>
    </TooltipProvider>
  );
}

export default App;
