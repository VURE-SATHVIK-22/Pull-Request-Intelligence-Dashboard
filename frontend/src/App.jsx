import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import RepoManager from './components/RepoManager';
import PRCard from './components/PRCard';
import PRDetailsModal from './components/PRDetailsModal';
import DependencyGraph from './components/DependencyGraph';
import SettingsPanel from './components/SettingsPanel';
import { Search, GitPullRequest, SlidersHorizontal, Map, Grid, RefreshCw } from 'lucide-react';

export default function App() {
  // Data States
  const [repos, setRepos] = useState([]);
  const [prs, setPrs] = useState([]);
  const [settings, setSettings] = useState(null);
  const [backendMode, setBackendMode] = useState('mongodb'); // mongodb | memory

  // Navigation / Modal States
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [selectedPr, setSelectedPr] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showMap, setShowMap] = useState(true);

  // Filter States
  const [selectedRepo, setSelectedRepo] = useState(null);
  const [stateFilter, setStateFilter] = useState('open'); // open | merged | closed | all
  const [statusFilter, setStatusFilter] = useState(''); // '' | blocked | ready | standalone
  const [searchQuery, setSearchQuery] = useState('');

  // Initial Data Fetching
  const fetchData = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch settings
      const settingsRes = await fetch('/api/settings');
      const settingsData = await settingsRes.json();
      setSettings(settingsData);
      if (settingsData.mode) {
        setBackendMode(settingsData.mode);
      }

      // 2. Fetch repos
      const reposRes = await fetch('/api/repos');
      const reposData = await reposRes.json();
      setRepos(reposData);
      if (reposData.length > 0 && reposData[0].mode) {
        setBackendMode(reposData[0].mode);
      }

      // 3. Fetch PRs
      await fetchPRsList(selectedRepo?._id, stateFilter, statusFilter, searchQuery);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPRsList = async (repoId, state, status, search) => {
    try {
      let url = `/api/prs?`;
      if (repoId) url += `repository=${repoId}&`;
      if (state && state !== 'all') url += `state=${state}&`;
      if (status) url += `statusFilter=${status}&`;
      if (search) url += `search=${encodeURIComponent(search)}&`;

      const res = await fetch(url);
      const data = await res.json();
      setPrs(data);

      // Keep selected PR details in sync if modal is open
      if (selectedPr) {
        const updated = data.find(p => p._id.toString() === selectedPr._id.toString());
        if (updated) {
          // Fetch full populated record for detail view
          const detailRes = await fetch(`/api/prs/${selectedPr._id}`);
          const detailData = await detailRes.json();
          setSelectedPr(detailData);
        }
      }
    } catch (err) {
      console.error('Failed to fetch PR list:', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Fetch PRs whenever filters update
  useEffect(() => {
    fetchPRsList(selectedRepo?._id, stateFilter, statusFilter, searchQuery);
  }, [selectedRepo, stateFilter, statusFilter]);

  // Handle manual search form submit
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchPRsList(selectedRepo?._id, stateFilter, statusFilter, searchQuery);
  };

  // Sync GitHub PRs
  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const res = await fetch('/api/prs/sync', { method: 'POST' });
      const data = await res.json();
      await fetchPRsList(selectedRepo?._id, stateFilter, statusFilter, searchQuery);
      alert(`Sync complete! ${data.totalSynced || 0} pull requests updated.`);
    } catch (err) {
      alert('Sync failed: ' + err.message);
    } finally {
      setIsSyncing(false);
    }
  };

  // Repo Actions
  const handleAddRepo = async (name) => {
    const res = await fetch('/api/repos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to add repository');
    
    // Refresh
    const reposRes = await fetch('/api/repos');
    const reposData = await reposRes.json();
    setRepos(reposData);
    fetchPRsList(selectedRepo?._id, stateFilter, statusFilter, searchQuery);
  };

  const handleDeleteRepo = async (id) => {
    const res = await fetch(`/api/repos/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (!res.ok) alert(data.message || 'Failed to delete repo');

    // Reset selected repo filter if deleted
    if (selectedRepo?._id === id) {
      setSelectedRepo(null);
    }

    // Refresh
    const reposRes = await fetch('/api/repos');
    const reposData = await reposRes.json();
    setRepos(reposData);
    fetchPRsList(null, stateFilter, statusFilter, searchQuery);
  };

  // Settings Action
  const handleSaveSettings = async (keys) => {
    const res = await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(keys)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to save settings');
    setSettings(data);
    if (data.mode) {
      setBackendMode(data.mode);
    }
    alert('API configuration saved successfully.');
  };

  // PR Linker Actions
  const handleAddDependency = async (prId, dependencyId) => {
    const res = await fetch(`/api/prs/${prId}/dependencies`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dependencyId })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to link dependency');
    
    // Refresh modal details and main list
    setSelectedPr(data.pr);
    fetchPRsList(selectedRepo?._id, stateFilter, statusFilter, searchQuery);
  };

  const handleDeleteDependency = async (prId, depId) => {
    const res = await fetch(`/api/prs/${prId}/dependencies/${depId}`, {
      method: 'DELETE'
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to delete dependency');
    
    // Refresh modal details and main list
    setSelectedPr(data.pr);
    fetchPRsList(selectedRepo?._id, stateFilter, statusFilter, searchQuery);
  };

  // Gemini AI Summary Trigger
  const handleGenerateSummary = async (prId) => {
    const res = await fetch(`/api/ai/summarize/${prId}`, { method: 'POST' });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to run AI summary');

    // Update modal details
    if (selectedPr && selectedPr._id.toString() === prId.toString()) {
      setSelectedPr(prev => ({
        ...prev,
        aiSummary: data.aiSummary
      }));
    }
    // Refresh main list
    fetchPRsList(selectedRepo?._id, stateFilter, statusFilter, searchQuery);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', paddingBottom: '40px' }}>
      
      {/* Navbar */}
      <Navbar 
        onOpenSettings={() => setIsSettingsOpen(true)}
        isSyncing={isSyncing}
        onSync={handleSync}
        backendMode={backendMode}
      />

      {/* Main Content Layout */}
      <div style={{
        display: 'flex',
        margin: '10px 20px',
        gap: '20px',
        flexWrap: 'wrap',
        alignItems: 'flex-start'
      }}>
        
        {/* Left Sidebar Repository Panel */}
        <div style={{ flex: '1 1 280px', maxWidth: '320px' }}>
          <RepoManager 
            repos={repos}
            selectedRepo={selectedRepo}
            onSelectRepo={setSelectedRepo}
            onAddRepo={handleAddRepo}
            onDeleteRepo={handleDeleteRepo}
          />
        </div>

        {/* Right Dashboard Area */}
        <div style={{ flex: '3 1 600px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Dashboard Control Bar (Filters & Search) */}
          <div className="glass-panel" style={{
            padding: '20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '16px',
            flexWrap: 'wrap'
          }}>
            {/* Search Input */}
            <form onSubmit={handleSearchSubmit} style={{ display: 'flex', alignItems: 'center', position: 'relative', flex: '1 1 300px' }}>
              <input
                type="text"
                placeholder="Search PR title, author, branch..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--border-light)',
                  padding: '10px 16px 10px 42px',
                  borderRadius: '10px',
                  color: 'var(--text-primary)',
                  fontSize: '13px',
                  outline: 'none'
                }}
              />
              <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '16px' }} />
            </form>

            {/* View Mode Toggle (Map Flow vs List Grid) */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setShowMap(!showMap)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: showMap ? 'rgba(139, 92, 246, 0.12)' : 'var(--bg-tertiary)',
                  border: '1px solid',
                  borderColor: showMap ? 'var(--accent-purple)' : 'var(--border-light)',
                  color: showMap ? 'var(--text-primary)' : 'var(--text-secondary)',
                  padding: '8px 16px',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: '600'
                }}
              >
                {showMap ? <Grid size={14} /> : <Map size={14} />}
                <span>{showMap ? 'Show List Only' : 'Show Flow Map'}</span>
              </button>
            </div>
          </div>

          {/* Map Flow Vis */}
          {showMap && (
            <DependencyGraph 
              prs={prs}
              onSelectPr={(pr) => setSelectedPr(pr)}
            />
          )}

          {/* Filtering Categories Bar */}
          <div className="glass-panel" style={{
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '700', color: 'var(--text-secondary)' }}>
              <SlidersHorizontal size={14} />
              <span>Filters</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
              {/* PR State Selector */}
              <div style={{ display: 'flex', gap: '6px', background: 'var(--bg-tertiary)', padding: '4px', borderRadius: '10px', border: '1px solid var(--border-light)' }}>
                {['open', 'merged', 'closed', 'all'].map((state) => (
                  <button
                    key={state}
                    onClick={() => setStateFilter(state)}
                    style={{
                      background: stateFilter === state ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                      border: 'none',
                      color: stateFilter === state ? 'var(--text-primary)' : 'var(--text-secondary)',
                      padding: '6px 14px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: '700',
                      textTransform: 'capitalize'
                    }}
                  >
                    {state}
                  </button>
                ))}
              </div>

              {/* Dependency Status Filters */}
              {stateFilter === 'open' && (
                <div style={{ display: 'flex', gap: '6px', background: 'var(--bg-tertiary)', padding: '4px', borderRadius: '10px', border: '1px solid var(--border-light)' }}>
                  {[
                    { label: 'All', value: '' },
                    { label: 'Blocked', value: 'blocked' },
                    { label: 'Ready', value: 'ready' },
                    { label: 'Standalone', value: 'standalone' }
                  ].map((btn) => (
                    <button
                      key={btn.value}
                      onClick={() => setStatusFilter(btn.value)}
                      style={{
                        background: statusFilter === btn.value ? 'rgba(139, 92, 246, 0.15)' : 'transparent',
                        border: 'none',
                        color: statusFilter === btn.value ? 'var(--text-primary)' : 'var(--text-secondary)',
                        padding: '6px 14px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: '700'
                      }}
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* List Display Grid */}
          {isLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
              <div className="spinner" />
            </div>
          ) : prs.length > 0 ? (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: '20px'
            }}>
              {prs.map(pr => (
                <PRCard 
                  key={pr._id} 
                  pr={pr} 
                  onClick={() => setSelectedPr(pr)}
                />
              ))}
            </div>
          ) : (
            <div className="glass-panel" style={{
              padding: '60px 20px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-secondary)',
              gap: '12px'
            }}>
              <GitPullRequest size={36} color="var(--text-muted)" />
              <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)' }}>No Pull Requests Found</h3>
              <p style={{ fontSize: '13px', maxWidth: '300px', lineHeight: '1.5' }}>
                Try changing your filters or click "Sync Git" above to pull branches from GitHub.
              </p>
            </div>
          )}

        </div>
      </div>

      {/* Settings Modal */}
      <SettingsPanel 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSave={handleSaveSettings}
      />

      {/* PR Details Modal */}
      {selectedPr && (
        <PRDetailsModal 
          pr={selectedPr}
          allPrs={prs}
          onClose={() => setSelectedPr(null)}
          onAddDependency={handleAddDependency}
          onDeleteDependency={handleDeleteDependency}
          onGenerateSummary={handleGenerateSummary}
        />
      )}

    </div>
  );
}
