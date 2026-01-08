import { useState, useMemo } from 'react';
import { useStore } from '@/store';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import {
  Users,
  AlertTriangle,
  Clock,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Minus,
  Calendar,
  Mail,
  Phone,
  FileText,
  MessageSquare,
  ArrowRight,
  FlaskConical,
} from 'lucide-react';
import { cn, getDisplayName } from '@/lib/utils';
import { ScenarioDialog } from '@/components/stakeholders/ScenarioDialog';

export function Dashboard() {
  const {
    currentProjectId,
    projects,
    projectStakeholders,
    workstreams,
    raciAssignments,
    commPlans,
    engagementLogs,
    stakeholderHistory,
    getOverdueStakeholders,
    getBlockers,
    getRACICoverageGaps,
    setCurrentView,
    anonymousMode,
  } = useStore();

  const [scenarioDialogOpen, setScenarioDialogOpen] = useState(false);

  const currentProject = projects.find((p) => p.id === currentProjectId);
  const overdueStakeholders = getOverdueStakeholders();
  const blockers = getBlockers();
  const coverageGaps = getRACICoverageGaps();

  const stats = useMemo(() => {
    const bySupport = {
      champion: projectStakeholders.filter((s) => s.supportLevel === 'champion').length,
      supporter: projectStakeholders.filter((s) => s.supportLevel === 'supporter').length,
      neutral: projectStakeholders.filter((s) => s.supportLevel === 'neutral').length,
      resistant: projectStakeholders.filter((s) => s.supportLevel === 'resistant').length,
    };

    const byInfluence = {
      high: projectStakeholders.filter((s) => s.influenceLevel === 'high').length,
      medium: projectStakeholders.filter((s) => s.influenceLevel === 'medium').length,
      low: projectStakeholders.filter((s) => s.influenceLevel === 'low').length,
    };

    const withCommPlan = commPlans.length;
    const withoutCommPlan = projectStakeholders.length - withCommPlan;

    return { bySupport, byInfluence, withCommPlan, withoutCommPlan };
  }, [projectStakeholders, commPlans]);

  const recentLogs = useMemo(() => {
    return engagementLogs.slice(0, 5);
  }, [engagementLogs]);

  const recentChanges = useMemo(() => {
    return stakeholderHistory.slice(0, 5);
  }, [stakeholderHistory]);

  if (!currentProjectId) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">Select a project to view the dashboard</p>
      </div>
    );
  }

  const engagementTypeIcons: Record<string, React.ReactNode> = {
    meeting: <Users className="h-3 w-3" />,
    email: <Mail className="h-3 w-3" />,
    call: <Phone className="h-3 w-3" />,
    decision: <FileText className="h-3 w-3" />,
    note: <MessageSquare className="h-3 w-3" />,
  };

  return (
    <ScrollArea className="h-full">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold">{currentProject?.name || 'Dashboard'}</h1>
          <p className="text-muted-foreground">
            {projectStakeholders.length} stakeholders · {workstreams.length} workstreams
          </p>
        </div>

        {/* Alert Cards */}
        {(blockers.length > 0 || overdueStakeholders.length > 0 || coverageGaps.length > 0) && (
          <div className="grid gap-4 md:grid-cols-3">
            {/* Blockers Alert */}
            {blockers.length > 0 && (
              <Card className="p-4 border-amber-500/30 bg-amber-500/5">
                <div className="flex items-start gap-3">
                  <div className="rounded-full p-2 bg-amber-500/20">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                  </div>
                  <div>
                    <h3 className="font-medium text-amber-500">
                      {blockers.length} Blocker{blockers.length > 1 ? 's' : ''}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      High-influence stakeholders with concerns
                    </p>
                    <div className="mt-2 space-y-1">
                      {blockers.slice(0, 3).map((b) => (
                        <div key={b.id} className="text-sm">
                          <span className="font-medium">{getDisplayName(b.name, anonymousMode, b.jobTitle)}</span>
                          <span className="text-muted-foreground"> · {b.supportLevel}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {/* Overdue Alert */}
            {overdueStakeholders.length > 0 && (
              <Card className="p-4 border-red-500/30 bg-red-500/5">
                <div className="flex items-start gap-3">
                  <div className="rounded-full p-2 bg-red-500/20">
                    <Clock className="h-4 w-4 text-red-500" />
                  </div>
                  <div>
                    <h3 className="font-medium text-red-500">
                      {overdueStakeholders.length} Overdue Contact{overdueStakeholders.length > 1 ? 's' : ''}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Stakeholders needing communication
                    </p>
                    <div className="mt-2 space-y-1">
                      {overdueStakeholders.slice(0, 3).map((s) => (
                        <div key={s.id} className="text-sm">
                          <span className="font-medium">{getDisplayName(s.name, anonymousMode, s.jobTitle)}</span>
                          <span className="text-muted-foreground">
                            {' '}· {s.daysSinceContact === 999 ? 'Never contacted' : `${s.daysSinceContact} days ago`}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {/* RACI Gaps Alert */}
            {coverageGaps.length > 0 && (
              <Card className="p-4 border-blue-500/30 bg-blue-500/5">
                <div className="flex items-start gap-3">
                  <div className="rounded-full p-2 bg-blue-500/20">
                    <CheckCircle2 className="h-4 w-4 text-blue-500" />
                  </div>
                  <div>
                    <h3 className="font-medium text-blue-500">
                      {coverageGaps.length} RACI Gap{coverageGaps.length > 1 ? 's' : ''}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Workstreams missing key roles
                    </p>
                    <div className="mt-2 space-y-1">
                      {coverageGaps.slice(0, 3).map((g, i) => (
                        <div key={i} className="text-sm">
                          <span className="font-medium">{g.workstreamName}</span>
                          <span className="text-muted-foreground"> · No {g.missingRole}</span>
                        </div>
                      ))}
                    </div>
                    <Button
                      variant="link"
                      size="sm"
                      className="p-0 h-auto mt-2 text-blue-500"
                      onClick={() => setCurrentView('raci')}
                    >
                      Go to RACI Matrix <ArrowRight className="h-3 w-3 ml-1" />
                    </Button>
                  </div>
                </div>
              </Card>
            )}
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-4">
          {/* Support Distribution */}
          <Card className="p-4">
            <h3 className="text-sm font-medium text-muted-foreground mb-3">Support Distribution</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  Champions
                </span>
                <span className="font-medium">{stats.bySupport.champion}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-blue-500" />
                  Supporters
                </span>
                <span className="font-medium">{stats.bySupport.supporter}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-gray-500" />
                  Neutral
                </span>
                <span className="font-medium">{stats.bySupport.neutral}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-amber-500" />
                  Resistant
                </span>
                <span className="font-medium">{stats.bySupport.resistant}</span>
              </div>
            </div>
          </Card>

          {/* Influence Breakdown */}
          <Card className="p-4">
            <h3 className="text-sm font-medium text-muted-foreground mb-3">Influence Levels</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">High</span>
                <span className="font-medium">{stats.byInfluence.high}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Medium</span>
                <span className="font-medium">{stats.byInfluence.medium}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Low</span>
                <span className="font-medium">{stats.byInfluence.low}</span>
              </div>
            </div>
            <div className="mt-3 h-2 rounded-full bg-muted overflow-hidden flex">
              {stats.byInfluence.high > 0 && (
                <div
                  className="bg-amber-500 h-full"
                  style={{ width: `${(stats.byInfluence.high / projectStakeholders.length) * 100}%` }}
                />
              )}
              {stats.byInfluence.medium > 0 && (
                <div
                  className="bg-blue-500 h-full"
                  style={{ width: `${(stats.byInfluence.medium / projectStakeholders.length) * 100}%` }}
                />
              )}
              {stats.byInfluence.low > 0 && (
                <div
                  className="bg-gray-500 h-full"
                  style={{ width: `${(stats.byInfluence.low / projectStakeholders.length) * 100}%` }}
                />
              )}
            </div>
          </Card>

          {/* Communication Plans */}
          <Card className="p-4">
            <h3 className="text-sm font-medium text-muted-foreground mb-3">Communication Plans</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Has Plan</span>
                <span className="font-medium text-emerald-500">{stats.withCommPlan}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">No Plan</span>
                <span className={cn("font-medium", stats.withoutCommPlan > 0 && "text-amber-500")}>
                  {stats.withoutCommPlan}
                </span>
              </div>
            </div>
            <div className="mt-3 h-2 rounded-full bg-muted overflow-hidden flex">
              {stats.withCommPlan > 0 && (
                <div
                  className="bg-emerald-500 h-full"
                  style={{ width: `${(stats.withCommPlan / projectStakeholders.length) * 100}%` }}
                />
              )}
            </div>
          </Card>

          {/* Quick Actions */}
          <Card className="p-4">
            <h3 className="text-sm font-medium text-muted-foreground mb-3">Quick Actions</h3>
            <div className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start gap-2"
                onClick={() => setScenarioDialogOpen(true)}
              >
                <FlaskConical className="h-4 w-4" />
                Scenario Planning
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start gap-2"
                onClick={() => setCurrentView('influence')}
              >
                <Users className="h-4 w-4" />
                Influence Matrix
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start gap-2"
                onClick={() => setCurrentView('raci')}
              >
                <CheckCircle2 className="h-4 w-4" />
                RACI Matrix
              </Button>
            </div>
          </Card>
        </div>

        {/* Recent Activity */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Recent Engagements */}
          <Card className="p-4">
            <h3 className="font-medium mb-4">Recent Engagements</h3>
            {recentLogs.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No engagement logs yet
              </p>
            ) : (
              <div className="space-y-3">
                {recentLogs.map((log) => (
                  <div key={log.id} className="flex items-start gap-3">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted">
                      {engagementTypeIcons[log.type] || <Calendar className="h-3 w-3" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium truncate">
                          {getDisplayName(log.stakeholderName || '', anonymousMode)}
                        </span>
                        <Badge
                          variant="outline"
                          className={cn(
                            'text-[10px] px-1 py-0',
                            log.sentiment === 'positive' && 'text-emerald-500 border-emerald-500/30',
                            log.sentiment === 'negative' && 'text-amber-500 border-amber-500/30'
                          )}
                        >
                          {log.type}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{log.summary}</p>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {new Date(log.date).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Recent Changes */}
          <Card className="p-4">
            <h3 className="font-medium mb-4">Sentiment Changes</h3>
            {recentChanges.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No changes recorded yet
              </p>
            ) : (
              <div className="space-y-3">
                {recentChanges.map((change) => {
                  const isPositive = 
                    (change.field === 'supportLevel' && 
                      (['champion', 'supporter'].includes(change.newValue) && 
                       ['neutral', 'resistant'].includes(change.oldValue))) ||
                    (change.field === 'influenceLevel' && change.newValue === 'high');
                  const isNegative = 
                    (change.field === 'supportLevel' && 
                      (['neutral', 'resistant'].includes(change.newValue) && 
                       ['champion', 'supporter'].includes(change.oldValue)));

                  return (
                    <div key={change.id} className="flex items-start gap-3">
                      <div className={cn(
                        "flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
                        isPositive && "bg-emerald-500/20 text-emerald-500",
                        isNegative && "bg-amber-500/20 text-amber-500",
                        !isPositive && !isNegative && "bg-muted text-muted-foreground"
                      )}>
                        {isPositive ? <TrendingUp className="h-3 w-3" /> : 
                         isNegative ? <TrendingDown className="h-3 w-3" /> : 
                         <Minus className="h-3 w-3" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium">{getDisplayName(change.stakeholderName || '', anonymousMode)}</span>
                        <p className="text-xs text-muted-foreground">
                          {change.field === 'supportLevel' ? 'Support' : 'Influence'}: {change.oldValue} → {change.newValue}
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground shrink-0">
                        {new Date(change.changedAt).toLocaleDateString()}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      </div>

      <ScenarioDialog open={scenarioDialogOpen} onOpenChange={setScenarioDialogOpen} />
    </ScrollArea>
  );
}
