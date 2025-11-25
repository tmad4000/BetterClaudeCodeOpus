import React, { useEffect, useRef, useCallback } from 'react';
import { useTerminal } from '../context/TerminalContext';
import { Plus, X, Terminal, Sparkles } from './Icons';
import TerminalInstance from './TerminalInstance';

export default function TerminalPanel({ height, fullScreen }) {
  const {
    terminals,
    activeTerminalId,
    setActiveTerminalId,
    createTerminal,
    createClaudeTerminal,
    closeTerminal,
  } = useTerminal();

  const handleAddTerminal = useCallback(async () => {
    await createTerminal();
  }, [createTerminal]);

  const handleAddClaudeTerminal = useCallback(async () => {
    await createClaudeTerminal();
  }, [createClaudeTerminal]);

  // Create initial terminal if none exist
  useEffect(() => {
    if (terminals.length === 0) {
      createTerminal({ title: 'Terminal 1' });
    }
  }, []);

  return (
    <div
      className="terminal-panel"
      style={{
        height: fullScreen ? '100%' : height,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div className="terminal-tabs">
        {terminals.map((term) => (
          <button
            key={term.id}
            className={`terminal-tab ${activeTerminalId === term.id ? 'active' : ''}`}
            onClick={() => setActiveTerminalId(term.id)}
          >
            {term.type === 'claude' ? (
              <Sparkles style={{ width: 14, height: 14, color: 'var(--accent-primary)' }} />
            ) : (
              <Terminal style={{ width: 14, height: 14 }} />
            )}
            {term.title}
            <span
              className="terminal-tab-close"
              onClick={(e) => {
                e.stopPropagation();
                closeTerminal(term.id);
              }}
            >
              <X style={{ width: 12, height: 12 }} />
            </span>
          </button>
        ))}
        <button
          className="terminal-add-tab"
          onClick={handleAddTerminal}
          title="New Terminal"
        >
          <Plus style={{ width: 16, height: 16 }} />
        </button>
        <button
          className="terminal-add-tab"
          onClick={handleAddClaudeTerminal}
          title="New Claude Session"
          style={{ marginLeft: 0 }}
        >
          <Sparkles style={{ width: 16, height: 16, color: 'var(--accent-primary)' }} />
        </button>
      </div>

      <div className="terminal-content" style={{ flex: 1, overflow: 'hidden' }}>
        {terminals.map((term) => (
          <TerminalInstance
            key={term.id}
            terminal={term}
            isActive={activeTerminalId === term.id}
          />
        ))}
      </div>
    </div>
  );
}
