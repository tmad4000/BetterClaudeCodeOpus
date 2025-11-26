import React, { useState, useEffect } from 'react';
import { TerminalProvider, useTerminal, PERMISSION_MODES } from './context/TerminalContext';
import TerminalInstance from './components/TerminalInstance';
import ProcessTracker from './components/ProcessTracker';
import PrettyView from './components/PrettyView';
import PromptHistory from './components/PromptHistory';
import ClaudeTerminal from './components/ClaudeTerminal';
import {
  Plus, X, Terminal, Sparkles, Folder,
  Shield, ShieldCheck, Zap, Clock, Code, AlertCircle
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

function Sidebar({ onShowHistory }) {
  const {
    sessions,
    activeSessionId,
    setActiveSessionId,
    currentCwd,
    permissionMode,
    setPermissionMode,
    createTerminal,
    closeTerminal,
    selectDirectory,
  } = useTerminal();

  const [showModeSelector, setShowModeSelector] = useState(false);
  const [showProcessTracker, setShowProcessTracker] = useState(false);

  const handleNewTerminal = async () => {
    await createTerminal({ type: 'shell', cwd: currentCwd });
  };
  
  const handleNewClaude = async () => {
      await createTerminal({ type: 'claude', cwd: currentCwd });
  }

  const handleSelectDirectory = async () => {
    await selectDirectory();
  };

  const currentModeConfig = PERMISSION_MODES[permissionMode];

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h1>
          <Terminal style={{ width: 16, height: 16, color: 'var(--text-primary)' }} />
          Better Terminal
        </h1>
      </div>

      <div className="sidebar-section" style={{ paddingTop: 16 }}>
        <div style={{ padding: '0 8px', marginBottom: 12, display: 'flex', gap: 8 }}>
          <button
            onClick={handleNewTerminal}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              padding: '10px 12px',
              background: 'var(--bg-tertiary)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-primary)',
              borderRadius: 'var(--radius-md)',
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
            }}
            title="New Terminal (Cmd+T)"
          >
            <Plus style={{ width: 14, height: 14 }} />
            Terminal
          </button>
          <button
            onClick={handleNewClaude}
            style={{
                width: 36,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 0,
                background: 'var(--accent-primary)',
                color: 'white',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
            }}
            title="New Claude Session"
          >
            <Sparkles style={{ width: 16, height: 16 }} />
          </button>
        </div>

        {/* Permission Mode Selector - Affects new Claude sessions */}
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
                For new Claude sessions
              </div>
            </div>
          </div>

          {showModeSelector && (
            <PermissionModeSelector
              currentMode={permissionMode}
              onSelect={setPermissionMode}
              onClose={() => setShowModeSelector(false)}
            />
          )}
        </div>

        <div className="sidebar-section-title">Open Tabs</div>
        {sessions.length === 0 ? (
          <div style={{ padding: '12px 20px', color: 'var(--text-muted)', fontSize: 13 }}>
            No open tabs.
          </div>
        ) : (
          sessions.map((tab) => {
             const isActive = activeSessionId === tab.id;
             return (
            <div
              key={tab.id}
              className={`sidebar-item ${isActive ? 'active' : ''}`}
              onClick={() => setActiveSessionId(tab.id)}
            >
              <div style={{ color: tab.type === 'claude' ? PERMISSION_MODES[tab.permissionMode || 'default'].color : 'var(--text-secondary)' }}>
                {tab.type === 'claude' ? (
                   <PermissionModeIcon mode={tab.permissionMode || 'default'} size={18} />
                ) : (
                   <Terminal style={{ width: 18, height: 18 }} />
                )}
              </div>
              <div className="sidebar-item-content">
                <div className="sidebar-item-title">{tab.title}</div>
                <div className="sidebar-item-meta">
                  {tab.type === 'claude' ? 'Claude Code' : 'Terminal'}
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  closeTerminal(tab.id);
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
          )})
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

function MainArea({ viewMode, setViewMode }) {
  const { sessions, activeSessionId } = useTerminal();

  // Find the active session
  const activeSession = sessions.find(s => s.id === activeSessionId);

  return (
    <div className="main-content" style={{ display: 'flex', flexDirection: 'column' }}>
      {/* Top bar */}
      <div className="top-bar">
        <div className="top-bar-tabs">
          {activeSession ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 14, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8 }}>
                {activeSession.type === 'claude' ? (
                    <Sparkles style={{ width: 16, height: 16, color: 'var(--accent-primary)' }} />
                ) : (
                    <Terminal style={{ width: 16, height: 16, color: 'var(--text-secondary)' }} />
                )}
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
                {activeSession.cwd || '~/code'}
              </span>
            </div>
          ) : (
            <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>No active tab</span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* View mode toggle - Only for Claude sessions */}
          {activeSession?.type === 'claude' && (
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
        </div>
      </div>

      {/* Content Area */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
          position: 'relative'
        }}
      >
        {!activeSession ? (
             <div className="empty-state">
                <Terminal className="empty-state-icon" />
                <div className="empty-state-title">No Open Tabs</div>
                <div className="empty-state-description">
                  Press Cmd+T to open a new terminal.
                </div>
              </div>
        ) : (
            <>
            {/* Render ALL sessions/terminals but hide inactive ones to preserve state */}
            {sessions.map(session => (
                <div key={session.id} style={{ display: activeSessionId === session.id ? 'block' : 'none', height: '100%' }}>
                     {session.type === 'claude' && viewMode === 'pretty' ? (
                        <PrettyView
                          sessionId={session.id}
                          isActive={activeSessionId === session.id}
                        />
                      ) : (
                        <TerminalInstance
                          terminal={session}
                          isActive={activeSessionId === session.id}
                        />
                      )}
                </div>
            ))}
            </>
        )}
      </div>

      {/* Hint bar */}
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
          <span>{activeSession.type === 'claude' ? 'Claude Session' : 'Standard Terminal'}</span>
          <span style={{ color: 'var(--text-muted)' }}>|</span>
          <span><kbd style={{ background: 'var(--bg-tertiary)', padding: '2px 6px', borderRadius: 4 }}>Cmd+T</kbd> New Terminal</span>
        </div>
      )}
    </div>
  );
}

function AppContent() {
  const [viewMode, setViewMode] = useState('terminal'); // 'terminal' or 'pretty'
  const [showHistory, setShowHistory] = useState(false);

  const { createTerminal, sessions, currentCwd, showCwdWarning, setShowCwdWarning } = useTerminal();
  const [hasInitialized, setHasInitialized] = useState(false);

  // Initialize: Start a shell terminal, then type `claude` into it
  useEffect(() => {
      if (!hasInitialized && sessions.length === 0 && currentCwd) {
          (async () => {
              const session = await createTerminal({
                  type: 'shell',
                  cwd: currentCwd,
                  title: 'Claude'
              });
              if (session && window.electronAPI) {
                  // Wait for shell to initialize, then type claude command
                  setTimeout(() => {
                      window.electronAPI.sendSessionInput(session.id, 'claude\n');
                  }, 500);
              }
          })();
          setHasInitialized(true);
      }
  }, [hasInitialized, sessions.length, createTerminal, currentCwd]);

  // Handle global shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Command/Control + T for new STANDARD terminal
      if ((e.metaKey || e.ctrlKey) && e.key === 't') {
        e.preventDefault();
        createTerminal({ type: 'shell', cwd: currentCwd });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [createTerminal, currentCwd]);

  return (
    <div className="app">
      <div className="titlebar-drag-region" />
      <Sidebar
        onShowHistory={() => setShowHistory(true)}
      />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {showCwdWarning && (
            <div style={{
                background: 'rgba(210, 153, 34, 0.2)',
                color: 'var(--accent-orange)',
                padding: '8px 16px',
                fontSize: 13,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                borderBottom: '1px solid rgba(210, 153, 34, 0.3)',
            }}>
                <AlertCircle style={{ width: 16, height: 16 }} />
                <span>
                    <strong>Note:</strong> "~/code" directory not found. Defaulting to home directory ({currentCwd}).
                </span>
                <button
                    onClick={() => setShowCwdWarning(false)}
                    style={{
                        marginLeft: 'auto',
                        background: 'transparent',
                        border: 'none',
                        color: 'inherit',
                        cursor: 'pointer',
                        display: 'flex',
                    }}
                >
                    <X style={{ width: 14, height: 14 }} />
                </button>
            </div>
        )}
        <MainArea
            viewMode={viewMode}
            setViewMode={setViewMode}
        />
      </div>
      <PromptHistory
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
        onSelectPrompt={(prompt) => {
          console.log('Selected prompt:', prompt);
        }}
      />
    </div>
  );
}

export default function App() {
  return (
    <TerminalProvider>
      <AppContent />
    </TerminalProvider>
  );
}