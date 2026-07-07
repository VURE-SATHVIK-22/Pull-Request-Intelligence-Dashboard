import React from 'react';
import { GitPullRequest, RefreshCw, Settings as SettingsIcon, Database, Cpu } from 'lucide-react';

export default function Navbar({ onOpenSettings, isSyncing, onSync, backendMode }) {
  return (
    <header className="glass-panel" style={{
      margin: '20px 20px 10px 20px',
      padding: '16px 24px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      position: 'sticky',
      top: '20px',
      zIndex: 100
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{
          background: 'var(--accent-gradient)',
          padding: '10px',
          borderRadius: '12px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)'
        }}>
          <GitPullRequest size={24} color="#fff" />
        </div>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: '700', letterSpacing: '-0.02em', background: 'linear-gradient(to right, #fff, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            PrismAI
          </h1>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '500' }}>
            Intelligent Pull Request Tracker
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {/* Backend mode indicator */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          background: 'var(--bg-tertiary)',
          padding: '6px 12px',
          borderRadius: '20px',
          fontSize: '12px',
          fontWeight: '600',
          border: '1px solid var(--border-light)',
          color: backendMode === 'mongodb' ? '#10b981' : '#f59e0b'
        }}>
          {backendMode === 'mongodb' ? <Database size={14} /> : <Cpu size={14} />}
          <span>{backendMode === 'mongodb' ? 'MongoDB Active' : 'Memory Sandbox'}</span>
        </div>

        {/* Sync Button */}
        <button 
          onClick={onSync} 
          disabled={isSyncing}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'var(--bg-tertiary)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-light)',
            padding: '8px 16px',
            borderRadius: '10px',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: '600',
            transition: 'all 0.2s'
          }}
          className="nav-btn"
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent-blue)'; e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.1)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-light)'; e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'; }}
        >
          <RefreshCw size={14} className={isSyncing ? 'spin-anim' : ''} style={{
            animation: isSyncing ? 'spin 1s linear infinite' : 'none'
          }} />
          <span>{isSyncing ? 'Syncing...' : 'Sync Git'}</span>
        </button>

        {/* Settings trigger */}
        <button 
          onClick={onOpenSettings}
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            background: 'var(--bg-tertiary)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-light)',
            padding: '10px',
            borderRadius: '10px',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent-purple)'; e.currentTarget.style.backgroundColor = 'rgba(139, 92, 246, 0.1)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-light)'; e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'; }}
        >
          <SettingsIcon size={16} />
        </button>
      </div>
    </header>
  );
}
