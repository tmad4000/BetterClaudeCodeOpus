import React, { useState, useEffect } from 'react';
import { Clock, Search, X, Copy, CheckCircle, Folder } from './Icons';

export default function PromptHistory({ isOpen, onClose, onSelectPrompt }) {
  const [prompts, setPrompts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [copiedId, setCopiedId] = useState(null);
  const [historyPath, setHistoryPath] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadPrompts();
      loadHistoryPath();
    }
  }, [isOpen]);

  const loadPrompts = async () => {
    if (!window.electronAPI) return;
    setIsLoading(true);
    try {
      const history = await window.electronAPI.getPromptHistory({ limit: 100 });
      setPrompts(history);
    } catch (error) {
      console.error('Failed to load prompt history:', error);
    }
    setIsLoading(false);
  };

  const loadHistoryPath = async () => {
    if (!window.electronAPI) return;
    try {
      const path = await window.electronAPI.getHistoryPath();
      setHistoryPath(path);
    } catch (error) {
      console.error('Failed to get history path:', error);
    }
  };

  const handleCopy = (prompt, id) => {
    navigator.clipboard.writeText(prompt);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredPrompts = searchQuery
    ? prompts.filter(p =>
        p.prompt.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.sessionTitle?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : prompts;

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;

    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;

    return date.toLocaleDateString();
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '90%',
          maxWidth: 700,
          maxHeight: '80vh',
          background: 'var(--bg-primary)',
          border: '1px solid var(--border-primary)',
          borderRadius: 'var(--radius-lg)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '16px 20px',
            borderBottom: '1px solid var(--border-primary)',
          }}
        >
          <Clock style={{ width: 20, height: 20, color: 'var(--accent-primary)' }} />
          <h2 style={{ flex: 1, margin: 0, fontSize: 16, fontWeight: 600 }}>
            Prompt History
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              padding: 4,
              cursor: 'pointer',
              color: 'var(--text-muted)',
            }}
          >
            <X style={{ width: 20, height: 20 }} />
          </button>
        </div>

        {/* Search */}
        <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--border-primary)' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 12px',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-primary)',
              borderRadius: 'var(--radius-md)',
            }}
          >
            <Search style={{ width: 16, height: 16, color: 'var(--text-muted)' }} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search prompts..."
              style={{
                flex: 1,
                background: 'transparent',
                border: 'none',
                outline: 'none',
                fontSize: 13,
                color: 'var(--text-primary)',
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{
                  background: 'transparent',
                  border: 'none',
                  padding: 2,
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                }}
              >
                <X style={{ width: 14, height: 14 }} />
              </button>
            )}
          </div>
        </div>

        {/* Prompts list */}
        <div style={{ flex: 1, overflow: 'auto', padding: '12px 20px' }}>
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
              Loading...
            </div>
          ) : filteredPrompts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
              {searchQuery ? 'No prompts match your search' : 'No prompt history yet'}
            </div>
          ) : (
            filteredPrompts.map((item, index) => (
              <div
                key={`${item.timestamp}-${index}`}
                style={{
                  padding: '12px 14px',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-primary)',
                  borderRadius: 'var(--radius-md)',
                  marginBottom: 8,
                  cursor: 'pointer',
                }}
                onClick={() => {
                  onSelectPrompt?.(item.prompt);
                  onClose();
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 10,
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 13,
                        color: 'var(--text-primary)',
                        marginBottom: 6,
                        lineHeight: 1.4,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                      }}
                    >
                      {item.prompt}
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        fontSize: 11,
                        color: 'var(--text-muted)',
                      }}
                    >
                      <span>{item.sessionTitle || `Session ${item.sessionId}`}</span>
                      <span>•</span>
                      <span>{formatDate(item.timestamp)}</span>
                      {item.cwd && (
                        <>
                          <span>•</span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Folder style={{ width: 12, height: 12 }} />
                            {item.cwd.split('/').slice(-2).join('/')}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopy(item.prompt, `${item.timestamp}-${index}`);
                    }}
                    style={{
                      background: 'var(--bg-tertiary)',
                      border: '1px solid var(--border-primary)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '6px 8px',
                      cursor: 'pointer',
                      color: copiedId === `${item.timestamp}-${index}`
                        ? 'var(--accent-green)'
                        : 'var(--text-muted)',
                    }}
                  >
                    {copiedId === `${item.timestamp}-${index}` ? (
                      <CheckCircle style={{ width: 14, height: 14 }} />
                    ) : (
                      <Copy style={{ width: 14, height: 14 }} />
                    )}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer with path info */}
        <div
          style={{
            padding: '12px 20px',
            borderTop: '1px solid var(--border-primary)',
            fontSize: 11,
            color: 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <Folder style={{ width: 12, height: 12 }} />
          History stored at: {historyPath}
        </div>
      </div>
    </div>
  );
}
