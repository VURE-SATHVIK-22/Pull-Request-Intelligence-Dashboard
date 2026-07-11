import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
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

  // Socket.io integration
  useEffect(() => {
    const socketUrl = import.meta.env.PROD ? window.location.origin : 'http://localhost:5000';
    const socket = io(socketUrl, { transports: ['websocket', 'polling'] });
    
    socket.on('prUpdated', () => {
      console.log('Real-time update: PR updated');
      fetchPRsList(selectedRepo?._id, stateFilter, statusFilter, searchQuery, false);
    });

    socket.on('syncComplete', () => {
      console.log('Real-time update: Sync complete');
      fetchPRsList(selectedRepo?._id, stateFilter, statusFilter, searchQuery, false);
      setIsSyncing(false);
    });

    return () => {
      socket.disconnect();
    };
  }, [selectedRepo, stateFilter, statusFilter, searchQuery]);

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

  const fetchPRsList = async (repoId, state, status, search, setLoader = true) => {
    if (setLoader) setIsLoading(true);
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
    } finally {
      if (setLoader) setIsLoading(false);
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
    } catch (err) {
      alert('Sync failed: ' + err.message);
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
    
    // Real-time events will trigger a refresh, but we update locally for fast UI
    setSelectedPr(data.pr);
  };

  const handleDeleteDependency = async (prId, depId) => {
    const res = await fetch(`/api/prs/${prId}/dependencies/${depId}`, {
      method: 'DELETE'
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to delete dependency');
    
    setSelectedPr(data.pr);
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
    fetchPRsList(selectedRepo?._id, stateFilter, statusFilter, searchQuery);
  };

  return (
    <div className="flex" style={{ flexDirection: 'column', minHeight: '100vh', paddingBottom: '2.5rem' }}>
      
      {/* Navbar */}
      <Navbar 
        onOpenSettings={() => setIsSettingsOpen(true)}
        isSyncing={isSyncing}
        onSync={handleSync}
        backendMode={backendMode}
      />

      {/* Main Content Layout */}
      <div className="flex" style={{ margin: '24px', gap: '24px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
        
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
        <div className="flex" style={{ flex: '3 1 600px', flexDirection: 'column', gap: '16px' }}>
          
          {/* GitHub-like Filter and Search Bar */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            backgroundColor: '#161b22',
            border: '1px solid #30363d',
            borderRadius: '6px',
            padding: '16px'
          }}>
            <div className="flex justify-between items-center" style={{ gap: '12px', flexWrap: 'wrap' }}>
              {/* Search Form */}
              <form onSubmit={handleSearchSubmit} className="flex items-center" style={{ position: 'relative', flex: '1 1 300px' }}>
                <input
                  type="text"
                  placeholder="Search PR title, author, branch..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    background: '#0d1117',
                    border: '1px solid #30363d',
                    padding: '6px 12px 6px 32px',
                    borderRadius: '6px',
                    color: '#c9d1d9',
                    fontSize: '14px',
                    height: '32px'
                  }}
                />
                <Search size={14} className="text-secondary" style={{ position: 'absolute', left: '10px' }} />
              </form>

              {/* View Map Toggle & Filter Reset */}
              <div className="flex gap-2">
                <button
                  onClick={() => setShowMap(!showMap)}
                  className="btn btn-secondary"
                  style={{
                    height: '32px',
                    padding: '0 12px',
                    fontSize: '13px',
                    borderColor: showMap ? '#58a6ff' : '#30363d',
                    background: showMap ? 'rgba(88, 166, 255, 0.15)' : '',
                    color: showMap ? '#58a6ff' : '#c9d1d9'
                  }}
                >
                  {showMap ? <Grid size={14} style={{ marginRight: '6px' }} /> : <Map size={14} style={{ marginRight: '6px' }} />}
                  <span>{showMap ? 'List View' : 'Flow Map'}</span>
                </button>
              </div>
            </div>

            {/* GitHub Style List Filter Bar */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderTop: '1px solid #30363d',
              paddingTop: '12px',
              marginTop: '4px',
              flexWrap: 'wrap',
              gap: '12px'
            }}>
              {/* State Tabs */}
              <div className="flex gap-1">
                {[
                  { id: 'open', label: 'Open' },
                  { id: 'merged', label: 'Merged' },
                  { id: 'closed', label: 'Closed' },
                  { id: 'all', label: 'All PRs' }
                ].map((state) => (
                  <button
                    key={state.id}
                    onClick={() => { setStateFilter(state.id); setStatusFilter(''); }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: stateFilter === state.id ? '#f0f6fc' : '#8b949e',
                      padding: '4px 10px',
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontWeight: stateFilter === state.id ? '600' : 'normal',
                      borderRadius: '6px',
                      transition: 'background-color 0.15s'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#21262d'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                  >
                    {state.label}
                  </button>
                ))}
              </div>

              {/* Dependency State Filter (Only if open state selected) */}
              {stateFilter === 'open' && (
                <div className="flex items-center gap-2">
                  <span style={{ fontSize: '12px', color: '#8b949e' }}>Dependency:</span>
                  <div className="flex gap-1" style={{ background: '#0d1117', padding: '2px', borderRadius: '6px', border: '1px solid #30363d' }}>
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
                          background: statusFilter === btn.value ? '#21262d' : 'transparent',
                          border: 'none',
                          color: statusFilter === btn.value ? '#f0f6fc' : '#8b949e',
                          padding: '3px 8px',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '11px',
                          fontWeight: statusFilter === btn.value ? '600' : 'normal'
                        }}
                      >
                        {btn.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Map Flow Vis */}
          {showMap && (
            <DependencyGraph 
              prs={prs}
              onSelectPr={(pr) => setSelectedPr(pr)}
            />
          )}

          {/* List Display Grid */}
          {isLoading ? (
            <div className="flex justify-center items-center" style={{ minHeight: '200px' }}>
              <div className="spinner" />
            </div>
          ) : prs.length > 0 ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
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
            <div className="glass-panel flex justify-center items-center" style={{
              padding: '3.75rem 1.25rem',
              textAlign: 'center',
              flexDirection: 'column',
              color: 'var(--text-secondary)',
              gap: '0.75rem'
            }}>
              <GitPullRequest size={36} className="text-muted" />
              <h3 className="text-base font-bold text-primary">No Pull Requests Found</h3>
              <p className="text-sm" style={{ maxWidth: '300px', lineHeight: '1.5' }}>
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
