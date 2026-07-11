import React, { useRef, useEffect, useState } from 'react';
import { GitPullRequest, Link2 } from 'lucide-react';

export default function DependencyGraph({ prs, onSelectPr }) {
  const containerRef = useRef(null);
  const [lines, setLines] = useState([]);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  // Group open PRs into columns based on dependency level
  // Level 0: No dependencies
  // Level 1: Depends on Level 0
  // Level 2: Depends on Level 1, etc.
  const calculateLevels = () => {
    const levels = {};
    const visited = new Set();

    const getPrLevel = (prId) => {
      if (visited.has(prId)) return levels[prId] || 0;
      visited.add(prId);

      const pr = prs.find(p => p._id.toString() === prId.toString());
      if (!pr || !pr.dependencies || pr.dependencies.length === 0) {
        levels[prId] = 0;
        return 0;
      }

      let maxDepLevel = -1;
      for (const dep of pr.dependencies) {
        const depId = dep._id ? dep._id : dep;
        maxDepLevel = Math.max(maxDepLevel, getPrLevel(depId));
      }

      levels[prId] = maxDepLevel + 1;
      return maxDepLevel + 1;
    };

    // Calculate level for all open PRs
    const openPrs = prs.filter(p => p.state === 'open');
    openPrs.forEach(pr => getPrLevel(pr._id));

    return levels;
  };

  const levels = calculateLevels();
  const openPrs = prs.filter(p => p.state === 'open');
  
  // Only show PRs that have dependencies or are dependents to keep graph focused
  const graphPrs = openPrs.filter(pr => 
    (pr.dependencies && pr.dependencies.length > 0) || 
    prs.some(p => p.dependencies && p.dependencies.some(d => (d._id || d).toString() === pr._id.toString()))
  );

  // Group by level
  const columns = [];
  graphPrs.forEach(pr => {
    const lvl = levels[pr._id] || 0;
    if (!columns[lvl]) columns[lvl] = [];
    columns[lvl].push(pr);
  });

  // Track window resize to recompute SVG lines
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Compute connections
  useEffect(() => {
    if (!containerRef.current || graphPrs.length === 0) return;

    const newLines = [];
    const elements = containerRef.current.querySelectorAll('[data-pr-id]');
    
    // Create coordinate mapping
    const coords = {};
    elements.forEach(el => {
      const id = el.getAttribute('data-pr-id');
      const rect = el.getBoundingClientRect();
      const parentRect = containerRef.current.getBoundingClientRect();
      
      coords[id] = {
        x: rect.left - parentRect.left,
        y: rect.top - parentRect.top,
        width: rect.width,
        height: rect.height
      };
    });

    // Generate path links
    graphPrs.forEach(pr => {
      if (pr.dependencies) {
        pr.dependencies.forEach(dep => {
          const depId = dep._id ? dep._id : dep;
          const startNode = coords[depId.toString()];
          const endNode = coords[pr._id.toString()];

          if (startNode && endNode) {
            // Draw curve from right side of dependency to left side of PR
            const startX = startNode.x + startNode.width;
            const startY = startNode.y + startNode.height / 2;
            const endX = endNode.x;
            const endY = endNode.y + endNode.height / 2;

            // Control points for Bezier curve
            const cp1X = startX + (endX - startX) / 2;
            const cp1Y = startY;
            const cp2X = startX + (endX - startX) / 2;
            const cp2Y = endY;

            // Check if dependency is open (means blocked)
            const depPR = prs.find(p => p._id.toString() === depId.toString());
            const isBlocked = depPR && depPR.state === 'open';

            newLines.push({
              path: `M ${startX} ${startY} C ${cp1X} ${cp1Y}, ${cp2X} ${cp2Y}, ${endX} ${endY}`,
              color: isBlocked ? '#f85149' : '#3fb950',
              dash: isBlocked ? '4,4' : 'none'
            });
          }
        });
      }
    });

    setLines(newLines);
  }, [graphPrs.length, windowWidth]);

  if (graphPrs.length === 0) {
    return (
      <div style={{
        padding: '32px',
        textAlign: 'center',
        color: '#8b949e',
        fontSize: '13px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '12px',
        backgroundColor: '#161b22',
        border: '1px solid #30363d',
        borderRadius: '6px'
      }}>
        <Link2 size={24} color="#8b949e" />
        <p>No dependency chains to map. Link pull requests inside their details view.</p>
      </div>
    );
  }

  return (
    <div style={{
      padding: '24px',
      position: 'relative',
      overflowX: 'auto',
      minHeight: '320px',
      backgroundColor: '#161b22',
      border: '1px solid #30363d',
      borderRadius: '6px'
    }}>
      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#f0f6fc', marginBottom: '4px' }}>
          Dependency Flow Map
        </h3>
        <p style={{ fontSize: '12px', color: '#8b949e' }}>
          Trace execution flow. Solid green lines indicate ready paths; dashed red lines indicate active blocking paths.
        </p>
      </div>

      <div 
        ref={containerRef}
        style={{
          display: 'flex',
          gap: '60px',
          position: 'relative',
          padding: '20px 0',
          justifyContent: 'space-between',
          minWidth: '600px'
        }}
      >
        {/* SVG Drawing Layer */}
        <svg style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 0
        }}>
          {lines.map((line, index) => (
            <path
              key={index}
              d={line.path}
              fill="none"
              stroke={line.color}
              strokeWidth="2"
              strokeDasharray={line.dash}
              style={{ opacity: 0.8 }}
            />
          ))}
        </svg>

        {/* Columns representation */}
        {columns.map((columnPrs, colIdx) => (
          <div 
            key={colIdx} 
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '24px',
              zIndex: 1,
              flex: 1,
              maxWidth: '240px',
              justifyContent: 'center'
            }}
          >
            <div style={{
              fontSize: '11px',
              fontWeight: '600',
              textTransform: 'uppercase',
              color: '#8b949e',
              borderBottom: '1px solid #30363d',
              paddingBottom: '6px',
              letterSpacing: '0.05em',
              textAlign: 'center'
            }}>
              {colIdx === 0 ? 'Roots' : `Level ${colIdx}`}
            </div>

            {columnPrs.map(pr => {
              const hasBlocked = pr.dependencies && pr.dependencies.some(d => {
                const dep = prs.find(p => p._id.toString() === (d._id || d).toString());
                return dep && dep.state === 'open';
              });
              return (
                <div
                  key={pr._id}
                  data-pr-id={pr._id}
                  onClick={() => onSelectPr(pr)}
                  style={{
                    background: '#1f242c',
                    border: '1px solid',
                    borderColor: hasBlocked ? 'rgba(248, 81, 73, 0.4)' : '#30363d',
                    borderRadius: '6px',
                    padding: '12px 14px',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    position: 'relative'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#8b949e'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = hasBlocked ? 'rgba(248, 81, 73, 0.4)' : '#30363d'; }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <GitPullRequest size={13} color={hasBlocked ? '#f85149' : '#3fb950'} />
                    <span style={{ fontSize: '11px', fontWeight: '600', color: '#8b949e' }}>
                      #{pr.number}
                    </span>
                  </div>
                  <div style={{
                    fontSize: '12px',
                    fontWeight: '600',
                    color: '#c9d1d9',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {pr.title}
                  </div>
                  <div style={{ fontSize: '11px', color: '#8b949e', marginTop: '4px' }}>
                    {pr.repository ? pr.repository.repoName : 'repo'}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
