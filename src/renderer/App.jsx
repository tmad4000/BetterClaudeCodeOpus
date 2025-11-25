import React, { useState, useEffect, useCallback } from 'react';
import { ClaudeSessionProvider, useClaudeSession, PERMISSION_MODES } from './context/ClaudeSessionContext';
import { TerminalProvider } from './context/TerminalContext';
import ClaudeTerminal from './components/ClaudeTerminal';
import TerminalPanel from './components/TerminalPanel';
import ProcessTracker from './components/ProcessTracker';
import PrettyView from './components/PrettyView';
import PromptHistory from './components/PromptHistory';
import {
  Plus, X, Terminal, Sparkles, Folder,
  Shield, ShieldCheck, Zap, Clock, Code
} from './components/Icons';

function formatRelativeTime(timestamp) {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

// Permission mode icon component
function PermissionModeIcon({ mode, size = 16 }) {
  const iconStyle = { width: size, height: size };
  switch (mode) {
    case 'yolo':
      return <Zap style={iconStyle} />;
    case 'plan':
      return <ShieldCheck style={iconStyle} />;
    default:
      return <Shield style={iconStyle} />;
  }
}

// Permission mode selector component
function PermissionModeSelector({ currentMode, onSelect, onClose }) {
  return (
    <div
      style={{
        position: 'absolute',
        top: '100%',
        left: 0,
        marginTop: 4,
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-primary)',
        borderRadius: 'var(--radius-md)',
        padding: 8,
        minWidth: 220,
        zIndex: 100,
        boxShadow: 'var(--shadow-lg)',
      }}
    >
      {Object.entries(PERMISSION_MODES).map(([key, mode]) => (
        <div
          key={key}
          onClick={() => {
            onSelect(key);
            onClose();
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '10px 12px',
            borderRadius: 'var(--radius-sm)',
            cursor: 'pointer',
            background: currentMode === key ? 'var(--bg-tertiary)' : 'transparent',
            marginBottom: 2,
          }}
        >
          <div style={{ color: mode.color }}>
            <PermissionModeIcon mode={key} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>
              {mode.name}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              {mode.description}
            </div>
          </div>
          {currentMode === key && (
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: mode.color }} />
          )}
        </div>
      ))}
    </div>
  );
}

function Sidebar({ showTerminalPanel, setShowTerminalPanel, onShowHistory }) {
  const {
    sessions,
    activeSessionId,
    currentCwd,
    permissionMode,
    setActiveSessionId,
    setPermissionMode,
    createSession,
    closeSession,
    selectDirectory,
  } = useClaudeSession();

  const [showModeSelector, setShowModeSelector] = useState(false);
  const [showProcessTracker, setShowProcessTracker] = useState(false);

  const handleNewSession = async () => {
    await createSession();
  };

  const handleSelectDirectory = async () => {
    await selectDirectory();
  };

  const currentModeConfig = PERMISSION_MODES[permissionMode];

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h1>
          <Sparkles style={{ width: 16, height: 16, color: 'var(--accent-primary)' }} />
          Claude Code
        </h1>
      </div>

      <div className="sidebar-section" style={{ paddingTop: 16 }}>
        <div style={{ padding: '0 8px', marginBottom: 12 }}>
          <button
            onClick={handleNewSession}
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

        {/* Permission Mode Selector */}
        <div style={{ padding: '0 8px', marginBottom: 16, position: 'relative' }}>
          <div
            onClick={() => setShowModeSelector(!showModeSelector)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '10px 12px',
              background: 'var(--bg-tertiary)',
              border: '1px solid var(--border-primary)',
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer',
            }}
          >
            <div style={{ color: currentModeConfig.color }}>
              <PermissionModeIcon mode={permissionMode} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-primary)' }}>
                {currentModeConfig.name} Mode
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                Click to change
              </div>
            </div>
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: currentModeConfig.color,
                boxShadow: `0 0 8px ${currentModeConfig.color}`,
              }}
            />
          </div>

          {showModeSelector && (
            <PermissionModeSelector
              currentMode={permissionMode}
              onSelect={setPermissionMode}
              onClose={() => setShowModeSelector(false)}
            />
          )}
        </div>

        <div className="sidebar-section-title">Sessions</div>
        {sessions.length === 0 ? (
          <div style={{ padding: '12px 20px', color: 'var(--text-muted)', fontSize: 13 }}>
            No sessions yet. Click "New Session" to start.
          </div>
        ) : (
          sessions.map((session) => (
            <div
              key={session.id}
              className={`sidebar-item ${activeSessionId === session.id ? 'active' : ''}`}
              onClick={() => setActiveSessionId(session.id)}
            >
              <div style={{ color: PERMISSION_MODES[session.permissionMode || 'default'].color }}>
                <PermissionModeIcon mode={session.permissionMode || 'default'} size={18} />
              </div>
              <div className="sidebar-item-content">
                <div className="sidebar-item-title">{session.title}</div>
                <div className="sidebar-item-meta">
                  {formatRelativeTime(session.createdAt)}
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  closeSession(session.id);
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  padding: 4,
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                  borderRadius: 4,
                }}
              >
                <X style={{ width: 14, height: 14 }} />
              </button>
            </div>
          ))
        )}
      </div>

      <div style={{ padding: 16, borderTop: '1px solid var(--border-primary)', marginTop: 'auto' }}>
        {/* Process Tracker */}
        <div style={{ marginBottom: 12 }}>
          <ProcessTracker
            isExpanded={showProcessTracker}
            onToggle={() => setShowProcessTracker(!showProcessTracker)}
          />
        </div>

        <div
          className="sidebar-item"
          onClick={handleSelectDirectory}
          style={{ marginBottom: 8 }}
        >
          <Folder className="sidebar-item-icon" />
          <div className="sidebar-item-content">
            <div className="sidebar-item-title" style={{ fontSize: 12 }}>
              {currentCwd ? currentCwd.split('/').slice(-2).join('/') : 'Select directory'}
            </div>
            <div className="sidebar-item-meta">Working directory</div>
          </div>
        </div>

        <div
          className="sidebar-item"
          onClick={() => setShowTerminalPanel(!showTerminalPanel)}
          style={{ marginBottom: 8 }}
        >
          <Terminal className="sidebar-item-icon" />
          <div className="sidebar-item-content">
            <div className="sidebar-item-title">Terminal Panel</div>
            <div className="sidebar-item-meta">{showTerminalPanel ? 'Visible' : 'Hidden'}</div>
          </div>
        </div>

        <div
          className="sidebar-item"
          onClick={onShowHistory}
          style={{ marginBottom: 0 }}
        >
          <Clock className="sidebar-item-icon" />
          <div className="sidebar-item-content">
            <div className="sidebar-item-title">Prompt History</div>
            <div className="sidebar-item-meta">Browse past prompts</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MainArea({ showTerminalPanel, terminalHeight, onResizeStart, viewMode, setViewMode }) {
  const {
    sessions,
    activeSessionId,
    getActiveSession,
  } = useClaudeSession();

  const activeSession = getActiveSession();

  const activeSessionMode = activeSession?.permissionMode || 'default';
  const modeConfig = PERMISSION_MODES[activeSessionMode];

  return (
    <div className="main-content" style={{ display: 'flex', flexDirection: 'column' }}>
      {/* Top bar */}
      <div className="top-bar">
        <div className="top-bar-tabs">
          {activeSession ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 14, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Sparkles style={{ width: 16, height: 16, color: 'var(--accent-primary)' }} />
                {activeSession.title}
              </span>
              <span style={{
                fontSize: 13,
                color: 'var(--accent-cyan)',
                fontWeight: 500,
                fontFamily: 'monospace',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '2px 8px',
                background: 'rgba(34, 211, 238, 0.1)',
                borderRadius: 'var(--radius-sm)',
              }}>
                <Folder style={{ width: 14, height: 14 }} />
                {activeSession.cwd}
              </span>
            </div>
          ) : (
            <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>No active session</span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* View mode toggle */}
          {activeSession && (
            <div
              style={{
                display: 'flex',
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--border-primary)',
                borderRadius: 'var(--radius-md)',
                overflow: 'hidden',
              }}
            >
              <button
                onClick={() => setViewMode('terminal')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '4px 10px',
                  background: viewMode === 'terminal' ? 'var(--accent-primary)' : 'transparent',
                  color: viewMode === 'terminal' ? 'white' : 'var(--text-secondary)',
                  border: 'none',
                  fontSize: 12,
                  cursor: 'pointer',
                }}
              >
                <Terminal style={{ width: 14, height: 14 }} />
                Terminal
              </button>
              <button
                onClick={() => setViewMode('pretty')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '4px 10px',
                  background: viewMode === 'pretty' ? 'var(--accent-primary)' : 'transparent',
                  color: viewMode === 'pretty' ? 'white' : 'var(--text-secondary)',
                  border: 'none',
                  fontSize: 12,
                  cursor: 'pointer',
                }}
              >
                <Code style={{ width: 14, height: 14 }} />
                Pretty
              </button>
            </div>
          )}

          {/* Permission mode badge in top bar */}
          {activeSession && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '4px 10px',
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--border-primary)',
                borderRadius: 'var(--radius-md)',
                fontSize: 12,
                color: modeConfig.color,
              }}
            >
              <PermissionModeIcon mode={activeSessionMode} size={14} />
              {modeConfig.name}
            </div>
          )}
        </div>
      </div>

      {/* Claude terminal area */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
          marginBottom: showTerminalPanel ? terminalHeight : 0,
        }}
      >
        {sessions.length === 0 ? (
          <div className="empty-state">
            <Sparkles className="empty-state-icon" style={{ color: 'var(--accent-primary)' }} />
            <div className="empty-state-title">Welcome to Better Claude Code</div>
            <div className="empty-state-description">
              Click "New Session" in the sidebar to start a Claude Code session.
              You can run multiple sessions and switch between them.
            </div>
          </div>
        ) : (
          <div style={{ flex: 1, position: 'relative', minHeight: 0 }}>
            {viewMode === 'terminal' ? (
              sessions.map((session) => (
                <ClaudeTerminal
                  key={session.id}
                  sessionId={session.id}
                  isActive={session.id === activeSessionId}
                />
              ))
            ) : (
              sessions.map((session) => (
                <PrettyView
                  key={session.id}
                  sessionId={session.id}
                  isActive={session.id === activeSessionId}
                />
              ))
            )}
          </div>
        )}
      </div>

      {/* Hint bar - type directly in terminal */}
      {activeSession && (
        <div
          style={{
            padding: '8px 16px',
            background: 'var(--bg-secondary)',
            borderTop: '1px solid var(--border-primary)',
            fontSize: 12,
            color: 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            gap: 16,
          }}
        >
          <span>Type directly in the terminal above</span>
          <span style={{ color: 'var(--text-muted)' }}>|</span>
          <span><kbd style={{ background: 'var(--bg-tertiary)', padding: '2px 6px', borderRadius: 4 }}>Tab</kbd> autocomplete</span>
          <span><kbd style={{ background: 'var(--bg-tertiary)', padding: '2px 6px', borderRadius: 4 }}>Ctrl+C</kbd> interrupt</span>
          <span><kbd style={{ background: 'var(--bg-tertiary)', padding: '2px 6px', borderRadius: 4 }}>Esc</kbd> cancel</span>
        </div>
      )}

      {/* Terminal panel */}
      {showTerminalPanel && (
        <div
          style={{
            position: 'fixed',
            bottom: 0,
            left: 280,
            right: 0,
            height: terminalHeight,
            borderTop: '1px solid var(--border-primary)',
            background: 'var(--bg-primary)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div
            style={{
              height: 4,
              cursor: 'row-resize',
              background: 'transparent',
            }}
            onMouseDown={onResizeStart}
          />
          <TerminalPanel fullScreen style={{ flex: 1 }} />
        </div>
      )}
    </div>
  );
}

function AppContent() {
  const [showTerminalPanel, setShowTerminalPanel] = useState(false);
  const [terminalHeight, setTerminalHeight] = useState(250);
  const [isResizing, setIsResizing] = useState(false);
  const [viewMode, setViewMode] = useState('terminal'); // 'terminal' or 'pretty'
  const [showHistory, setShowHistory] = useState(false);

  const { createSession, currentCwd } = useClaudeSession();

  const handleResizeStart = useCallback((e) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Command/Control + T for new session
      if ((e.metaKey || e.ctrlKey) && e.key === 't') {
        e.preventDefault();
        createSession({ cwd: currentCwd });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [createSession, currentCwd]);

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e) => {
      const newHeight = window.innerHeight - e.clientY;
      setTerminalHeight(Math.max(100, Math.min(newHeight, window.innerHeight - 200)));
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  return (
    <div className="app">
      <div className="titlebar-drag-region" />
      <Sidebar
        showTerminalPanel={showTerminalPanel}
        setShowTerminalPanel={setShowTerminalPanel}
        onShowHistory={() => setShowHistory(true)}
      />
      <MainArea
        showTerminalPanel={showTerminalPanel}
        terminalHeight={terminalHeight}
        onResizeStart={handleResizeStart}
        viewMode={viewMode}
        setViewMode={setViewMode}
      />
      <PromptHistory
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
        onSelectPrompt={(prompt) => {
          // Could auto-fill the prompt into the active session
          console.log('Selected prompt:', prompt);
        }}
      />
    </div>
  );
}

export default function App() {
  return (
    <ClaudeSessionProvider>
      <TerminalProvider>
        <AppContent />
      </TerminalProvider>
    </ClaudeSessionProvider>
  );
}
