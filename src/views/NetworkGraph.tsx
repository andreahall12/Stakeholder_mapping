import { useMemo } from 'react';
import {
  ReactFlow,
  Node,
  Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  MarkerType,
  Handle,
  Position,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useStore } from '@/store';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { RACIRole } from '@/types';

interface StakeholderNodeData extends Record<string, unknown> {
  name: string;
  jobTitle: string;
  department: string;
  projectFunction: string;
  influenceLevel: string;
  supportLevel: string;
  raciRoles: { workstream: string; role: RACIRole }[];
}

function StakeholderNode({ data }: { data: StakeholderNodeData }) {
  const supportColors = {
    champion: 'border-l-emerald-500',
    supporter: 'border-l-blue-500',
    neutral: 'border-l-muted-foreground',
    resistant: 'border-l-amber-500',
  };

  return (
    <div
      className={cn(
        'rounded-md border border-border/50 bg-card p-3 shadow-lg min-w-[160px] border-l-2',
        supportColors[data.supportLevel as keyof typeof supportColors] || 'border-l-muted-foreground'
      )}
    >
      <Handle type="target" position={Position.Top} className="!bg-primary !border-0 !w-2 !h-2" />
      <Handle type="source" position={Position.Bottom} className="!bg-primary !border-0 !w-2 !h-2" />
      
      <div className="space-y-2">
        <div>
          <h3 className="font-medium text-sm">{data.name}</h3>
          <p className="text-xs text-muted-foreground">{data.jobTitle}</p>
          {data.department && (
            <p className="text-[10px] text-muted-foreground/60">{data.department}</p>
          )}
        </div>
        
        {data.raciRoles.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {data.raciRoles.slice(0, 2).map((r, i) => (
              <Badge
                key={i}
                variant={
                  r.role === 'R'
                    ? 'responsible'
                    : r.role === 'A'
                    ? 'accountable'
                    : r.role === 'C'
                    ? 'consulted'
                    : 'informed'
                }
                className="text-[9px] px-1.5 py-0"
              >
                {r.role}
              </Badge>
            ))}
            {data.raciRoles.length > 2 && (
              <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-border/50">
                +{data.raciRoles.length - 2}
              </Badge>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const nodeTypes = {
  stakeholder: StakeholderNode,
};

export function NetworkGraph() {
  const { projectStakeholders, raciAssignments, currentProjectId } =
    useStore();

  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => {
    if (!currentProjectId || projectStakeholders.length === 0) {
      return { nodes: [], edges: [] };
    }

    const nodes: Node<StakeholderNodeData>[] = projectStakeholders.map((stakeholder, index) => {
      const raciRoles = raciAssignments
        .filter((r) => r.stakeholderId === stakeholder.id)
        .map((r) => ({
          workstream: r.workstreamName,
          role: r.role as RACIRole,
        }));

      const cols = Math.ceil(Math.sqrt(projectStakeholders.length));
      const row = Math.floor(index / cols);
      const col = index % cols;

      return {
        id: stakeholder.id,
        type: 'stakeholder',
        position: { x: col * 200 + 50, y: row * 150 + 50 },
        data: {
          name: stakeholder.name,
          jobTitle: stakeholder.jobTitle,
          department: stakeholder.department,
          projectFunction: stakeholder.projectFunction,
          influenceLevel: stakeholder.influenceLevel,
          supportLevel: stakeholder.supportLevel,
          raciRoles,
        },
      };
    });

    const edges: Edge[] = [];
    const stakeholderWorkstreams = new Map<string, Set<string>>();

    raciAssignments.forEach((assignment) => {
      if (!stakeholderWorkstreams.has(assignment.stakeholderId)) {
        stakeholderWorkstreams.set(assignment.stakeholderId, new Set());
      }
      stakeholderWorkstreams.get(assignment.stakeholderId)!.add(assignment.workstreamId);
    });

    const stakeholderIds = Array.from(stakeholderWorkstreams.keys());
    for (let i = 0; i < stakeholderIds.length; i++) {
      for (let j = i + 1; j < stakeholderIds.length; j++) {
        const ws1 = stakeholderWorkstreams.get(stakeholderIds[i])!;
        const ws2 = stakeholderWorkstreams.get(stakeholderIds[j])!;
        const shared = [...ws1].filter((w) => ws2.has(w));
        if (shared.length > 0) {
          edges.push({
            id: `${stakeholderIds[i]}-${stakeholderIds[j]}`,
            source: stakeholderIds[i],
            target: stakeholderIds[j],
            animated: false,
            style: { stroke: 'hsl(217 33% 30%)', strokeWidth: 1 },
            markerEnd: { type: MarkerType.Arrow, color: 'hsl(217 33% 30%)' },
          });
        }
      }
    }

    return { nodes, edges };
  }, [projectStakeholders, raciAssignments, currentProjectId]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  useMemo(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  if (!currentProjectId) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">Select a project to view the network</p>
      </div>
    );
  }

  if (projectStakeholders.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">No stakeholders in this project</p>
          <p className="text-sm text-muted-foreground/60">
            Add stakeholders to see the network visualization
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        style={{ background: 'hsl(222 47% 6%)' }}
      >
        <Controls className="!bg-card !border-border/50 !rounded-md [&>button]:!bg-card [&>button]:!border-border/50 [&>button]:!text-muted-foreground [&>button:hover]:!bg-muted" />
        <Background gap={24} size={1} color="hsl(217 33% 15%)" />
      </ReactFlow>
      
      {/* Legend */}
      <div className="absolute bottom-4 left-4 rounded-md border border-border/50 bg-card/95 p-3 shadow-lg backdrop-blur">
        <p className="mb-2 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">RACI Roles</p>
        <div className="flex gap-2">
          <Badge variant="responsible" className="text-[10px]">R</Badge>
          <Badge variant="accountable" className="text-[10px]">A</Badge>
          <Badge variant="consulted" className="text-[10px]">C</Badge>
          <Badge variant="informed" className="text-[10px]">I</Badge>
        </div>
      </div>
    </div>
  );
}
