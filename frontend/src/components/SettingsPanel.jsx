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
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000
    }}>
      <div className="glass-panel" style={{
        width: '100%',
        maxWidth: '480px',
        padding: '30px',
        position: 'relative',
        animation: 'fadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards'
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
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            padding: '4px',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'; e.currentTarget.style.color = '#fff'; }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
        >
          <X size={16} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
          <Key size={20} color="var(--accent-purple)" />
          <h2 style={{ fontSize: '18px', fontWeight: '700' }}>API Settings</h2>
        </div>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '24px' }}>
          Configure keys to pull repository diffs and run AI summarization.
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* GitHub Token Input */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)' }}>
              GitHub Personal Access Token (PAT)
            </label>
            <input
              type="password"
              placeholder={settings?.hasGithubToken ? '••••••••••••••••' : 'ghp_...'}
              value={githubToken}
              onChange={(e) => setGithubToken(e.target.value)}
              style={{
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--border-light)',
                padding: '12px',
                borderRadius: '10px',
                color: 'var(--text-primary)',
                fontSize: '13px',
                outline: 'none'
              }}
            />
            <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
              Required to access private repositories or avoid high-volume GitHub API rate limits.
            </span>
          </div>

          {/* Gemini API Key Input */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)' }}>
              Gemini API Key (Google AI Studio)
            </label>
            <input
              type="password"
              placeholder={settings?.hasGeminiApiKey ? '••••••••••••••••' : 'AIzaSy...'}
              value={geminiApiKey}
              onChange={(e) => setGeminiApiKey(e.target.value)}
              style={{
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--border-light)',
                padding: '12px',
                borderRadius: '10px',
                color: 'var(--text-primary)',
                fontSize: '13px',
                outline: 'none'
              }}
            />
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '10px',
              color: 'var(--text-muted)',
              marginTop: '2px'
            }}>
              <span>Required for AI code reviews. Fallback logic operates if key is not set.</span>
            </div>
          </div>

          <div style={{
            display: 'flex',
            gap: '8px',
            background: 'rgba(59, 130, 246, 0.08)',
            border: '1px solid rgba(59, 130, 246, 0.15)',
            padding: '12px',
            borderRadius: '10px',
            alignItems: 'flex-start',
            marginTop: '8px'
          }}>
            <ShieldAlert size={16} color="var(--accent-blue)" style={{ flexShrink: 0, marginTop: '2px' }} />
            <p style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
              Your credentials are saved on the local backend and never shared externally.
            </p>
          </div>

          {/* Submit Action */}
          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              background: 'var(--accent-gradient)',
              border: 'none',
              color: '#fff',
              padding: '12px 20px',
              borderRadius: '10px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '13px',
              textAlign: 'center',
              boxShadow: '0 4px 12px rgba(139, 92, 246, 0.2)',
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
