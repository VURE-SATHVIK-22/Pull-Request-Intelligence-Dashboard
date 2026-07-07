import React from 'react';
import { Sparkles, AlertTriangle, CheckCircle, GitFork, ArrowRight, CornerDownRight } from 'lucide-react';

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
        color: 'var(--state-blocked)',
        bgColor: 'rgba(217, 70, 239, 0.12)',
        borderColor: 'rgba(217, 70, 239, 0.3)',
        pulse: true
      };
    } else if (dependencyCount > 0) {
      depBadge = {
        label: 'Ready',
        color: 'var(--state-ready)',
        bgColor: 'rgba(59, 130, 246, 0.12)',
        borderColor: 'rgba(59, 130, 246, 0.3)',
        pulse: false
      };
    }
  }

  const getStatusColor = () => {
    if (isMerged) return 'var(--state-merged)';
    if (isClosed) return 'var(--state-closed)';
    return 'var(--state-open)';
  };

  const getStatusBg = () => {
    if (isMerged) return 'rgba(16, 185, 129, 0.1)';
    if (isClosed) return 'rgba(239, 68, 68, 0.1)';
    return 'rgba(245, 158, 11, 0.1)';
  };

  const getStatusBorder = () => {
    if (isMerged) return 'rgba(16, 185, 129, 0.2)';
    if (isClosed) return 'rgba(239, 68, 68, 0.2)';
    return 'rgba(245, 158, 11, 0.2)';
  };

  return (
    <div 
      onClick={onClick}
      className={`glass-panel animate-fade-in ${depBadge?.pulse ? 'pulse-blocked' : ''}`}
      style={{
        padding: '20px',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
        position: 'relative',
        overflow: 'hidden',
        transition: 'transform 0.2s, border-color 0.2s',
        borderLeft: depBadge ? `4px solid ${depBadge.color}` : `1px solid var(--border-light)`
      }}
      onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
    >
      {/* Top Row: Repository name and Badges */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {pr.repository ? pr.repository.name : 'Unknown Repo'}
        </span>
        
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {/* AI summaries indicator */}
          {pr.aiSummary && (
            <div style={{
              background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(139, 92, 246, 0.15) 100%)',
              border: '1px solid rgba(139, 92, 246, 0.3)',
              borderRadius: '6px',
              padding: '4px 8px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              color: 'var(--accent-purple)',
              fontSize: '10px',
              fontWeight: '700'
            }}>
              <Sparkles size={11} />
              <span>AI</span>
            </div>
          )}

          {/* Dependency Badge */}
          {depBadge && (
            <div style={{
              background: depBadge.bgColor,
              border: `1px solid ${depBadge.borderColor}`,
              color: depBadge.color,
              borderRadius: '6px',
              padding: '4px 8px',
              fontSize: '10px',
              fontWeight: '700',
              textTransform: 'uppercase',
              letterSpacing: '0.02em',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              {depBadge.label === 'Blocked' ? <AlertTriangle size={10} /> : <CheckCircle size={10} />}
              <span>{depBadge.label}</span>
            </div>
          )}

          {/* State Badge */}
          <div style={{
            background: getStatusBg(),
            border: `1px solid ${getStatusBorder()}`,
            color: getStatusColor(),
            borderRadius: '6px',
            padding: '4px 8px',
            fontSize: '10px',
            fontWeight: '700',
            textTransform: 'uppercase',
            letterSpacing: '0.02em'
          }}>
            {pr.state}
          </div>
        </div>
      </div>

      {/* Title */}
      <div>
        <h4 style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-primary)', lineHeight: '1.4', display: 'inline' }}>
          #{pr.number} {pr.title}
        </h4>
      </div>

      {/* Branches */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: 'var(--text-secondary)' }}>
        <GitFork size={12} style={{ transform: 'rotate(180deg)' }} />
        <span style={{ fontFamily: 'monospace', background: 'var(--bg-tertiary)', padding: '2px 6px', borderRadius: '4px' }}>
          {pr.sourceBranch}
        </span>
        <ArrowRight size={12} color="var(--text-muted)" />
        <span style={{ fontFamily: 'monospace', background: 'var(--bg-tertiary)', padding: '2px 6px', borderRadius: '4px' }}>
          {pr.targetBranch}
        </span>
      </div>

      {/* Footer Info: Author and Diff Lines */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px', borderTop: '1px solid var(--border-light)', paddingTop: '12px' }}>
        {/* Author */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {pr.author.avatarUrl ? (
            <img 
              src={pr.author.avatarUrl} 
              alt={pr.author.username} 
              style={{ width: '20px', height: '20px', borderRadius: '50%', border: '1px solid var(--border-light)' }} 
            />
          ) : (
            <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'var(--bg-tertiary)' }} />
          )}
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '500' }}>
            {pr.author.username}
          </span>
        </div>

        {/* Line statistics */}
        <div style={{ display: 'flex', gap: '10px', fontSize: '11px', fontWeight: '700' }}>
          <span style={{ color: '#10b981' }}>+{pr.additions}</span>
          <span style={{ color: '#ef4444' }}>-{pr.deletions}</span>
        </div>
      </div>

      {/* Blocked dependency warnings list details */}
      {isOpen && hasOpenDependencies && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
          background: 'rgba(217, 70, 239, 0.04)',
          borderRadius: '8px',
          padding: '8px 10px',
          fontSize: '11px',
          color: 'var(--state-blocked)',
          border: '1px dashed rgba(217, 70, 239, 0.2)'
        }}>
          <span style={{ fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <AlertTriangle size={11} /> Blocked by:
          </span>
          {pr.dependencies.filter(dep => dep.state === 'open').map(dep => (
            <div key={dep._id} style={{ display: 'flex', alignItems: 'center', gap: '4px', paddingLeft: '8px' }}>
              <CornerDownRight size={10} />
              <span style={{ fontWeight: '500', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '240px' }}>
                #{dep.number} {dep.title} ({dep.repository ? dep.repository.repoName : 'repo'})
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
