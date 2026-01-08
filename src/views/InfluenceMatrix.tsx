import { useMemo } from 'react';
import { useStore } from '@/store';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

export function InfluenceMatrix() {
  const { projectStakeholders, currentProjectId } = useStore();

  const quadrants = useMemo(() => {
    const q = {
      highChampion: [] as typeof projectStakeholders,
      highResistant: [] as typeof projectStakeholders,
      lowChampion: [] as typeof projectStakeholders,
      lowResistant: [] as typeof projectStakeholders,
    };

    projectStakeholders.forEach((s) => {
      const isHigh = s.influenceLevel === 'high' || s.influenceLevel === 'medium';
      const isPositive = s.supportLevel === 'champion' || s.supportLevel === 'supporter';

      if (isHigh && isPositive) q.highChampion.push(s);
      else if (isHigh && !isPositive) q.highResistant.push(s);
      else if (!isHigh && isPositive) q.lowChampion.push(s);
      else q.lowResistant.push(s);
    });

    return q;
  }, [projectStakeholders]);

  if (!currentProjectId) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">Select a project to view the matrix</p>
      </div>
    );
  }

  if (projectStakeholders.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">No stakeholders to display</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col p-6">
      <div className="mb-6">
        <h2 className="text-lg font-semibold">Influence / Interest Matrix</h2>
        <p className="text-sm text-muted-foreground">
          Stakeholders positioned by influence level and support
        </p>
      </div>

      <div className="relative flex-1">
        {/* Axis Labels */}
        <div className="absolute -left-1 top-1/2 -translate-y-1/2 -rotate-90 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
          Influence →
        </div>
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
          ← Resistant · Support · Champion →
        </div>

        {/* Matrix Grid */}
        <div className="ml-6 grid h-[calc(100%-2rem)] grid-cols-2 grid-rows-2 gap-3">
          {/* High Influence + Resistant (Manage Closely) */}
          <Quadrant
            title="Manage Closely"
            subtitle="High influence, needs attention"
            stakeholders={quadrants.highResistant}
            className="border-amber-500/30 bg-amber-500/5"
            dotColor="bg-amber-500"
          />

          {/* High Influence + Champion (Key Players) */}
          <Quadrant
            title="Key Players"
            subtitle="High influence, champions"
            stakeholders={quadrants.highChampion}
            className="border-emerald-500/30 bg-emerald-500/5"
            dotColor="bg-emerald-500"
          />

          {/* Low Influence + Resistant (Monitor) */}
          <Quadrant
            title="Monitor"
            subtitle="Low influence, watch for changes"
            stakeholders={quadrants.lowResistant}
            className="border-border/50 bg-muted/20"
            dotColor="bg-muted-foreground"
          />

          {/* Low Influence + Champion (Keep Informed) */}
          <Quadrant
            title="Keep Informed"
            subtitle="Low influence, supportive"
            stakeholders={quadrants.lowChampion}
            className="border-blue-500/30 bg-blue-500/5"
            dotColor="bg-blue-500"
          />
        </div>
      </div>
    </div>
  );
}

interface QuadrantProps {
  title: string;
  subtitle: string;
  stakeholders: (typeof useStore.getState)['projectStakeholders'];
  className: string;
  dotColor: string;
}

function Quadrant({ title, subtitle, stakeholders, className, dotColor }: QuadrantProps) {
  return (
    <div className={cn('rounded-lg border p-4', className)}>
      <div className="mb-3">
        <h3 className="font-medium text-sm">{title}</h3>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {stakeholders.map((s) => (
          <Tooltip key={s.id}>
            <TooltipTrigger asChild>
              <div
                className={cn(
                  'flex cursor-pointer items-center gap-2 rounded-md border border-border/50 bg-card px-3 py-1.5 text-sm transition-colors hover:bg-card/80',
                  s.influenceLevel === 'high' && 'font-medium'
                )}
              >
                <span className={cn('h-2 w-2 rounded-full', dotColor)} />
                <span className="truncate max-w-[100px]">{s.name}</span>
              </div>
            </TooltipTrigger>
            <TooltipContent className="bg-popover border-border">
              <div className="space-y-1">
                <p className="font-medium">{s.name}</p>
                <p className="text-xs text-muted-foreground">{s.jobTitle}</p>
                {s.department && (
                  <p className="text-xs text-muted-foreground">{s.department}</p>
                )}
                <div className="flex gap-3 pt-1 text-xs">
                  <span>Influence: <span className="text-foreground">{s.influenceLevel}</span></span>
                  <span>Support: <span className="text-foreground">{s.supportLevel}</span></span>
                </div>
              </div>
            </TooltipContent>
          </Tooltip>
        ))}
        {stakeholders.length === 0 && (
          <span className="text-xs text-muted-foreground italic">
            No stakeholders
          </span>
        )}
      </div>
    </div>
  );
}
