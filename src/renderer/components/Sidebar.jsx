import React from 'react';
import { useConversation } from '../context/ConversationContext';
import { MessageSquare, Terminal, Plus, Settings, Sparkles, Folder } from './Icons';

function formatRelativeTime(date) {
  const now = new Date();
  const diff = now - date;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

export default function Sidebar({ viewMode, setViewMode }) {
  const { sessions, activeSession, setActiveSession } = useConversation();

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h1>
          <Sparkles style={{ width: 16, height: 16, color: 'var(--accent-primary)' }} />
          Better Claude Code
        </h1>
      </div>

      <div className="sidebar-section" style={{ paddingTop: 16 }}>
        <div style={{ padding: '0 8px', marginBottom: 16 }}>
          <button
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              padding: '10px 16px',
              background: 'var(--accent-primary)',
              color: 'white',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            <Plus style={{ width: 16, height: 16 }} />
            New Session
          </button>
        </div>

        <div className="sidebar-section-title">View Mode</div>
        <div style={{ display: 'flex', gap: 4, padding: '0 8px', marginBottom: 16 }}>
          <button
            className={`top-bar-tab ${viewMode === 'conversation' ? 'active' : ''}`}
            onClick={() => setViewMode('conversation')}
            style={{ flex: 1, justifyContent: 'center' }}
          >
            <MessageSquare style={{ width: 14, height: 14 }} />
            Chat
          </button>
          <button
            className={`top-bar-tab ${viewMode === 'split' ? 'active' : ''}`}
            onClick={() => setViewMode('split')}
            style={{ flex: 1, justifyContent: 'center' }}
          >
            Split
          </button>
          <button
            className={`top-bar-tab ${viewMode === 'terminal' ? 'active' : ''}`}
            onClick={() => setViewMode('terminal')}
            style={{ flex: 1, justifyContent: 'center' }}
          >
            <Terminal style={{ width: 14, height: 14 }} />
            Term
          </button>
        </div>

        <div className="sidebar-section-title">Sessions</div>
        {sessions.map((session) => (
          <div
            key={session.id}
            className={`sidebar-item ${activeSession === session.id ? 'active' : ''}`}
            onClick={() => setActiveSession(session.id)}
          >
            <MessageSquare className="sidebar-item-icon" />
            <div className="sidebar-item-content">
              <div className="sidebar-item-title">{session.title}</div>
              <div className="sidebar-item-meta">
                {session.messageCount} messages · {formatRelativeTime(session.timestamp)}
              </div>
            </div>
            {session.active && <span className="sidebar-badge">Active</span>}
          </div>
        ))}
      </div>

      <div style={{ padding: 16, borderTop: '1px solid var(--border-primary)' }}>
        <div
          className="sidebar-item"
          style={{ marginBottom: 0 }}
        >
          <Folder className="sidebar-item-icon" />
          <div className="sidebar-item-content">
            <div className="sidebar-item-title">~/projects/my-app</div>
            <div className="sidebar-item-meta">Current directory</div>
          </div>
        </div>
        <div
          className="sidebar-item"
          style={{ marginBottom: 0 }}
        >
          <Settings className="sidebar-item-icon" />
          <div className="sidebar-item-content">
            <div className="sidebar-item-title">Settings</div>
          </div>
        </div>
      </div>
    </div>
  );
}
