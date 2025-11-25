import React, { createContext, useContext, useState, useCallback, useRef } from 'react';

const TerminalContext = createContext(null);

export function TerminalProvider({ children }) {
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const terminalRefs = useRef(new Map());

  const createTerminal = useCallback(async (options = {}) => {
    if (!window.electronAPI) {
      console.warn('Electron API not available');
      return null;
    }

    try {
      const type = options.type || 'shell';
      const { id, pid, cwd } = await window.electronAPI.createSession({
        ...options,
        type,
      });

      const newSession = {
        id,
        pid,
        title: options.title || (type === 'claude' ? 'Claude Code' : `Terminal ${sessions.length + 1}`),
        cwd: cwd || options.cwd || process.env.HOME,
        type,
        createdAt: Date.now(),
        // Default permission mode for Claude sessions
        permissionMode: options.permissionMode || 'default', 
      };

      setSessions((prev) => [...prev, newSession]);
      setActiveSessionId(id);
      return newSession;
    } catch (error) {
      console.error('Failed to create session:', error);
      return null;
    }
  }, [sessions.length]);

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
