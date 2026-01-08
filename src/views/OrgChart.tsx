import { useEffect, useRef, useMemo } from 'react';
import mermaid from 'mermaid';
import { useStore } from '@/store';

mermaid.initialize({
  startOnLoad: false,
  theme: 'neutral',
  flowchart: {
    useMaxWidth: true,
    htmlLabels: true,
    curve: 'basis',
  },
});

export function OrgChart() {
  const { projectStakeholders, currentProjectId } = useStore();
  const containerRef = useRef<HTMLDivElement>(null);

  const mermaidCode = useMemo(() => {
    if (projectStakeholders.length === 0) return '';

    // Group by department
    const departments = new Map<string, typeof projectStakeholders>();
    projectStakeholders.forEach((s) => {
      const dept = s.department || 'Unassigned';
      if (!departments.has(dept)) {
        departments.set(dept, []);
      }
      departments.get(dept)!.push(s);
    });

    // Build mermaid flowchart
    let code = 'flowchart TB\n';
    code += '    Project[("Project Team")]\n';

    departments.forEach((members, deptName) => {
      const deptId = deptName.replace(/[^a-zA-Z0-9]/g, '_');
      code += `    subgraph ${deptId}["${deptName}"]\n`;
      
      members.forEach((m) => {
        const nodeId = `S_${m.id.replace(/-/g, '_').substring(0, 8)}`;
        const influence = m.influenceLevel === 'high' ? '⭐ ' : '';
        const support = 
          m.supportLevel === 'champion' ? '💚' :
          m.supportLevel === 'supporter' ? '💙' :
          m.supportLevel === 'resistant' ? '🟠' : '';
        
        // Escape special characters in names
        const safeName = m.name.replace(/"/g, "'");
        const safeTitle = m.jobTitle.replace(/"/g, "'");
        
        code += `        ${nodeId}["${influence}${safeName}<br/><small>${safeTitle}</small> ${support}"]\n`;
      });
      
      code += '    end\n';
      code += `    Project --> ${deptId}\n`;
    });

    return code;
  }, [projectStakeholders]);

  useEffect(() => {
    if (!containerRef.current || !mermaidCode) return;

    const renderDiagram = async () => {
      try {
        containerRef.current!.innerHTML = '';
        const { svg } = await mermaid.render('org-chart', mermaidCode);
        containerRef.current!.innerHTML = svg;
        
        // Style the SVG
        const svgElement = containerRef.current!.querySelector('svg');
        if (svgElement) {
          svgElement.style.maxWidth = '100%';
          svgElement.style.height = 'auto';
        }
      } catch (error) {
        console.error('Mermaid render error:', error);
        containerRef.current!.innerHTML = `
          <div class="text-center text-muted-foreground">
            <p>Unable to render org chart</p>
            <pre class="mt-2 text-xs text-left bg-muted p-2 rounded overflow-auto max-h-40">${mermaidCode}</pre>
          </div>
        `;
      }
    };

    renderDiagram();
  }, [mermaidCode]);

  if (!currentProjectId) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">Select a project to view the org chart</p>
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
    <div className="flex h-full flex-col overflow-auto p-6">
      <div className="mb-4 text-center">
        <h2 className="text-lg font-semibold">Organization Chart</h2>
        <p className="text-sm text-muted-foreground">
          Stakeholders grouped by department
        </p>
      </div>

      <div
        ref={containerRef}
        className="flex flex-1 items-center justify-center"
      />

      {/* Legend */}
      <div className="mt-4 flex justify-center gap-4 text-sm">
        <span>⭐ High Influence</span>
        <span>💚 Champion</span>
        <span>💙 Supporter</span>
        <span>🟠 Resistant</span>
      </div>
    </div>
  );
}

