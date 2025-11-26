import React from 'react';
import { useTerminal, PERMISSION_MODES } from '../context/TerminalContext';
import { Terminal, Sparkles, X, Plus, Zap } from './Icons';

export default function TabBar({ onNewTerminal, onNewClaude }) {
  const { sessions, activeSessionId, setActiveSessionId, closeTerminal } = useTerminal();

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        background: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border-primary)',
        height: 36,
        paddingLeft: 80, // Space for window controls on macOS
        gap: 0,
        overflow: 'hidden',
      }}
    >
      {/* Tab strip - scrollable */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          flex: 1,
          overflow: 'auto',
          gap: 1,
        }}
      >
        {sessions.map((tab) => {
          const isActive = activeSessionId === tab.id;
          const isYolo = tab.claudeMode === 'yolo';
          const isClaude = tab.isClaudeSession;

          return (
            <div
              key={tab.id}
              onClick={() => setActiveSessionId(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 12px',
                paddingRight: 6,
                background: isActive ? 'var(--bg-primary)' : 'transparent',
                borderBottom: isActive ? '2px solid var(--accent-primary)' : '2px solid transparent',
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: isActive ? 500 : 400,
                color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                whiteSpace: 'nowrap',
                minWidth: 0,
                maxWidth: 180,
              }}
            >
              {/* Icon */}
              {isClaude ? (
                isYolo ? (
                  <Zap style={{ width: 14, height: 14, color: 'var(--accent-orange)', flexShrink: 0 }} />
                ) : (
                  <Sparkles style={{ width: 14, height: 14, color: 'var(--accent-primary)', flexShrink: 0 }} />
                )
              ) : (
                <Terminal style={{ width: 14, height: 14, color: 'var(--text-muted)', flexShrink: 0 }} />
              )}

              {/* Title */}
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {tab.title}
              </span>

              {/* Close button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  closeTerminal(tab.id);
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  padding: 2,
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                  borderRadius: 'var(--radius-sm)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: isActive ? 1 : 0.5,
                  flexShrink: 0,
                }}
                onMouseEnter={(e) => e.target.style.background = 'var(--bg-tertiary)'}
                onMouseLeave={(e) => e.target.style.background = 'transparent'}
              >
                <X style={{ width: 12, height: 12 }} />
              </button>
            </div>
          );
        })}
      </div>

      {/* New tab buttons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 2, padding: '0 8px' }}>
        <button
          onClick={onNewTerminal}
          style={{
            background: 'transparent',
            border: 'none',
            padding: 6,
            cursor: 'pointer',
            color: 'var(--text-muted)',
            borderRadius: 'var(--radius-sm)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          title="New Terminal (Cmd+T)"
          onMouseEnter={(e) => e.target.style.background = 'var(--bg-tertiary)'}
          onMouseLeave={(e) => e.target.style.background = 'transparent'}
        >
          <Plus style={{ width: 14, height: 14 }} />
        </button>
        <button
          onClick={onNewClaude}
          style={{
            background: 'transparent',
            border: 'none',
            padding: 6,
            cursor: 'pointer',
            color: 'var(--accent-primary)',
            borderRadius: 'var(--radius-sm)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          title="New Claude Session"
          onMouseEnter={(e) => e.target.style.background = 'var(--bg-tertiary)'}
          onMouseLeave={(e) => e.target.style.background = 'transparent'}
        >
          <Sparkles style={{ width: 14, height: 14 }} />
        </button>
      </div>
    </div>
  );
}
