import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';

const ClaudeSessionContext = createContext(null);

// Permission modes available in Claude Code
export const PERMISSION_MODES = {
  default: {
    name: 'Default',
    description: 'Ask for permission on sensitive operations',
    color: 'var(--accent-primary)',
    icon: 'Shield',
  },
  yolo: {
    name: 'YOLO',
    description: 'Auto-approve all operations (use with caution)',
    color: 'var(--accent-orange)',
    icon: 'Zap',
  },
  plan: {
    name: 'Plan',
    description: 'Plan mode - exploration only, no changes',
    color: 'var(--accent-purple)',
    icon: 'ShieldCheck',
  },
};

export function ClaudeSessionProvider({ children }) {
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [currentCwd, setCurrentCwd] = useState(null);
  const [permissionMode, setPermissionMode] = useState('default');
  const [showCwdWarning, setShowCwdWarning] = useState(false);
  const terminalRefs = useRef(new Map());

  // Load app info on mount
  useEffect(() => {
    const init = async () => {
      if (window.electronAPI) {
        const info = await window.electronAPI.getAppInfo();
        setCurrentCwd(info.defaultCwd);
        if (info.isDefaultCwdFallback) {
          setShowCwdWarning(true);
        }
      }
    };
    init();
  }, []);

  const createSession = useCallback(async (options = {}) => {
    if (!window.electronAPI) {
      console.warn('Electron API not available');
      return null;
    }

    const cwd = options.cwd || currentCwd;
    const mode = options.permissionMode || permissionMode;

    try {
      const { id, pid, cwd: sessionCwd } = await window.electronAPI.createClaudeSession({
        cwd,
        cols: options.cols || 120,
        rows: options.rows || 40,
        permissionMode: mode,
      });

      const newSession = {
        id,
        pid,
        cwd: sessionCwd,
        title: options.title || `Session ${sessions.length + 1}`,
        createdAt: Date.now(),
        isActive: true,
        permissionMode: mode,
      };

      setSessions((prev) => [...prev, newSession]);
      setActiveSessionId(id);

      return newSession;
    } catch (error) {
      console.error('Failed to create Claude session:', error);
      return null;
    }
  }, [sessions.length, currentCwd, permissionMode]);

  const closeSession = useCallback((id) => {
    if (window.electronAPI) {
      window.electronAPI.killClaudeSession(id);
    }

    setSessions((prev) => {
      const newSessions = prev.filter((s) => s.id !== id);
      if (activeSessionId === id && newSessions.length > 0) {
        setActiveSessionId(newSessions[newSessions.length - 1].id);
      } else if (newSessions.length === 0) {
        setActiveSessionId(null);
      }
      return newSessions;
    });

    terminalRefs.current.delete(id);
  }, [activeSessionId]);

  const sendMessage = useCallback((id, message) => {
    if (window.electronAPI) {
      window.electronAPI.sendClaudeMessage(id, message);
    }
  }, []);

  const interruptSession = useCallback((id) => {
    if (window.electronAPI) {
      window.electronAPI.interruptClaude(id);
    }
  }, []);

  const selectDirectory = useCallback(async () => {
    if (window.electronAPI) {
      const dir = await window.electronAPI.selectDirectory();
      if (dir) {
        setCurrentCwd(dir);
        return dir;
      }
    }
    return null;
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

  const getActiveSession = useCallback(() => {
    return sessions.find((s) => s.id === activeSessionId) || null;
  }, [sessions, activeSessionId]);

  const cyclePermissionMode = useCallback(() => {
    const modes = Object.keys(PERMISSION_MODES);
    const currentIndex = modes.indexOf(permissionMode);
    const nextIndex = (currentIndex + 1) % modes.length;
    setPermissionMode(modes[nextIndex]);
  }, [permissionMode]);

  const value = {
    sessions,
    activeSessionId,
    currentCwd,
    permissionMode,
    showCwdWarning,
    setActiveSessionId,
    setCurrentCwd,
    setPermissionMode,
    setShowCwdWarning,
    cyclePermissionMode,
    createSession,
    closeSession,
    sendMessage,
    interruptSession,
    selectDirectory,
    setTerminalRef,
    getTerminalRef,
    getActiveSession,
  };

  return (
    <ClaudeSessionContext.Provider value={value}>
      {children}
    </ClaudeSessionContext.Provider>
  );
}

export function useClaudeSession() {
  const context = useContext(ClaudeSessionContext);
  if (!context) {
    throw new Error('useClaudeSession must be used within ClaudeSessionProvider');
  }
  return context;
}
