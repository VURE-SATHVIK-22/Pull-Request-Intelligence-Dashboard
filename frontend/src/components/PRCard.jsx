import React from 'react';
import { Sparkles, AlertTriangle, CheckCircle, GitFork, ArrowRight, CornerDownRight, GitPullRequest, GitMerge } from 'lucide-react';

export default function PRCard({ pr, onClick }) {
  const isOpen = pr.state === 'open';
  const isMerged = pr.state === 'merged';
  const isClosed = pr.state === 'closed';

  // Dependency evaluation
  const hasOpenDependencies = pr.dependencies && pr.dependencies.some(dep => dep.state === 'open');
  const dependencyCount = pr.dependencies ? pr.dependencies.length : 0;
  
  let depBadge = null;
  if (isOpen) {
    if (hasOpenDependencies) {
      depBadge = {
        label: 'Blocked',
        color: '#f85149',
        bgColor: 'rgba(248, 81, 73, 0.15)',
        borderColor: 'rgba(248, 81, 73, 0.4)',
        pulse: true
      };
    } else if (dependencyCount > 0) {
      depBadge = {
        label: 'Ready',
        color: '#58a6ff',
        bgColor: 'rgba(88, 166, 255, 0.15)',
        borderColor: 'rgba(88, 166, 255, 0.4)',
        pulse: false
      };
    }
  }

  const getStatusColor = () => {
    if (isMerged) return '#a371f7';
    if (isClosed) return '#f85149';
    return '#3fb950';
  };

  const getStatusBg = () => {
    if (isMerged) return 'rgba(137, 87, 229, 0.15)';
    if (isClosed) return 'rgba(248, 81, 73, 0.15)';
    return 'rgba(56, 139, 60, 0.15)';
  };

  const getStatusBorder = () => {
    if (isMerged) return 'rgba(137, 87, 229, 0.4)';
    if (isClosed) return 'rgba(248, 81, 73, 0.4)';
    return 'rgba(56, 139, 60, 0.4)';
  };

  const getStatusIcon = () => {
    if (isMerged) return <GitMerge size={16} color="#a371f7" />;
    return <GitPullRequest size={16} color={isOpen ? '#3fb950' : '#f85149'} />;
  };

  return (
    <div 
      onClick={onClick}
      className={`glass-panel animate-fade-in ${depBadge?.pulse ? 'pulse-blocked' : ''}`}
      style={{
        padding: '16px',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        position: 'relative',
        overflow: 'hidden',
        backgroundColor: '#161b22',
        border: '1px solid #30363d',
        borderRadius: '6px',
        borderLeft: depBadge ? `4px solid ${depBadge.color}` : `1px solid #30363d`,
        transition: 'all 0.15s'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = '#8b949e';
        const title = e.currentTarget.querySelector('.pr-title-text');
        if (title) title.style.color = '#58a6ff';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = depBadge ? '' : '#30363d';
        const title = e.currentTarget.querySelector('.pr-title-text');
        if (title) title.style.color = '#c9d1d9';
      }}
    >
      {/* Top Row: Repository name and Badges */}
      <div className="flex justify-between items-center">
        <span className="text-xs font-bold text-secondary" style={{ textTransform: 'none', letterSpacing: 'normal' }}>
          {pr.repository ? `${pr.repository.owner}/${pr.repository.repoName}` : 'Unknown Repo'}
        </span>
        
        <div className="flex items-center gap-2">
          {/* AI summaries indicator */}
          {pr.aiSummary && (
            <div className="badge" style={{
              background: 'rgba(163, 113, 247, 0.15)',
              border: '1px solid rgba(163, 113, 247, 0.4)',
              color: '#a371f7',
              borderRadius: '2em',
              fontSize: '11px',
              padding: '2px 8px'
            }}>
              <Sparkles size={10} style={{ marginRight: '2px' }} />
              <span>AI Summary</span>
            </div>
          )}

          {/* Dependency Badge */}
          {depBadge && (
            <div className="badge" style={{
              background: depBadge.bgColor,
              border: `1px solid ${depBadge.borderColor}`,
              color: depBadge.color,
              borderRadius: '2em',
              fontSize: '11px',
              padding: '2px 8px'
            }}>
              {depBadge.label === 'Blocked' ? <AlertTriangle size={10} style={{ marginRight: '2px' }} /> : <CheckCircle size={10} style={{ marginRight: '2px' }} />}
              <span>{depBadge.label}</span>
            </div>
          )}

          {/* State Badge */}
          <div className="badge" style={{
            background: getStatusBg(),
            border: `1px solid ${getStatusBorder()}`,
            color: getStatusColor(),
            borderRadius: '2em',
            fontSize: '11px',
            padding: '2px 8px',
            textTransform: 'capitalize'
          }}>
            {pr.state}
          </div>
        </div>
      </div>

      {/* Title */}
      <div className="flex items-start gap-2" style={{ marginTop: '2px' }}>
        <div style={{ marginTop: '2px', flexShrink: 0 }}>
          {getStatusIcon()}
        </div>
        <h4 className="pr-title-text text-sm font-semibold text-primary" style={{ lineHeight: '1.4', transition: 'color 0.15s' }}>
          {pr.title} <span style={{ color: '#8b949e', fontWeight: 'normal' }}>#{pr.number}</span>
        </h4>
      </div>

      {/* Branches */}
      <div className="flex items-center gap-2 text-xs text-secondary">
        <GitFork size={12} style={{ transform: 'rotate(180deg)', flexShrink: 0 }} />
        <span style={{ fontFamily: 'var(--font-mono)', background: '#21262d', padding: '2px 6px', borderRadius: '4px', border: '1px solid #30363d' }}>
          {pr.sourceBranch}
        </span>
        <ArrowRight size={12} className="text-secondary" style={{ opacity: 0.5 }} />
        <span style={{ fontFamily: 'var(--font-mono)', background: '#21262d', padding: '2px 6px', borderRadius: '4px', border: '1px solid #30363d' }}>
          {pr.targetBranch}
        </span>
      </div>

      {/* Footer Info: Author and Diff Lines */}
      <div className="flex justify-between items-center" style={{ marginTop: '4px', borderTop: '1px solid #21262d', paddingTop: '10px' }}>
        {/* Author */}
        <div className="flex items-center gap-2">
          {pr.author.avatarUrl ? (
            <img 
              src={pr.author.avatarUrl} 
              alt={pr.author.username} 
              style={{ width: '20px', height: '20px', borderRadius: '50%', border: '1px solid #30363d' }} 
            />
          ) : (
            <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#21262d' }} />
          )}
          <span className="text-xs font-medium text-secondary">
            {pr.author.username}
          </span>
        </div>

        {/* Line statistics */}
        <div className="flex gap-2 text-xs font-semibold">
          <span style={{ color: '#3fb950' }}>+{pr.additions}</span>
          <span style={{ color: '#f85149' }}>-{pr.deletions}</span>
        </div>
      </div>

      {/* Blocked dependency warnings list details */}
      {isOpen && hasOpenDependencies && (
        <div className="flex" style={{
          flexDirection: 'column',
          gap: '4px',
          background: 'rgba(248, 81, 73, 0.05)',
          borderRadius: '6px',
          padding: '8px 12px',
          fontSize: '11px',
          color: '#f85149',
          border: '1px solid rgba(248, 81, 73, 0.2)',
          marginTop: '4px'
        }}>
          <span className="font-semibold flex items-center gap-1">
            <AlertTriangle size={12} /> Blocked by open PRs:
          </span>
          {pr.dependencies.filter(dep => dep.state === 'open').map(dep => (
            <div key={dep._id} className="flex items-center gap-1" style={{ paddingLeft: '4px', color: '#c9d1d9' }}>
              <CornerDownRight size={10} color="#8b949e" />
              <span className="font-medium" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '240px' }}>
                #{dep.number} {dep.title}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

