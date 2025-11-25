import React from 'react';
import { useConversation } from '../context/ConversationContext';
import { X, HelpCircle, Clock, AlertCircle, CheckCircle } from './Icons';

function formatRelativeTime(date) {
  const now = new Date();
  const diff = now - date;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  return `${hours}h ago`;
}

const TYPE_CONFIG = {
  question: { icon: HelpCircle, label: 'Question', className: 'question' },
  pending: { icon: Clock, label: 'Pending', className: 'pending' },
  error: { icon: AlertCircle, label: 'Error', className: 'error' },
};

function ThreadItem({ thread, onResolve }) {
  const config = TYPE_CONFIG[thread.type] || TYPE_CONFIG.pending;
  const Icon = config.icon;

  return (
    <div className="thread-item">
      <div className="thread-item-header">
        <span className={`thread-item-type ${config.className}`}>
          <Icon style={{ width: 10, height: 10, marginRight: 4, display: 'inline' }} />
          {config.label}
        </span>
        <span className="thread-item-time">{formatRelativeTime(thread.timestamp)}</span>
      </div>
      <div className="thread-item-title">{thread.title}</div>
      <div className="thread-item-preview">{thread.preview}</div>
      {!thread.resolved && (
        <button
          onClick={() => onResolve(thread.id)}
          style={{
            marginTop: 8,
            padding: '4px 8px',
            fontSize: 11,
            background: 'var(--bg-hover)',
            border: '1px solid var(--border-primary)',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          <CheckCircle style={{ width: 12, height: 12 }} />
          Mark Resolved
        </button>
      )}
    </div>
  );
}

export default function RightPanel({ onClose }) {
  const { threads, resolveThread } = useConversation();
  const unresolvedThreads = threads.filter((t) => !t.resolved);

  return (
    <div className="right-panel">
      <div className="right-panel-header">
        <span className="right-panel-title">
          Open Threads
          {unresolvedThreads.length > 0 && (
            <span
              className="sidebar-badge"
              style={{ marginLeft: 8 }}
            >
              {unresolvedThreads.length}
            </span>
          )}
        </span>
        <button className="icon-button" onClick={onClose}>
          <X style={{ width: 16, height: 16 }} />
        </button>
      </div>

      <div className="right-panel-content">
        {unresolvedThreads.length === 0 ? (
          <div className="empty-state" style={{ padding: 20, height: 'auto' }}>
            <CheckCircle
              style={{
                width: 40,
                height: 40,
                color: 'var(--accent-green)',
                marginBottom: 12,
                opacity: 0.7,
              }}
            />
            <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>
              All caught up!
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
              No unresolved questions or pending items.
            </div>
          </div>
        ) : (
          unresolvedThreads.map((thread) => (
            <ThreadItem
              key={thread.id}
              thread={thread}
              onResolve={resolveThread}
            />
          ))
        )}
      </div>

      <div style={{ padding: 16, borderTop: '1px solid var(--border-primary)' }}>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase' }}>
          Quick Actions
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <button
            style={{
              padding: '8px 12px',
              background: 'var(--bg-tertiary)',
              border: '1px solid var(--border-primary)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-primary)',
              fontSize: 12,
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            Jump to first unanswered question
          </button>
          <button
            style={{
              padding: '8px 12px',
              background: 'var(--bg-tertiary)',
              border: '1px solid var(--border-primary)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-primary)',
              fontSize: 12,
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            Show all tool calls
          </button>
          <button
            style={{
              padding: '8px 12px',
              background: 'var(--bg-tertiary)',
              border: '1px solid var(--border-primary)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-primary)',
              fontSize: 12,
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            Export conversation
          </button>
        </div>
      </div>
    </div>
  );
}
