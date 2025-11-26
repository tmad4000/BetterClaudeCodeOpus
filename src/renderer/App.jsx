import React, { useState, useEffect, useRef } from 'react';
import { TerminalProvider, useTerminal, PERMISSION_MODES } from './context/TerminalContext';
import TerminalInstance from './components/TerminalInstance';
import ProcessTracker from './components/ProcessTracker';
import PrettyView from './components/PrettyView';
import PromptHistory from './components/PromptHistory';
import ClaudeTerminal from './components/ClaudeTerminal';
import HelpDialog from './components/HelpDialog';
import TabBar from './components/TabBar';
import SearchBar from './components/SearchBar';
import {
  Plus, X, Terminal, Sparkles, Folder,
  Shield, ShieldCheck, Zap, Clock, Code, AlertCircle,
  PanelLeftClose, PanelLeftOpen, HelpCircle, ChevronDown
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

function Sidebar({ onShowHistory, onShowHelp, isCollapsed, onToggle }) {
  const {
    currentCwd,
    permissionMode,
    setPermissionMode,
    createTerminal,
    selectDirectory,
  } = useTerminal();

  const [showModeSelector, setShowModeSelector] = useState(false);
  const [showProcessTracker, setShowProcessTracker] = useState(false);
  const modeDropdownRef = useRef(null);

  // Close mode selector when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (modeDropdownRef.current && !modeDropdownRef.current.contains(e.target)) {
        setShowModeSelector(false);
      }
    };
    if (showModeSelector) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showModeSelector]);

  const handleNewClaude = async () => {
    let claudeCmd = 'claude';
    if (permissionMode === 'yolo') {
      claudeCmd = 'claude --dangerously-skip-permissions';
    }

    const session = await createTerminal({
      type: 'shell',
      cwd: currentCwd,
      title: `Claude ${permissionMode === 'yolo' ? '(YOLO)' : permissionMode === 'plan' ? '(Plan)' : ''}`.trim(),
      claudeMode: permissionMode,
      isClaudeSession: true,
    });

    if (session && window.electronAPI) {
      setTimeout(() => {
        window.electronAPI.sendSessionInput(session.id, claudeCmd + '\n');
      }, 500);
    }
  };

  const handleSelectDirectory = async () => {
    await selectDirectory();
  };

  const currentModeConfig = PERMISSION_MODES[permissionMode];

  // Collapsed sidebar - minimal view
  if (isCollapsed) {
    return (
      <div
        className="sidebar"
        style={{
          width: 48,
          minWidth: 48,
          padding: '8px 4px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <button
          onClick={onToggle}
          style={{
            background: 'transparent',
            border: 'none',
            padding: 8,
            cursor: 'pointer',
            color: 'var(--text-secondary)',
            borderRadius: 'var(--radius-sm)',
          }}
          title="Expand sidebar (Cmd+B)"
        >
          <PanelLeftOpen style={{ width: 18, height: 18 }} />
        </button>

        <button
          onClick={handleNewClaude}
          style={{
            background: permissionMode === 'yolo' ? 'var(--accent-orange)' : 'var(--accent-primary)',
            border: 'none',
            padding: 8,
            cursor: 'pointer',
            color: 'white',
            borderRadius: 'var(--radius-sm)',
          }}
          title={`New Claude Session (${currentModeConfig.name})`}
        >
          <Sparkles style={{ width: 16, height: 16 }} />
        </button>

        <div style={{ flex: 1 }} />

        <button
          onClick={onShowHelp}
          style={{
            background: 'transparent',
            border: 'none',
            padding: 8,
            cursor: 'pointer',
            color: 'var(--text-muted)',
            borderRadius: 'var(--radius-sm)',
          }}
          title="Help (Cmd+?)"
        >
          <HelpCircle style={{ width: 16, height: 16 }} />
        </button>
      </div>
    );
  }

  return (
    <div className="sidebar" style={{ position: 'relative' }}>
      {/* Floating collapse button - top right */}
      <button
        onClick={onToggle}
        style={{
          position: 'absolute',
          top: 10,
          right: 8,
          background: 'var(--bg-tertiary)',
          border: '1px solid var(--border-primary)',
          padding: 4,
          cursor: 'pointer',
          color: 'var(--text-muted)',
          borderRadius: 'var(--radius-sm)',
          zIndex: 10,
        }}
        title="Collapse sidebar (Cmd+B)"
      >
        <PanelLeftClose style={{ width: 14, height: 14 }} />
      </button>

      <div className="sidebar-header">
        <h1>
          <Terminal style={{ width: 16, height: 16, color: 'var(--text-primary)' }} />
          Better Terminal
        </h1>
      </div>

      <div className="sidebar-section" style={{ paddingTop: 16 }}>
        {/* New Claude button with mode dropdown */}
        <div style={{ padding: '0 8px', marginBottom: 16, position: 'relative' }} ref={modeDropdownRef}>
          <div style={{ display: 'flex', gap: 0 }}>
            <button
              onClick={handleNewClaude}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                padding: '10px 12px',
                background: permissionMode === 'yolo' ? 'var(--accent-orange)' : 'var(--accent-primary)',
                color: 'white',
                border: 'none',
                borderRadius: 'var(--radius-md) 0 0 var(--radius-md)',
                fontSize: 13,
                fontWeight: 500,
                cursor: 'pointer',
              }}
              title={`New Claude Session (${currentModeConfig.name} mode)`}
            >
              <Sparkles style={{ width: 14, height: 14 }} />
              New Claude
              {permissionMode === 'yolo' && <Zap style={{ width: 12, height: 12 }} />}
            </button>
            <button
              onClick={() => setShowModeSelector(!showModeSelector)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '10px 8px',
                background: permissionMode === 'yolo' ? 'var(--accent-orange)' : 'var(--accent-primary)',
                color: 'white',
                border: 'none',
                borderLeft: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '0 var(--radius-md) var(--radius-md) 0',
                cursor: 'pointer',
              }}
              title="Select mode"
            >
              <ChevronDown style={{ width: 14, height: 14 }} />
            </button>
          </div>

          {/* Mode dropdown */}
          {showModeSelector && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                left: 8,
                right: 8,
                marginTop: 4,
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-primary)',
                borderRadius: 'var(--radius-md)',
                padding: 4,
                zIndex: 100,
                boxShadow: 'var(--shadow-lg)',
              }}
            >
              {Object.entries(PERMISSION_MODES).map(([key, mode]) => (
                <div
                  key={key}
                  onClick={() => {
                    setPermissionMode(key);
                    setShowModeSelector(false);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '8px 10px',
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer',
                    background: permissionMode === key ? 'var(--bg-tertiary)' : 'transparent',
                  }}
                >
                  <div style={{ color: mode.color }}>
                    <PermissionModeIcon mode={key} size={14} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-primary)' }}>
                      {mode.name}
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                      {mode.description}
                    </div>
                  </div>
                  {permissionMode === key && (
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: mode.color }} />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Session History - prominent at top */}
        <div
          className="sidebar-item"
          onClick={onShowHistory}
          style={{ margin: '0 8px 0 8px' }}
        >
          <Clock className="sidebar-item-icon" />
          <div className="sidebar-item-content">
            <div className="sidebar-item-title">Session History</div>
            <div className="sidebar-item-meta">Browse past sessions</div>
          </div>
        </div>
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
          onClick={onShowHelp}
          style={{ marginBottom: 0 }}
        >
          <HelpCircle className="sidebar-item-icon" />
          <div className="sidebar-item-content">
            <div className="sidebar-item-title">Help</div>
            <div className="sidebar-item-meta">Shortcuts & usage (Cmd+?)</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MainArea({ viewMode, setViewMode, showSearch, setShowSearch }) {
  const { sessions, activeSessionId, getTerminalRef } = useTerminal();

  // Find the active session
  const activeSession = sessions.find(s => s.id === activeSessionId);
  const activeTerminalRef = activeSessionId ? getTerminalRef(activeSessionId) : null;

  return (
    <div className="main-content" style={{ display: 'flex', flexDirection: 'column', position: 'relative' }}>
      {/* Search bar overlay */}
      <SearchBar
        isOpen={showSearch}
        onClose={() => setShowSearch(false)}
        terminalRef={activeTerminalRef}
      />
      {/* Toolbar - simplified since tabs are at the top */}
      {activeSession && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '6px 12px',
            background: 'var(--bg-secondary)',
            borderBottom: '1px solid var(--border-primary)',
          }}
        >
          {/* Working directory + mode badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              fontSize: 12,
              color: 'var(--accent-cyan)',
              fontWeight: 500,
              fontFamily: 'monospace',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              padding: '2px 6px',
              background: 'rgba(34, 211, 238, 0.1)',
              borderRadius: 'var(--radius-sm)',
            }}>
              <Folder style={{ width: 12, height: 12 }} />
              {activeSession.cwd || '~/code'}
            </span>
            {/* Show Claude mode badge */}
            {activeSession.isClaudeSession && activeSession.claudeMode && (
              <span style={{
                fontSize: 10,
                color: activeSession.claudeMode === 'yolo' ? 'var(--accent-orange)' : 'var(--text-muted)',
                fontWeight: 600,
                padding: '2px 6px',
                background: activeSession.claudeMode === 'yolo' ? 'rgba(210, 153, 34, 0.15)' : 'var(--bg-tertiary)',
                borderRadius: 'var(--radius-sm)',
                display: 'flex',
                alignItems: 'center',
                gap: 3,
                textTransform: 'uppercase',
              }}>
                {activeSession.claudeMode === 'yolo' && <Zap style={{ width: 9, height: 9 }} />}
                {PERMISSION_MODES[activeSession.claudeMode]?.name || activeSession.claudeMode}
              </span>
            )}
          </div>

          {/* View mode toggle - Only for Claude sessions */}
          {activeSession?.isClaudeSession && (
            <div
              style={{
                display: 'flex',
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--border-primary)',
                borderRadius: 'var(--radius-sm)',
                overflow: 'hidden',
              }}
            >
              <button
                onClick={() => setViewMode('terminal')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '3px 8px',
                  background: viewMode === 'terminal' ? 'var(--accent-primary)' : 'transparent',
                  color: viewMode === 'terminal' ? 'white' : 'var(--text-secondary)',
                  border: 'none',
                  fontSize: 11,
                  cursor: 'pointer',
                }}
              >
                <Terminal style={{ width: 12, height: 12 }} />
                Terminal
              </button>
              <button
                onClick={() => setViewMode('pretty')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '3px 8px',
                  background: viewMode === 'pretty' ? 'var(--accent-primary)' : 'transparent',
                  color: viewMode === 'pretty' ? 'white' : 'var(--text-secondary)',
                  border: 'none',
                  fontSize: 11,
                  cursor: 'pointer',
                }}
              >
                <Code style={{ width: 12, height: 12 }} />
                Pretty
              </button>
            </div>
          )}
        </div>
      )}

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
                  Press Cmd+T to open a new terminal or click the + button.
                </div>
              </div>
        ) : (
            <>
            {/* Render ALL sessions/terminals - visibility handled inside each component */}
            {sessions.map(session => (
              <React.Fragment key={session.id}>
                {/* Always render TerminalInstance to maintain xterm state */}
                <TerminalInstance
                  terminal={session}
                  isActive={activeSessionId === session.id && (!session.isClaudeSession || viewMode === 'terminal')}
                />
                {/* Also render PrettyView for Claude sessions to maintain its state */}
                {session.isClaudeSession && (
                  <PrettyView
                    sessionId={session.id}
                    isActive={activeSessionId === session.id && viewMode === 'pretty'}
                  />
                )}
              </React.Fragment>
            ))}
            </>
        )}
      </div>
    </div>
  );
}

function AppContent() {
  const [viewMode, setViewMode] = useState('terminal'); // 'terminal' or 'pretty'
  const [showHistory, setShowHistory] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);

  const { createTerminal, sessions, currentCwd, showCwdWarning, setShowCwdWarning, launchOptions, permissionMode, activeSessionId } = useTerminal();
  const [hasInitialized, setHasInitialized] = useState(false);

  // Focus the terminal when the app opens
  useEffect(() => {
    // Small delay to ensure terminal is mounted
    const timer = setTimeout(() => {
      const terminalEl = document.querySelector('.xterm-helper-textarea');
      if (terminalEl) {
        terminalEl.focus();
      }
    }, 600);
    return () => clearTimeout(timer);
  }, [activeSessionId]);

  // Initialize: Start a shell terminal, then type `claude` into it
  // Respects launch options (--claude, --yolo, path argument)
  useEffect(() => {
      if (!hasInitialized && sessions.length === 0 && currentCwd) {
          (async () => {
              // Determine the mode based on launch options
              const mode = launchOptions?.yoloMode ? 'yolo' : (permissionMode || 'default');
              const isClaudeSession = launchOptions?.autoStartClaude !== false; // Default to true

              // Build claude command based on mode
              let claudeCmd = 'claude';
              if (mode === 'yolo') {
                  claudeCmd = 'claude --dangerously-skip-permissions';
              }

              const session = await createTerminal({
                  type: 'shell',
                  cwd: currentCwd,
                  title: isClaudeSession ? `Claude ${mode === 'yolo' ? '(YOLO)' : ''}`.trim() : 'Terminal',
                  claudeMode: isClaudeSession ? mode : undefined,
                  isClaudeSession,
              });

              if (session && window.electronAPI && isClaudeSession) {
                  // Wait for shell to initialize, then type claude command
                  setTimeout(() => {
                      window.electronAPI.sendSessionInput(session.id, claudeCmd + '\n');
                  }, 500);
              }
          })();
          setHasInitialized(true);
      }
  }, [hasInitialized, sessions.length, createTerminal, currentCwd, launchOptions, permissionMode]);

  // Handlers for new tabs (from TabBar)
  const handleNewTerminal = async () => {
    await createTerminal({ type: 'shell', cwd: currentCwd });
  };

  const handleNewClaude = async () => {
    let claudeCmd = 'claude';
    if (permissionMode === 'yolo') {
      claudeCmd = 'claude --dangerously-skip-permissions';
    }

    const session = await createTerminal({
      type: 'shell',
      cwd: currentCwd,
      title: `Claude ${permissionMode === 'yolo' ? '(YOLO)' : permissionMode === 'plan' ? '(Plan)' : ''}`.trim(),
      claudeMode: permissionMode,
      isClaudeSession: true,
    });

    if (session && window.electronAPI) {
      setTimeout(() => {
        window.electronAPI.sendSessionInput(session.id, claudeCmd + '\n');
      }, 500);
    }
  };

  // Handle global shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Command/Control + T for new STANDARD terminal
      if ((e.metaKey || e.ctrlKey) && e.key === 't') {
        e.preventDefault();
        createTerminal({ type: 'shell', cwd: currentCwd });
      }
      // Command/Control + B to toggle sidebar
      if ((e.metaKey || e.ctrlKey) && e.key === 'b') {
        e.preventDefault();
        setSidebarCollapsed(prev => !prev);
      }
      // Command/Control + ? (or /) for help
      if ((e.metaKey || e.ctrlKey) && (e.key === '?' || e.key === '/')) {
        e.preventDefault();
        setShowHelp(prev => !prev);
      }
      // Command/Control + F for find/search
      if ((e.metaKey || e.ctrlKey) && e.key === 'f') {
        e.preventDefault();
        setShowSearch(prev => !prev);
      }
      // Escape to close help or search
      if (e.key === 'Escape') {
        if (showHelp) setShowHelp(false);
        if (showSearch) setShowSearch(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [createTerminal, currentCwd, showHelp, showSearch]);

  // Handle Cmd+W from menu to close current tab
  const { closeTerminal } = useTerminal();
  useEffect(() => {
    if (!window.electronAPI?.onCloseCurrentTab) return;
    const unsubscribe = window.electronAPI.onCloseCurrentTab(() => {
      // If only one tab, close the window instead
      if (sessions.length <= 1) {
        window.close();
      } else {
        // Close the active tab
        closeTerminal(activeSessionId);
      }
    });
    return unsubscribe;
  }, [sessions.length, activeSessionId, closeTerminal]);

  return (
    <div className="app">
      <div className="titlebar-drag-region" />
      {/* Tab bar at the very top */}
      <TabBar
        onNewTerminal={handleNewTerminal}
        onNewClaude={handleNewClaude}
      />
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <Sidebar
          onShowHistory={() => setShowHistory(true)}
          onShowHelp={() => setShowHelp(true)}
          isCollapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
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
              showSearch={showSearch}
              setShowSearch={setShowSearch}
          />
        </div>
      </div>
      <PromptHistory
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
        onSelectPrompt={(prompt) => {
          console.log('Selected prompt:', prompt);
        }}
      />
      <HelpDialog
        isOpen={showHelp}
        onClose={() => setShowHelp(false)}
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