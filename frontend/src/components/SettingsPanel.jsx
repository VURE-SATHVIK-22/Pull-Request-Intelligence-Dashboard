import React, { useState, useEffect } from 'react';
import { X, Key, ShieldAlert } from 'lucide-react';

export default function SettingsPanel({ isOpen, onClose, settings, onSave }) {
  const [githubToken, setGithubToken] = useState('');
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (settings) {
      setGithubToken(settings.githubTokenMasked || '');
      setGeminiApiKey(settings.geminiApiKeyMasked || '');
    }
  }, [settings, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSave({ githubToken, geminiApiKey });
      onClose();
    } catch (err) {
      alert('Failed to save settings: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(1, 4, 9, 0.8)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000
    }}>
      <div className="glass-panel" style={{
        width: '100%',
        maxWidth: '480px',
        padding: '24px',
        position: 'relative',
        backgroundColor: '#161b22',
        border: '1px solid #30363d',
        borderRadius: '6px',
        animation: 'fadeIn 0.15s cubic-bezier(0, 0, 0.2, 1) forwards'
      }}>
        {/* Close trigger */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: 'none',
            border: 'none',
            color: '#8b949e',
            cursor: 'pointer',
            padding: '4px',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.15s'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#21262d'; e.currentTarget.style.color = '#f0f6fc'; }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#8b949e'; }}
        >
          <X size={16} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
          <Key size={18} color="#58a6ff" />
          <h2 style={{ fontSize: '16px', fontWeight: '600', color: '#f0f6fc' }}>API Settings</h2>
        </div>
        <p style={{ fontSize: '13px', color: '#8b949e', marginBottom: '20px' }}>
          Configure keys to pull repository diffs and run AI summarization.
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* GitHub Token Input */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '12px', fontWeight: '600', color: '#c9d1d9' }}>
              GitHub Personal Access Token (PAT)
            </label>
            <input
              type="password"
              placeholder={settings?.hasGithubToken ? '••••••••••••••••' : 'ghp_...'}
              value={githubToken}
              onChange={(e) => setGithubToken(e.target.value)}
              style={{
                background: '#0d1117',
                border: '1px solid #30363d',
                padding: '8px 12px',
                borderRadius: '6px',
                color: '#c9d1d9',
                fontSize: '13px',
                outline: 'none'
              }}
            />
            <span style={{ fontSize: '11px', color: '#8b949e' }}>
              Required to access private repositories or avoid high-volume GitHub API rate limits.
            </span>
          </div>

          {/* Gemini API Key Input */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '12px', fontWeight: '600', color: '#c9d1d9' }}>
              Gemini API Key (Google AI Studio)
            </label>
            <input
              type="password"
              placeholder={settings?.hasGeminiApiKey ? '••••••••••••••••' : 'AIzaSy...'}
              value={geminiApiKey}
              onChange={(e) => setGeminiApiKey(e.target.value)}
              style={{
                background: '#0d1117',
                border: '1px solid #30363d',
                padding: '8px 12px',
                borderRadius: '6px',
                color: '#c9d1d9',
                fontSize: '13px',
                outline: 'none'
              }}
            />
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '11px',
              color: '#8b949e',
              marginTop: '2px'
            }}>
              <span>Required for AI code reviews. Fallback logic operates if key is not set.</span>
            </div>
          </div>

          <div style={{
            display: 'flex',
            gap: '8px',
            background: 'rgba(88, 166, 255, 0.05)',
            border: '1px solid rgba(88, 166, 255, 0.2)',
            padding: '12px',
            borderRadius: '6px',
            alignItems: 'flex-start',
            marginTop: '8px'
          }}>
            <ShieldAlert size={16} color="#58a6ff" style={{ flexShrink: 0, marginTop: '2px' }} />
            <p style={{ fontSize: '11px', color: '#8b949e', lineHeight: '1.4' }}>
              Your credentials are saved on the local backend and never shared externally.
            </p>
          </div>

          {/* Submit Action */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn btn-primary"
            style={{
              padding: '8px 20px',
              fontSize: '13px',
              textAlign: 'center',
              marginTop: '10px'
            }}
          >
            {isSubmitting ? 'Saving Keys...' : 'Save Configuration'}
          </button>
        </form>
      </div>
    </div>
  );
}
