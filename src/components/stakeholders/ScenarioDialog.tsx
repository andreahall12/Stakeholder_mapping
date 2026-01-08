import { useState, useMemo } from 'react';
import { useStore } from '@/store';
import { Button } from '@/components/ui/button';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  UserMinus, 
  TrendingDown,
  AlertTriangle, 
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ScenarioDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ScenarioDialog({ open, onOpenChange }: ScenarioDialogProps) {
  const {
    projectStakeholders,
    workstreams,
    raciAssignments,
    commPlans,
    stakeholders,
  } = useStore();

  const [scenarioType, setScenarioType] = useState<'departure' | 'resistance'>('departure');
  const [selectedStakeholder, setSelectedStakeholder] = useState<string>('');

  const departureAnalysis = useMemo(() => {
    if (!selectedStakeholder || scenarioType !== 'departure') return null;

    const stakeholder = projectStakeholders.find(
      (ps) => ps.projectStakeholderId === selectedStakeholder
    );
    if (!stakeholder) return null;

    // Find their RACI assignments
    const theirAssignments = raciAssignments.filter(
      (r) => r.projectStakeholderId === selectedStakeholder
    );

    // Find orphaned workstreams (where they are R or A)
    const criticalRoles = theirAssignments.filter((r) => r.role === 'R' || r.role === 'A');
    const orphanedWorkstreams = criticalRoles.map((r) => ({
      workstreamName: r.workstreamName,
      role: r.role,
      // Find potential replacements (others with C role on same workstream)
      potentialReplacements: raciAssignments
        .filter(
          (ra) =>
            ra.workstreamId === r.workstreamId &&
            ra.projectStakeholderId !== selectedStakeholder &&
            (ra.role === 'C' || ra.role === 'I')
        )
        .map((ra) => ra.stakeholderName),
    }));

    // Check if they have a comm plan
    const hasCommPlan = commPlans.some((c) => c.projectStakeholderId === selectedStakeholder);

    // Risk assessment
    const riskLevel =
      stakeholder.influenceLevel === 'high' && criticalRoles.length > 0
        ? 'Critical'
        : stakeholder.influenceLevel === 'high' || criticalRoles.length > 2
        ? 'High'
        : criticalRoles.length > 0
        ? 'Medium'
        : 'Low';

    return {
      stakeholder,
      assignments: theirAssignments,
      orphanedWorkstreams,
      hasCommPlan,
      riskLevel,
    };
  }, [selectedStakeholder, scenarioType, projectStakeholders, raciAssignments, commPlans]);

  const resistanceAnalysis = useMemo(() => {
    if (!selectedStakeholder || scenarioType !== 'resistance') return null;

    const stakeholder = projectStakeholders.find(
      (ps) => ps.projectStakeholderId === selectedStakeholder
    );
    if (!stakeholder) return null;

    // Simulate stakeholder becoming resistant
    const simulatedStakeholder = { ...stakeholder, supportLevel: 'resistant' as const };

    // Check if this would make them a blocker
    const wouldBeBlocker = stakeholder.influenceLevel === 'high';

    // Find their RACI assignments
    const theirAssignments = raciAssignments.filter(
      (r) => r.projectStakeholderId === selectedStakeholder
    );

    // Find workstreams at risk (where they are R or A)
    const atRiskWorkstreams = theirAssignments
      .filter((r) => r.role === 'R' || r.role === 'A')
      .map((r) => r.workstreamName);

    // Find allies who might help
    const potentialAllies = projectStakeholders.filter(
      (ps) =>
        ps.projectStakeholderId !== selectedStakeholder &&
        ps.supportLevel === 'champion' &&
        ps.department === stakeholder.department
    );

    // Risk assessment
    const impactLevel =
      stakeholder.influenceLevel === 'high' && atRiskWorkstreams.length > 0
        ? 'Critical'
        : stakeholder.influenceLevel === 'high'
        ? 'High'
        : atRiskWorkstreams.length > 0
        ? 'Medium'
        : 'Low';

    return {
      stakeholder: simulatedStakeholder,
      currentSupportLevel: stakeholder.supportLevel,
      wouldBeBlocker,
      atRiskWorkstreams,
      potentialAllies,
      impactLevel,
    };
  }, [selectedStakeholder, scenarioType, projectStakeholders, raciAssignments]);

  const riskColors: Record<string, string> = {
    Critical: 'text-red-500 bg-red-500/10 border-red-500/30',
    High: 'text-amber-500 bg-amber-500/10 border-amber-500/30',
    Medium: 'text-yellow-500 bg-yellow-500/10 border-yellow-500/30',
    Low: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/30',
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Scenario Planning</DialogTitle>
          <DialogDescription>
            Analyze "What If" scenarios to understand stakeholder impact
          </DialogDescription>
        </DialogHeader>

        <Tabs
          value={scenarioType}
          onValueChange={(v) => {
            setScenarioType(v as 'departure' | 'resistance');
            setSelectedStakeholder('');
          }}
          className="flex-1 flex flex-col overflow-hidden"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="departure" className="gap-2">
              <UserMinus className="h-4 w-4" />
              Departure
            </TabsTrigger>
            <TabsTrigger value="resistance" className="gap-2">
              <TrendingDown className="h-4 w-4" />
              Resistance
            </TabsTrigger>
          </TabsList>

          <div className="pt-4 space-y-4 flex-1 overflow-hidden flex flex-col">
            {/* Stakeholder Selection */}
            <div className="grid gap-2">
              <Label>Select Stakeholder</Label>
              <Select value={selectedStakeholder} onValueChange={setSelectedStakeholder}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a stakeholder to analyze..." />
                </SelectTrigger>
                <SelectContent>
                  {projectStakeholders.map((ps) => (
                    <SelectItem key={ps.projectStakeholderId} value={ps.projectStakeholderId}>
                      {ps.name} ({ps.influenceLevel} influence, {ps.supportLevel})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <ScrollArea className="flex-1">
              {/* Departure Analysis */}
              <TabsContent value="departure" className="m-0 space-y-4">
                {departureAnalysis ? (
                  <>
                    {/* Risk Level */}
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-muted-foreground">Impact Level:</span>
                      <Badge className={cn('px-2 py-1', riskColors[departureAnalysis.riskLevel])}>
                        {departureAnalysis.riskLevel}
                      </Badge>
                    </div>

                    {/* Profile Summary */}
                    <div className="p-3 rounded-lg border bg-muted/30">
                      <h4 className="font-medium">{departureAnalysis.stakeholder.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {departureAnalysis.stakeholder.jobTitle} • {departureAnalysis.stakeholder.department}
                      </p>
                      <div className="flex gap-2 mt-2">
                        <Badge variant="outline" className="text-xs">
                          {departureAnalysis.stakeholder.influenceLevel} influence
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {departureAnalysis.stakeholder.supportLevel}
                        </Badge>
                      </div>
                    </div>

                    {/* Orphaned Workstreams */}
                    {departureAnalysis.orphanedWorkstreams.length > 0 ? (
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-amber-500" />
                          Workstreams at Risk
                        </h4>
                        {departureAnalysis.orphanedWorkstreams.map((ws, i) => (
                          <div key={i} className="p-3 rounded-lg border">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{ws.workstreamName}</span>
                              <Badge variant="outline" className="text-xs">
                                {ws.role === 'R' ? 'Responsible' : 'Accountable'}
                              </Badge>
                            </div>
                            {ws.potentialReplacements.length > 0 ? (
                              <div className="mt-2 text-sm text-muted-foreground">
                                <span className="text-emerald-500">Potential replacements: </span>
                                {ws.potentialReplacements.join(', ')}
                              </div>
                            ) : (
                              <div className="mt-2 text-sm text-amber-500">
                                ⚠ No obvious replacement - needs immediate attention
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/10 text-emerald-500">
                        <CheckCircle2 className="h-4 w-4" />
                        <span className="text-sm">No critical RACI roles that would be orphaned</span>
                      </div>
                    )}

                    {/* Other RACI Roles */}
                    {departureAnalysis.assignments.filter((a) => a.role === 'C' || a.role === 'I').length > 0 && (
                      <div className="text-sm text-muted-foreground">
                        <p>
                          Also consulted/informed on{' '}
                          {departureAnalysis.assignments.filter((a) => a.role === 'C' || a.role === 'I').length}{' '}
                          other workstream(s)
                        </p>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Select a stakeholder to analyze their departure impact
                  </p>
                )}
              </TabsContent>

              {/* Resistance Analysis */}
              <TabsContent value="resistance" className="m-0 space-y-4">
                {resistanceAnalysis ? (
                  <>
                    {/* Impact Level */}
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-muted-foreground">Impact Level:</span>
                      <Badge className={cn('px-2 py-1', riskColors[resistanceAnalysis.impactLevel])}>
                        {resistanceAnalysis.impactLevel}
                      </Badge>
                    </div>

                    {/* Scenario Visualization */}
                    <div className="p-3 rounded-lg border bg-muted/30">
                      <h4 className="font-medium">{resistanceAnalysis.stakeholder.name}</h4>
                      <div className="flex items-center gap-2 mt-2 text-sm">
                        <Badge variant="outline" className="capitalize">
                          {resistanceAnalysis.currentSupportLevel}
                        </Badge>
                        <ArrowRight className="h-3 w-3" />
                        <Badge className="bg-amber-500 text-white">Resistant</Badge>
                      </div>
                    </div>

                    {/* Blocker Warning */}
                    {resistanceAnalysis.wouldBeBlocker && (
                      <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30">
                        <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5" />
                        <div>
                          <span className="text-sm font-medium text-red-500">Would become a Blocker</span>
                          <p className="text-sm text-muted-foreground">
                            High-influence stakeholder becoming resistant requires immediate mitigation strategy.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* At-Risk Workstreams */}
                    {resistanceAnalysis.atRiskWorkstreams.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium mb-2">Workstreams at Risk</h4>
                        <div className="flex flex-wrap gap-2">
                          {resistanceAnalysis.atRiskWorkstreams.map((ws, i) => (
                            <Badge key={i} variant="outline" className="text-amber-500 border-amber-500/30">
                              {ws}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Potential Allies */}
                    {resistanceAnalysis.potentialAllies.length > 0 ? (
                      <div>
                        <h4 className="text-sm font-medium mb-2 text-emerald-500">Potential Allies to Engage</h4>
                        <div className="space-y-1">
                          {resistanceAnalysis.potentialAllies.map((ally) => (
                            <div key={ally.id} className="text-sm">
                              <span className="font-medium">{ally.name}</span>
                              <span className="text-muted-foreground"> - {ally.jobTitle}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No champions found in the same department to help influence.
                      </p>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Select a stakeholder to analyze resistance impact
                  </p>
                )}
              </TabsContent>
            </ScrollArea>
          </div>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
