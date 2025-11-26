import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';

const TerminalContext = createContext(null);

// Permission modes for Claude sessions
export const PERMISSION_MODES = {
  default: {
    name: 'Default',
    description: 'Normal permissions with confirmations',
    color: 'var(--text-secondary)',
  },
  yolo: {
    name: 'YOLO',
    description: 'Skip all permission prompts',
    color: 'var(--accent-orange)',
  },
  plan: {
    name: 'Plan',
    description: 'Plan mode for careful execution',
    color: 'var(--accent-cyan)',
  },
};

export function TerminalProvider({ children }) {
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [currentCwd, setCurrentCwd] = useState(null);
  const [permissionMode, setPermissionMode] = useState('default');
  const [showCwdWarning, setShowCwdWarning] = useState(false);
  const terminalRefs = useRef(new Map());

  // Initialize CWD from app info
  useEffect(() => {
    if (window.electronAPI) {
      window.electronAPI.getAppInfo().then((info) => {
        setCurrentCwd(info.defaultCwd);
        if (info.isDefaultCwdFallback) {
          setShowCwdWarning(true);
        }
      });
    }
  }, []);

  const selectDirectory = useCallback(async () => {
    if (!window.electronAPI) return;
    const dir = await window.electronAPI.selectDirectory();
    if (dir) {
      setCurrentCwd(dir);
      setShowCwdWarning(false);
    }
  }, []);

  const createTerminal = useCallback(async (options = {}) => {
    if (!window.electronAPI) {
      console.warn('Electron API not available');
      return null;
    }

    try {
      const type = options.type || 'shell';
      const cwd = options.cwd || currentCwd;
      const { id, pid, cwd: actualCwd } = await window.electronAPI.createSession({
        ...options,
        type,
        cwd,
        permissionMode: type === 'claude' ? permissionMode : undefined,
      });

      const newSession = {
        id,
        pid,
        title: options.title || (type === 'claude' ? 'Claude Code' : `Terminal ${sessions.length + 1}`),
        cwd: actualCwd || cwd || process.env.HOME,
        type,
        createdAt: Date.now(),
        permissionMode: type === 'claude' ? permissionMode : undefined,
        claudeMode: options.claudeMode,
        isClaudeSession: options.isClaudeSession || false,
      };

      setSessions((prev) => [...prev, newSession]);
      setActiveSessionId(id);
      return newSession;
    } catch (error) {
      console.error('Failed to create session:', error);
      return null;
    }
  }, [sessions.length, currentCwd, permissionMode]);

  const closeTerminal = useCallback((id) => {
    if (window.electronAPI) {
      window.electronAPI.killSession(id);
    }

    setSessions((prev) => {
      const newSessions = prev.filter((t) => t.id !== id);
      if (activeSessionId === id && newSessions.length > 0) {
        setActiveSessionId(newSessions[newSessions.length - 1].id);
      } else if (newSessions.length === 0) {
        setActiveSessionId(null);
      }
      return newSessions;
    });

    terminalRefs.current.delete(id);
  }, [activeSessionId]);

  const renameTerminal = useCallback((id, title) => {
    setSessions((prev) =>
      prev.map((t) => (t.id === id ? { ...t, title } : t))
    );
  }, []);
  
  const updateSession = useCallback((id, updates) => {
    setSessions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...updates } : s))
    );
  }, []);

  const setTerminalRef = useCallback((id, ref) => {
    if (ref) {
      terminalRefs.current.set(id, ref);
    } else {
      terminalRefs.current.delete(id);
    }
  }, []);

  const getTerminalRef = useCallback((id) => {
    return terminalRefs.current.get(id);
  }, []);

  const value = {
    sessions,
    activeSessionId,
    setActiveSessionId,
    createTerminal,
    closeTerminal,
    renameTerminal,
    updateSession,
    setTerminalRef,
    getTerminalRef,
    currentCwd,
    permissionMode,
    setPermissionMode,
    selectDirectory,
    showCwdWarning,
    setShowCwdWarning,
  };

  return (
    <TerminalContext.Provider value={value}>
      {children}
    </TerminalContext.Provider>
  );
}

export function useTerminal() {
  const context = useContext(TerminalContext);
  if (!context) {
    throw new Error('useTerminal must be used within TerminalProvider');
  }
  return context;
}
