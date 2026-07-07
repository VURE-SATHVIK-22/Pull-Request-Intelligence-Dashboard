import React, { useState } from 'react';
import { Plus, Trash2, GitBranch, FolderGit } from 'lucide-react';

export default function RepoManager({ repos, selectedRepo, onSelectRepo, onAddRepo, onDeleteRepo }) {
  const [newRepoName, setNewRepoName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newRepoName.trim() || !newRepoName.includes('/')) return;
    
    setIsSubmitting(true);
    try {
      await onAddRepo(newRepoName.trim());
      setNewRepoName('');
    } catch (err) {
      alert(err.message || 'Failed to add repository');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="glass-panel" style={{
      padding: '24px',
      display: 'flex',
      flexDirection: 'column',
      gap: '20px',
      height: 'fit-content',
      minWidth: '280px'
    }}>
      <div>
        <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '4px', letterSpacing: '-0.01em' }}>
          Repositories
        </h3>
        <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
          Track and filter branches.
        </p>
      </div>

      {/* Add Repo Form */}
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '8px' }}>
        <input
          type="text"
          placeholder="owner/repo"
          value={newRepoName}
          onChange={(e) => setNewRepoName(e.target.value)}
          disabled={isSubmitting}
          style={{
            flex: 1,
            background: 'var(--bg-tertiary)',
            border: '1px solid var(--border-light)',
            padding: '10px 12px',
            borderRadius: '10px',
            color: 'var(--text-primary)',
            fontSize: '13px',
            outline: 'none',
            transition: 'border-color 0.2s'
          }}
          onFocus={(e) => e.target.style.borderColor = 'var(--accent-blue)'}
          onBlur={(e) => e.target.style.borderColor = 'var(--border-light)'}
        />
        <button
          type="submit"
          disabled={isSubmitting || !newRepoName.includes('/')}
          style={{
            background: 'var(--accent-gradient)',
            border: 'none',
            color: '#fff',
            padding: '10px',
            borderRadius: '10px',
            cursor: 'pointer',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            opacity: (!newRepoName.includes('/') || isSubmitting) ? 0.5 : 1,
            transition: 'transform 0.2s'
          }}
        >
          <Plus size={16} />
        </button>
      </form>

      {/* Repos list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {/* All Repos Option */}
        <button
          onClick={() => onSelectRepo(null)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '10px 12px',
            borderRadius: '10px',
            border: '1px solid',
            borderColor: selectedRepo === null ? 'var(--accent-blue)' : 'transparent',
            background: selectedRepo === null ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
            color: selectedRepo === null ? 'var(--text-primary)' : 'var(--text-secondary)',
            textAlign: 'left',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: '600',
            width: '100%',
            transition: 'all 0.2s'
          }}
        >
          <FolderGit size={14} color={selectedRepo === null ? '#3b82f6' : '#94a3b8'} />
          <span>All Repositories</span>
        </button>

        {repos.map((repo) => {
          const isSelected = selectedRepo?._id === repo._id;
          return (
            <div 
              key={repo._id} 
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '4px 8px 4px 12px',
                borderRadius: '10px',
                border: '1px solid',
                borderColor: isSelected ? 'var(--accent-blue)' : 'transparent',
                background: isSelected ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                transition: 'all 0.2s'
              }}
            >
              <button
                onClick={() => onSelectRepo(repo)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  background: 'none',
                  border: 'none',
                  color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)',
                  textAlign: 'left',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: '600',
                  flex: 1,
                  padding: '6px 0',
                  overflow: 'hidden'
                }}
              >
                <GitBranch size={14} color={isSelected ? '#3b82f6' : '#64748b'} style={{ flexShrink: 0 }} />
                <span style={{ 
                  whiteSpace: 'nowrap', 
                  overflow: 'hidden', 
                  textOverflow: 'ellipsis',
                  maxWidth: '150px'
                }}>
                  {repo.owner}/{repo.repoName}
                </span>
                {repo.openPrCount > 0 && (
                  <span style={{
                    fontSize: '10px',
                    background: 'rgba(245, 158, 11, 0.15)',
                    color: 'var(--state-open)',
                    padding: '2px 6px',
                    borderRadius: '10px',
                    fontWeight: '700',
                    marginLeft: 'auto'
                  }}>
                    {repo.openPrCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => {
                  if (confirm(`Untrack ${repo.owner}/${repo.repoName} and remove all synced pull requests?`)) {
                    onDeleteRepo(repo._id);
                  }
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '8px',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.backgroundColor = 'transparent'; }}
              >
                <Trash2 size={12} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
