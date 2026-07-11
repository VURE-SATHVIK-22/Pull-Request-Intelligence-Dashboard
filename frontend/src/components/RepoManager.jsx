import React, { useState } from 'react';
import { Plus, Trash2, GitBranch, FolderGit, BookOpen } from 'lucide-react';

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
    <div className="glass-panel flex" style={{
      padding: '16px',
      flexDirection: 'column',
      gap: '16px',
      height: 'fit-content',
      minWidth: '280px',
      border: '1px solid #30363d',
      backgroundColor: '#161b22',
      borderRadius: '6px'
    }}>
      <div>
        <h3 className="text-sm font-semibold text-white" style={{ marginBottom: '4px' }}>
          Repositories
        </h3>
        <p className="text-xs text-secondary">
          Track and filter branches.
        </p>
      </div>

      {/* Add Repo Form */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          placeholder="owner/repo"
          value={newRepoName}
          onChange={(e) => setNewRepoName(e.target.value)}
          disabled={isSubmitting}
          style={{
            flex: 1,
            background: '#0d1117',
            border: '1px solid #30363d',
            padding: '5px 12px',
            borderRadius: '6px',
            color: '#c9d1d9',
            fontSize: '13px'
          }}
        />
        <button
          type="submit"
          disabled={isSubmitting || !newRepoName.includes('/')}
          className="btn btn-primary"
          style={{
            padding: '5px 12px',
            fontSize: '13px',
            opacity: (!newRepoName.includes('/') || isSubmitting) ? 0.5 : 1
          }}
        >
          <Plus size={14} />
        </button>
      </form>

      {/* Repos list */}
      <div className="flex" style={{ flexDirection: 'column', gap: '2px' }}>
        {/* All Repos Option */}
        <button
          onClick={() => onSelectRepo(null)}
          className="flex items-center gap-2"
          style={{
            padding: '6px 12px',
            borderRadius: '6px',
            border: 'none',
            background: selectedRepo === null ? '#21262d' : 'transparent',
            color: selectedRepo === null ? '#f0f6fc' : '#8b949e',
            textAlign: 'left',
            width: '100%',
            cursor: 'pointer',
            fontWeight: selectedRepo === null ? '600' : 'normal'
          }}
          onMouseEnter={(e) => { if (selectedRepo !== null) e.currentTarget.style.backgroundColor = '#1f242c'; }}
          onMouseLeave={(e) => { if (selectedRepo !== null) e.currentTarget.style.backgroundColor = 'transparent'; }}
        >
          <FolderGit size={14} color={selectedRepo === null ? '#58a6ff' : '#8b949e'} />
          <span className="text-sm">All Repositories</span>
        </button>

        {repos.map((repo) => {
          const isSelected = selectedRepo?._id === repo._id;
          return (
            <div 
              key={repo._id} 
              className="flex justify-between items-center"
              style={{
                borderRadius: '6px',
                background: isSelected ? '#21262d' : 'transparent',
                transition: 'background-color 0.15s'
              }}
              onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.backgroundColor = '#1f242c'; }}
              onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent'; }}
            >
              <button
                onClick={() => onSelectRepo(repo)}
                className="flex items-center gap-2"
                style={{
                  background: 'none',
                  border: 'none',
                  color: isSelected ? '#f0f6fc' : '#8b949e',
                  textAlign: 'left',
                  cursor: 'pointer',
                  flex: 1,
                  padding: '6px 12px',
                  overflow: 'hidden',
                  fontWeight: isSelected ? '600' : 'normal'
                }}
              >
                <BookOpen size={14} color={isSelected ? '#58a6ff' : '#8b949e'} style={{ flexShrink: 0 }} />
                <span className="text-sm" style={{ 
                  whiteSpace: 'nowrap', 
                  overflow: 'hidden', 
                  textOverflow: 'ellipsis',
                  maxWidth: '150px'
                }}>
                  {repo.owner}/{repo.repoName}
                </span>
                {repo.openPrCount > 0 && (
                  <span className="badge" style={{
                    fontSize: '11px',
                    background: '#30363d',
                    color: '#8b949e',
                    padding: '0 6px',
                    marginLeft: 'auto',
                    borderRadius: '2em'
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
                className="flex justify-center items-center"
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#8b949e',
                  cursor: 'pointer',
                  padding: '6px',
                  borderRadius: '6px',
                  marginRight: '6px',
                  transition: 'all 0.15s'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.color = '#f85149'; e.currentTarget.style.backgroundColor = 'rgba(248, 81, 73, 0.15)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = '#8b949e'; e.currentTarget.style.backgroundColor = 'transparent'; }}
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

