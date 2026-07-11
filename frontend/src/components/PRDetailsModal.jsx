import React, { useState } from 'react';
import { X, Sparkles, Link as LinkIcon, Trash2, Plus, CornerDownRight, ShieldAlert, FileText, Check, GitPullRequest, GitMerge, GitBranch, Calendar } from 'lucide-react';

export default function PRDetailsModal({ pr, allPrs, onClose, onAddDependency, onDeleteDependency, onGenerateSummary }) {
  const [activeTab, setActiveTab] = useState('summary'); // summary | diff | dependencies
  const [selectedDepId, setSelectedDepId] = useState('');
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [isLinking, setIsLinking] = useState(false);

  if (!pr) return null;

  const isOpen = pr.state === 'open';
  const isMerged = pr.state === 'merged';
  const isClosed = pr.state === 'closed';

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
      case 'critical': return '#f85149';
      case 'high': return '#f85149';
      case 'medium': return '#d29922';
      case 'low': return '#58a6ff';
      default: return '#8b949e';
    }
  };

  const getImpactBg = (score) => {
    switch (score?.toLowerCase()) {
      case 'critical': return 'rgba(248, 81, 73, 0.15)';
      case 'high': return 'rgba(248, 81, 73, 0.15)';
      case 'medium': return 'rgba(210, 153, 34, 0.15)';
      case 'low': return 'rgba(88, 166, 255, 0.15)';
      default: return 'rgba(139, 148, 158, 0.15)';
    }
  };

  const getStatusColor = () => {
    if (isMerged) return '#a371f7';
    if (isClosed) return '#f85149';
    return '#3fb950';
  };

  const getStatusBg = () => {
    if (isMerged) return 'rgba(137, 87, 229, 0.15)';
    if (isClosed) return 'rgba(248, 81, 73, 0.15)';
    return 'rgba(56, 139, 60, 0.15)';
  };

  const getStatusBorder = () => {
    if (isMerged) return 'rgba(137, 87, 229, 0.4)';
    if (isClosed) return 'rgba(248, 81, 73, 0.4)';
    return 'rgba(56, 139, 60, 0.4)';
  };

  const getStatusIcon = () => {
    if (isMerged) return <GitMerge size={14} color="#ffffff" />;
    return <GitPullRequest size={14} color="#ffffff" />;
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
      zIndex: 1000,
      padding: '20px'
    }}>
      <div className="glass-panel animate-fade-in" style={{
        width: '100%',
        maxWidth: '920px',
        height: '92vh',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
        backgroundColor: '#0d1117',
        border: '1px solid #30363d',
        borderRadius: '6px'
      }}>
        {/* Top Header: Title, State, Branch info */}
        <div style={{ padding: '24px 24px 16px 24px', borderBottom: '1px solid #30363d', backgroundColor: '#161b22' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              <h2 style={{ fontSize: '24px', fontWeight: 'normal', lineHeight: '1.25', color: '#f0f6fc', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                <span>{pr.title}</span>
                <span style={{ color: '#8b949e', fontWeight: '300' }}>#{pr.number}</span>
              </h2>
            </div>

            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                color: '#8b949e',
                cursor: 'pointer',
                padding: '6px',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.15s'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#21262d'; e.currentTarget.style.color = '#f0f6fc'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#8b949e'; }}
            >
              <X size={18} />
            </button>
          </div>

          {/* GitHub Style State Info Banner */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginTop: '12px', borderBottom: '1px solid #21262d', paddingBottom: '16px' }}>
            <div style={{
              backgroundColor: getStatusColor(),
              color: '#ffffff',
              padding: '4px 12px',
              borderRadius: '2em',
              fontSize: '13px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              {getStatusIcon()}
              <span style={{ textTransform: 'capitalize' }}>{pr.state}</span>
            </div>
            
            <div style={{ fontSize: '13px', color: '#8b949e' }}>
              <span style={{ fontWeight: '600', color: '#c9d1d9' }}>{pr.author.username}</span> wants to merge branch{' '}
              <span style={{ fontFamily: 'var(--font-mono)', background: '#21262d', padding: '2px 6px', borderRadius: '4px', border: '1px solid #30363d', color: '#c9d1d9' }}>
                {pr.sourceBranch}
              </span>{' '}
              into{' '}
              <span style={{ fontFamily: 'var(--font-mono)', background: '#21262d', padding: '2px 6px', borderRadius: '4px', border: '1px solid #30363d', color: '#c9d1d9' }}>
                {pr.targetBranch}
              </span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="gh-tab-nav" style={{ padding: '0 24px', backgroundColor: '#161b22' }}>
          {[
            { id: 'summary', label: 'AI Review', icon: <Sparkles size={14} /> },
            { id: 'diff', label: 'Files changed', icon: <FileText size={14} /> },
            { id: 'dependencies', label: `Dependencies (${pr.dependencies ? pr.dependencies.length : 0})`, icon: <LinkIcon size={14} /> }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`gh-tab ${activeTab === tab.id ? 'active' : ''}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                height: '48px',
                outline: 'none'
              }}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Modal Scrollable Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', backgroundColor: '#0d1117' }}>
          
          {/* TAB 1: AI Code Summary - Styled exactly like GitHub Bot Comment */}
          {activeTab === 'summary' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', animation: 'fadeIn 0.15s ease-out' }}>
              {pr.aiSummary ? (
                <>
                  {/* Bot comment box */}
                  <div className="gh-comment">
                    <div className="gh-comment-header">
                      <div className="flex items-center gap-2">
                        <span className="author-name">gemini-ai-assistant</span> commented
                        <span className="badge" style={{ backgroundColor: '#21262d', border: '1px solid #30363d', color: '#8b949e', fontSize: '10px', padding: '0 6px', height: '18px', borderRadius: '4px' }}>
                          bot
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div style={{
                          background: getImpactBg(pr.aiSummary.impactScore),
                          border: `1px solid ${getImpactColor(pr.aiSummary.impactScore)}`,
                          color: getImpactColor(pr.aiSummary.impactScore),
                          padding: '1px 8px',
                          borderRadius: '2em',
                          fontSize: '11px',
                          fontWeight: '600'
                        }}>
                          Risk: {pr.aiSummary.impactScore}
                        </div>
                      </div>
                    </div>
                    
                    <div className="gh-comment-body">
                      {/* Summary Text */}
                      <p style={{ fontSize: '14px', lineHeight: '1.6', color: '#c9d1d9', marginBottom: '16px', fontWeight: 'normal' }}>
                        {pr.aiSummary.summary}
                      </p>

                      {/* Bullet points section */}
                      <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#f0f6fc', marginBottom: '12px', borderBottom: '1px solid #21262d', paddingBottom: '8px' }}>
                        Key Changes
                      </h3>
                      <ul style={{ display: 'flex', flexDirection: 'column', gap: '8px', listStyleType: 'none', paddingLeft: 0, marginBottom: '16px' }}>
                        {pr.aiSummary.bulletPoints.map((point, index) => (
                          <li key={index} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '13px', lineHeight: '1.5', color: '#c9d1d9' }}>
                            <Check size={14} color="#3fb950" style={{ flexShrink: 0, marginTop: '3px' }} />
                            <span>{point}</span>
                          </li>
                        ))}
                      </ul>

                      {/* Security/Impact Review */}
                      {pr.aiSummary.rawDiffAnalysis && (
                        <div style={{
                          background: 'rgba(248, 81, 73, 0.05)',
                          border: '1px solid rgba(248, 81, 73, 0.2)',
                          borderRadius: '6px',
                          padding: '12px 16px',
                          display: 'flex',
                          gap: '12px',
                          alignItems: 'flex-start',
                          marginTop: '16px'
                        }}>
                          <ShieldAlert size={18} color="#f85149" style={{ flexShrink: 0, marginTop: '2px' }} />
                          <div>
                            <h4 style={{ fontSize: '13px', fontWeight: '600', color: '#f85149', marginBottom: '4px' }}>
                              Security & Maintenance Analysis
                            </h4>
                            <p style={{ fontSize: '12px', lineHeight: '1.5', color: '#8b949e' }}>
                              {pr.aiSummary.rawDiffAnalysis}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '16px',
                  padding: '48px 0',
                  textAlign: 'center'
                }}>
                  <Sparkles size={36} color="#8b949e" style={{
                    animation: isGeneratingSummary ? 'spin 2s linear infinite' : 'none'
                  }} />
                  <div>
                    <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '6px', color: '#f0f6fc' }}>
                      Generate AI Summary Review
                    </h3>
                    <p style={{ fontSize: '13px', color: '#8b949e', maxWidth: '400px', lineHeight: '1.5' }}>
                      Get a detailed audit of modifications, file impact ratings, and security risks parsed by Gemini.
                    </p>
                  </div>
                  <button
                    onClick={handleGenerateAI}
                    disabled={isGeneratingSummary}
                    className="btn btn-primary"
                    style={{
                      padding: '8px 24px',
                      fontSize: '13px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <Sparkles size={14} />
                    <span>{isGeneratingSummary ? 'Summarizing Diff...' : 'Run Gemini Review'}</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: File Diff View - Styled like GitHub Files Changed */}
          {activeTab === 'diff' && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px', animation: 'fadeIn 0.15s ease-out' }}>
              <div style={{ fontSize: '13px', color: '#8b949e' }}>
                Showing raw pull request diff file changes:
              </div>
              
              <div className="gh-diff-file">
                <div className="gh-diff-header">
                  <span>diff --git a/source b/target</span>
                  <span style={{ color: '#8b949e' }}>
                    <span style={{ color: '#3fb950', marginRight: '8px' }}>+{pr.additions}</span>
                    <span style={{ color: '#f85149' }}>-{pr.deletions}</span>
                  </span>
                </div>
                <pre style={{
                  background: '#0d1117',
                  padding: '16px',
                  fontSize: '12px',
                  fontFamily: 'var(--font-mono)',
                  overflowX: 'auto',
                  lineHeight: '1.6',
                  whiteSpace: 'pre-wrap',
                  margin: 0
                }}>
                  {pr.diffText ? pr.diffText.split('\n').map((line, idx) => {
                    let color = '#c9d1d9';
                    let bg = 'transparent';
                    if (line.startsWith('+') && !line.startsWith('+++')) {
                      color = '#3fb950';
                      bg = 'rgba(56, 139, 60, 0.15)';
                    } else if (line.startsWith('-') && !line.startsWith('---')) {
                      color = '#f85149';
                      bg = 'rgba(248, 81, 73, 0.15)';
                    } else if (line.startsWith('@@')) {
                      color = '#58a6ff';
                      bg = 'rgba(88, 166, 255, 0.1)';
                    }
                    return (
                      <div key={idx} style={{ color, backgroundColor: bg, padding: '0 8px', borderRadius: '2px' }}>
                        {line}
                      </div>
                    );
                  }) : <div style={{ color: '#8b949e', fontStyle: 'italic' }}>// No diff code retrieved for this PR.</div>}
                </pre>
              </div>
            </div>
          )}

          {/* TAB 3: Dependencies Management */}
          {activeTab === 'dependencies' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', animation: 'fadeIn 0.15s ease-out' }}>
              
              {/* Linked dependencies */}
              <div>
                <h3 style={{ fontSize: '13px', fontWeight: '600', color: '#8b949e', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '12px' }}>
                  Current Dependencies
                </h3>
                
                {pr.dependencies && pr.dependencies.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {pr.dependencies.map((dep) => {
                      const depPR = allPrs.find(p => p._id.toString() === (dep._id || dep).toString());
                      if (!depPR) return null;

                      const isDepOpen = depPR.state === 'open';
                      const isDepMerged = depPR.state === 'merged';

                      return (
                        <div 
                          key={depPR._id} 
                          style={{
                            background: '#161b22',
                            border: '1px solid #30363d',
                            borderRadius: '6px',
                            padding: '12px 16px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <CornerDownRight size={14} color="#8b949e" />
                            <div>
                              <div style={{ fontSize: '13px', fontWeight: '600', color: '#f0f6fc' }}>
                                #{depPR.number} {depPR.title}
                              </div>
                              <div style={{ fontSize: '11px', color: '#8b949e', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ textTransform: 'none' }}>{depPR.repository ? `${depPR.repository.owner}/${depPR.repository.repoName}` : 'repo'}</span>
                                <span>•</span>
                                <span style={{
                                  color: isDepMerged ? '#a371f7' : isDepOpen ? '#3fb950' : '#f85149',
                                  fontWeight: '600'
                                }}>
                                  {depPR.state}
                                </span>
                              </div>
                            </div>
                          </div>

                          <button
                            onClick={() => {
                              if (confirm(`Remove dependency on PR #${depPR.number}?`)) {
                                onDeleteDependency(pr._id, depPR._id);
                              }
                            }}
                            className="flex justify-center items-center"
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#8b949e',
                              cursor: 'pointer',
                              padding: '8px',
                              borderRadius: '6px',
                              transition: 'all 0.15s'
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.color = '#f85149'; e.currentTarget.style.backgroundColor = 'rgba(248, 81, 73, 0.15)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.color = '#8b949e'; e.currentTarget.style.backgroundColor = 'transparent'; }}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p style={{ fontSize: '13px', color: '#8b949e', fontStyle: 'italic' }}>
                    This pull request has no defined dependencies.
                  </p>
                )}
              </div>

              {/* Link new dependency */}
              {pr.state === 'open' && (
                <div style={{ borderTop: '1px solid #30363d', paddingTop: '24px' }}>
                  <h3 style={{ fontSize: '13px', fontWeight: '600', color: '#8b949e', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '12px' }}>
                    Add Dependency Link
                  </h3>
                  
                  {candidatePRs.length > 0 ? (
                    <form onSubmit={handleAddDep} style={{ display: 'flex', gap: '10px' }}>
                      <select
                        value={selectedDepId}
                        onChange={(e) => setSelectedDepId(e.target.value)}
                        style={{
                          flex: 1,
                          background: '#0d1117',
                          border: '1px solid #30363d',
                          padding: '8px 12px',
                          borderRadius: '6px',
                          color: '#c9d1d9',
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
                        className="btn btn-primary"
                        style={{
                          padding: '8px 20px',
                          fontSize: '13px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          opacity: !selectedDepId || isLinking ? 0.5 : 1
                        }}
                      >
                        <Plus size={14} />
                        <span>Link Dependency</span>
                      </button>
                    </form>
                  ) : (
                    <p style={{ fontSize: '12px', color: '#8b949e' }}>
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
