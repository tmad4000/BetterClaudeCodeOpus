import React, { createContext, useContext, useState, useCallback, useRef } from 'react';

const TerminalContext = createContext(null);

export function TerminalProvider({ children }) {
  const [terminals, setTerminals] = useState([]);
  const [activeTerminalId, setActiveTerminalId] = useState(null);
  const terminalRefs = useRef(new Map());

  const createTerminal = useCallback(async (options = {}) => {
    if (!window.electronAPI) {
      console.warn('Electron API not available');
      return null;
    }

    try {
      const { id, pid } = await window.electronAPI.createTerminal(options);
      const newTerminal = {
        id,
        pid,
        title: options.title || `Terminal ${terminals.length + 1}`,
        cwd: options.cwd || process.env.HOME,
        type: 'shell',
      };

      setTerminals((prev) => [...prev, newTerminal]);
      setActiveTerminalId(id);
      return newTerminal;
    } catch (error) {
      console.error('Failed to create terminal:', error);
      return null;
    }
  }, [terminals.length]);

  const createClaudeTerminal = useCallback(async (options = {}) => {
    if (!window.electronAPI) {
      console.warn('Electron API not available');
      return null;
    }

    try {
      const { id, pid } = await window.electronAPI.startClaude(options);
      const newTerminal = {
        id,
        pid,
        title: 'Claude Code',
        cwd: options.cwd || process.env.HOME,
        type: 'claude',
      };

      setTerminals((prev) => [...prev, newTerminal]);
      setActiveTerminalId(id);
      return newTerminal;
    } catch (error) {
      console.error('Failed to start Claude:', error);
      return null;
    }
  }, []);

  const closeTerminal = useCallback((id) => {
    if (window.electronAPI) {
      window.electronAPI.killTerminal(id);
    }

    setTerminals((prev) => {
      const newTerminals = prev.filter((t) => t.id !== id);
      if (activeTerminalId === id && newTerminals.length > 0) {
        setActiveTerminalId(newTerminals[newTerminals.length - 1].id);
      } else if (newTerminals.length === 0) {
        setActiveTerminalId(null);
      }
      return newTerminals;
    });

    terminalRefs.current.delete(id);
  }, [activeTerminalId]);

  const renameTerminal = useCallback((id, title) => {
    setTerminals((prev) =>
      prev.map((t) => (t.id === id ? { ...t, title } : t))
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
    terminals,
    activeTerminalId,
    setActiveTerminalId,
    createTerminal,
    createClaudeTerminal,
    closeTerminal,
    renameTerminal,
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
