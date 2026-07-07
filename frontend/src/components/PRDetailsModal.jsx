import React, { useState } from 'react';
import { X, Sparkles, Link as LinkIcon, Trash2, Plus, CornerDownRight, ShieldAlert, FileText, Check } from 'lucide-react';

export default function PRDetailsModal({ pr, allPrs, onClose, onAddDependency, onDeleteDependency, onGenerateSummary }) {
  const [activeTab, setActiveTab] = useState('summary'); // summary | diff | dependencies
  const [selectedDepId, setSelectedDepId] = useState('');
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [isLinking, setIsLinking] = useState(false);

  if (!pr) return null;

  // Filter possible dependencies: open PRs, not this PR, and not already a dependency
  const currentDepIds = pr.dependencies ? pr.dependencies.map(d => (d._id || d).toString()) : [];
  const candidatePRs = allPrs.filter(p => 
    p.state === 'open' && 
    p._id.toString() !== pr._id.toString() && 
    !currentDepIds.includes(p._id.toString())
  );

  const handleAddDep = async (e) => {
    e.preventDefault();
    if (!selectedDepId) return;
    setIsLinking(true);
    try {
      await onAddDependency(pr._id, selectedDepId);
      setSelectedDepId('');
    } catch (err) {
      alert(err.message || 'Circular dependency or link error occurred');
    } finally {
      setIsLinking(false);
    }
  };

  const handleGenerateAI = async () => {
    setIsGeneratingSummary(true);
    try {
      await onGenerateSummary(pr._id);
    } catch (err) {
      alert('AI Summarizer Error: ' + err.message);
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  const getImpactColor = (score) => {
    switch (score?.toLowerCase()) {
      case 'critical': return '#d946ef';
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#3b82f6';
      default: return 'var(--text-muted)';
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
      zIndex: 1000,
      padding: '20px'
    }}>
      <div className="glass-panel animate-fade-in" style={{
        width: '100%',
        maxWidth: '840px',
        height: '90vh',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{ padding: '24px 30px', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {pr.repository ? pr.repository.name : 'Unknown Repo'}
              </span>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>•</span>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '600' }}>
                PR #{pr.number}
              </span>
            </div>
            <h2 style={{ fontSize: '18px', fontWeight: '700', lineHeight: '1.4', color: 'var(--text-primary)' }}>
              {pr.title}
            </h2>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '6px' }}>
              Opened by <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{pr.author.username}</span> • {pr.changedFilesCount} files changed
            </p>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'; e.currentTarget.style.color = '#fff'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div style={{
          display: 'flex',
          padding: '0 30px',
          borderBottom: '1px solid var(--border-light)',
          background: 'rgba(0,0,0,0.1)',
          gap: '24px'
        }}>
          {['summary', 'diff', 'dependencies'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                background: 'none',
                border: 'none',
                color: activeTab === tab ? 'var(--text-primary)' : 'var(--text-muted)',
                padding: '14px 0',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: '700',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              {tab === 'summary' && <Sparkles size={14} color={activeTab === 'summary' ? 'var(--accent-purple)' : undefined} />}
              {tab === 'diff' && <FileText size={14} />}
              {tab === 'dependencies' && <LinkIcon size={14} />}
              <span style={{ textTransform: 'capitalize' }}>
                {tab === 'summary' ? 'AI Review' : tab}
              </span>
              {activeTab === tab && (
                <div style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: '2px',
                  background: 'var(--accent-gradient)'
                }} />
              )}
            </button>
          ))}
        </div>

        {/* Modal Scrollable Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '30px', display: 'flex', flexDirection: 'column' }}>
          
          {/* TAB 1: AI Code Summary */}
          {activeTab === 'summary' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', animation: 'fadeIn 0.2s ease-out' }}>
              {pr.aiSummary ? (
                <>
                  {/* Summary & Impact Score Banner */}
                  <div className="glass-panel" style={{
                    padding: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    borderLeft: `4px solid ${getImpactColor(pr.aiSummary.impactScore)}`
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>
                        Gemini AI Assessment
                      </span>
                      <div style={{
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid var(--border-light)',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: '700',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}>
                        <span>Risk Impact:</span>
                        <span style={{ color: getImpactColor(pr.aiSummary.impactScore) }}>
                          {pr.aiSummary.impactScore}
                        </span>
                      </div>
                    </div>
                    
                    <p style={{ fontSize: '14px', lineHeight: '1.6', fontWeight: '500', color: 'var(--text-primary)' }}>
                      {pr.aiSummary.summary}
                    </p>
                  </div>

                  {/* Bullet points */}
                  <div>
                    <h3 style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '12px' }}>
                      Key Changes
                    </h3>
                    <ul style={{ display: 'flex', flexDirection: 'column', gap: '8px', listStyleType: 'none', paddingLeft: 0 }}>
                      {pr.aiSummary.bulletPoints.map((point, index) => (
                        <li key={index} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '13px', lineHeight: '1.5', color: 'var(--text-primary)' }}>
                          <Check size={14} color="#10b981" style={{ flexShrink: 0, marginTop: '3px' }} />
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Security/Impact Review */}
                  {pr.aiSummary.rawDiffAnalysis && (
                    <div style={{
                      background: 'rgba(239, 68, 68, 0.03)',
                      border: '1px solid rgba(239, 68, 68, 0.1)',
                      borderRadius: '12px',
                      padding: '16px 20px',
                      display: 'flex',
                      gap: '12px',
                      alignItems: 'flex-start',
                      marginTop: '10px'
                    }}>
                      <ShieldAlert size={18} color="#ef4444" style={{ flexShrink: 0, marginTop: '2px' }} />
                      <div>
                        <h4 style={{ fontSize: '13px', fontWeight: '700', color: '#ef4444', marginBottom: '4px' }}>
                          Security & Maintenance Analysis
                        </h4>
                        <p style={{ fontSize: '12px', lineHeight: '1.5', color: 'var(--text-secondary)' }}>
                          {pr.aiSummary.rawDiffAnalysis}
                        </p>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '16px',
                  padding: '40px 0',
                  textAlign: 'center'
                }}>
                  <Sparkles size={36} color="var(--text-muted)" className={isGeneratingSummary ? 'spin-anim' : ''} style={{
                    animation: isGeneratingSummary ? 'spin 2s linear infinite' : 'none'
                  }} />
                  <div>
                    <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '6px' }}>
                      Generate AI Summary Review
                    </h3>
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', maxWidth: '400px', lineHeight: '1.5' }}>
                      Get a detailed audit of modifications, file impact ratings, and security risks parsed by Gemini.
                    </p>
                  </div>
                  <button
                    onClick={handleGenerateAI}
                    disabled={isGeneratingSummary}
                    style={{
                      background: 'var(--accent-gradient)',
                      border: 'none',
                      color: '#fff',
                      padding: '10px 24px',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      fontWeight: '700',
                      fontSize: '13px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      boxShadow: '0 4px 12px rgba(139, 92, 246, 0.2)'
                    }}
                  >
                    <Sparkles size={14} />
                    <span>{isGeneratingSummary ? 'Summarizing Diff...' : 'Run Gemini Review'}</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: File Diff View */}
          {activeTab === 'diff' && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '14px', animation: 'fadeIn 0.2s ease-out' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                Showing raw pull request diff file changes:
              </div>
              <pre style={{
                background: '#040711',
                border: '1px solid var(--border-light)',
                borderRadius: '10px',
                padding: '16px 20px',
                fontSize: '12px',
                fontFamily: 'monospace',
                overflowX: 'auto',
                lineHeight: '1.6',
                whiteSpace: 'pre-wrap'
              }}>
                {pr.diffText ? pr.diffText.split('\n').map((line, idx) => {
                  let color = 'var(--text-primary)';
                  let bg = 'transparent';
                  if (line.startsWith('+') && !line.startsWith('+++')) {
                    color = '#10b981';
                    bg = 'rgba(16, 185, 129, 0.06)';
                  } else if (line.startsWith('-') && !line.startsWith('---')) {
                    color = '#ef4444';
                    bg = 'rgba(239, 68, 68, 0.06)';
                  } else if (line.startsWith('@@')) {
                    color = 'var(--accent-blue)';
                    bg = 'rgba(59, 130, 246, 0.03)';
                  }
                  return (
                    <div key={idx} style={{ color, backgroundColor: bg, padding: '0 4px' }}>
                      {line}
                    </div>
                  );
                }) : '// No diff code retrieved for this PR.'}
              </pre>
            </div>
          )}

          {/* TAB 3: Dependencies Management */}
          {activeTab === 'dependencies' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', animation: 'fadeIn 0.2s ease-out' }}>
              
              {/* Linked dependencies */}
              <div>
                <h3 style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '12px' }}>
                  Current Dependencies
                </h3>
                
                {pr.dependencies && pr.dependencies.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {pr.dependencies.map((dep) => {
                      const depPR = allPrs.find(p => p._id.toString() === (dep._id || dep).toString());
                      if (!depPR) return null;

                      return (
                        <div 
                          key={depPR._id} 
                          style={{
                            background: 'var(--bg-tertiary)',
                            border: '1px solid var(--border-light)',
                            borderRadius: '10px',
                            padding: '12px 16px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <CornerDownRight size={14} color="var(--text-muted)" />
                            <div>
                              <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>
                                #{depPR.number} {depPR.title}
                              </div>
                              <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px', textTransform: 'uppercase' }}>
                                {depPR.repository ? depPR.repository.repoName : 'repo'} • Status: {depPR.state}
                              </div>
                            </div>
                          </div>

                          <button
                            onClick={() => {
                              if (confirm(`Remove dependency on PR #${depPR.number}?`)) {
                                onDeleteDependency(pr._id, depPR._id);
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
                            <Trash2 size={13} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)', italic: 'true' }}>
                    This pull request has no defined dependencies.
                  </p>
                )}
              </div>

              {/* Link new dependency */}
              {pr.state === 'open' && (
                <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '24px' }}>
                  <h3 style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '12px' }}>
                    Add Dependency Link
                  </h3>
                  
                  {candidatePRs.length > 0 ? (
                    <form onSubmit={handleAddDep} style={{ display: 'flex', gap: '10px' }}>
                      <select
                        value={selectedDepId}
                        onChange={(e) => setSelectedDepId(e.target.value)}
                        style={{
                          flex: 1,
                          background: 'var(--bg-tertiary)',
                          border: '1px solid var(--border-light)',
                          padding: '12px',
                          borderRadius: '10px',
                          color: 'var(--text-primary)',
                          fontSize: '13px',
                          outline: 'none'
                        }}
                      >
                        <option value="">Select a pull request to depend on...</option>
                        {candidatePRs.map(p => (
                          <option key={p._id} value={p._id}>
                            #{p.number} {p.title} ({p.repository ? p.repository.repoName : 'repo'})
                          </option>
                        ))}
                      </select>

                      <button
                        type="submit"
                        disabled={isLinking || !selectedDepId}
                        style={{
                          background: 'var(--accent-gradient)',
                          border: 'none',
                          color: '#fff',
                          padding: '12px 20px',
                          borderRadius: '10px',
                          cursor: 'pointer',
                          fontWeight: '700',
                          fontSize: '13px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          opacity: !selectedDepId || isLinking ? 0.5 : 1
                        }}
                      >
                        <Plus size={14} />
                        <span>Link</span>
                      </button>
                    </form>
                  ) : (
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      No other open pull requests available to link as dependencies.
                    </p>
                  )}
                </div>
              )}

            </div>
          )}

        </div>
      </div>
    </div>
  );
}
