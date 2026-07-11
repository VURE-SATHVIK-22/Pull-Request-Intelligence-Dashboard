import React from 'react';
import { GitPullRequest, RefreshCw, Settings as SettingsIcon, Database, Cpu } from 'lucide-react';

export default function Navbar({ onOpenSettings, isSyncing, onSync, backendMode }) {
  return (
    <header className="flex justify-between items-center" style={{
      backgroundColor: '#161b22',
      borderBottom: '1px solid #30363d',
      padding: '12px 24px',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      width: '100%'
    }}>
      <div className="flex items-center gap-3">
        <div className="flex justify-center items-center" style={{
          background: '#0d1117',
          padding: '6px',
          borderRadius: '6px',
          border: '1px solid #30363d'
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <polygon points="12,3 3,20 21,20" stroke="#8b949e" strokeWidth="1.5" strokeLinejoin="round" fill="none"/>
            <line x1="0" y1="14" x2="8" y2="12" stroke="#c9d1d9" strokeWidth="1.5" strokeLinecap="round"/>
            <path d="M10 11 L24 8" stroke="#3fb950" strokeWidth="1.5" strokeLinecap="round"/>
            <path d="M11 13 L24 13" stroke="#a371f7" strokeWidth="1.5" strokeLinecap="round"/>
            <path d="M10 15 L24 18" stroke="#f85149" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </div>
        <div>
          <h1 className="text-base font-semibold text-white" style={{ letterSpacing: '-0.01em', display: 'flex', alignItems: 'center', gap: '8px' }}>
            PrismAI
          </h1>
          <p className="text-xs text-secondary">
            Intelligent Pull Request Tracker
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Backend mode indicator */}
        <div className="badge badge-outline" style={{
          color: backendMode === 'mongodb' ? '#3fb950' : '#d29922',
          borderColor: backendMode === 'mongodb' ? 'rgba(56, 139, 60, 0.4)' : 'rgba(210, 153, 34, 0.4)',
          background: backendMode === 'mongodb' ? 'rgba(56, 139, 60, 0.15)' : 'rgba(210, 153, 34, 0.15)',
          borderRadius: '6px',
          padding: '3px 8px',
          fontSize: '11px',
          height: '28px'
        }}>
          {backendMode === 'mongodb' ? <Database size={12} style={{ marginRight: '4px' }} /> : <Cpu size={12} style={{ marginRight: '4px' }} />}
          <span>{backendMode === 'mongodb' ? 'MongoDB Active' : 'Memory Sandbox'}</span>
        </div>

        {/* Sync Button */}
        <button 
          onClick={onSync} 
          disabled={isSyncing}
          className="btn btn-secondary"
          style={{ height: '28px', padding: '0 12px', fontSize: '12px' }}
        >
          <RefreshCw size={12} style={{
            animation: isSyncing ? 'spin 1s linear infinite' : 'none'
          }} />
          <span>{isSyncing ? 'Syncing...' : 'Sync Git'}</span>
        </button>

        {/* Settings trigger */}
        <button 
          onClick={onOpenSettings}
          className="btn btn-secondary"
          style={{ padding: '0 8px', height: '28px', width: '28px' }}
          aria-label="Settings"
        >
          <SettingsIcon size={14} />
        </button>
      </div>
    </header>
  );
}
