import React, { useEffect, useRef, useCallback } from 'react';
import { useTerminal } from '../context/TerminalContext';
import { Plus, X, Terminal, Sparkles } from './Icons';

// Lazy load xterm to avoid SSR issues
let XTerminal;
let FitAddon;

function TerminalInstance({ terminal, isActive }) {
  const containerRef = useRef(null);
  const xtermRef = useRef(null);
  const fitAddonRef = useRef(null);
  const { setTerminalRef } = useTerminal();

  useEffect(() => {
    // Dynamic import for xterm
    const loadXterm = async () => {
      if (!XTerminal) {
        const xtermModule = await import('@xterm/xterm');
        const fitModule = await import('@xterm/addon-fit');
        XTerminal = xtermModule.Terminal;
        FitAddon = fitModule.FitAddon;

        // Load xterm CSS
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://cdn.jsdelivr.net/npm/@xterm/xterm@5.3.0/css/xterm.min.css';
        document.head.appendChild(link);
      }

      if (containerRef.current && !xtermRef.current) {
        const term = new XTerminal({
          theme: {
            background: '#0d1117',
            foreground: '#f0f6fc',
            cursor: '#58a6ff',
            cursorAccent: '#0d1117',
            black: '#484f58',
            red: '#ff7b72',
            green: '#3fb950',
            yellow: '#d29922',
            blue: '#58a6ff',
            magenta: '#bc8cff',
            cyan: '#39c5cf',
            white: '#b1bac4',
            brightBlack: '#6e7681',
            brightRed: '#ffa198',
            brightGreen: '#56d364',
            brightYellow: '#e3b341',
            brightBlue: '#79c0ff',
            brightMagenta: '#d2a8ff',
            brightCyan: '#56d4dd',
            brightWhite: '#f0f6fc',
          },
          fontFamily: '"JetBrains Mono", "SF Mono", Monaco, monospace',
          fontSize: 13,
          lineHeight: 1.4,
          cursorBlink: true,
          cursorStyle: 'bar',
          scrollback: 10000,
        });

        const fitAddon = new FitAddon();
        term.loadAddon(fitAddon);

        term.open(containerRef.current);
        fitAddon.fit();

        xtermRef.current = term;
        fitAddonRef.current = fitAddon;
        setTerminalRef(terminal.id, { term, fitAddon });

        // Set up data listeners
        if (window.electronAPI) {
          const unsubscribeData = window.electronAPI.onTerminalData(terminal.id, (data) => {
            term.write(data);
          });

          const unsubscribeExit = window.electronAPI.onTerminalExit(terminal.id, (exitCode) => {
            term.write(`\r\n\x1b[90mProcess exited with code ${exitCode}\x1b[0m\r\n`);
          });

          // Send input to backend
          term.onData((data) => {
            window.electronAPI.sendTerminalInput(terminal.id, data);
          });

          // Handle resize
          const resizeObserver = new ResizeObserver(() => {
            fitAddon.fit();
            if (window.electronAPI && term.cols && term.rows) {
              window.electronAPI.resizeTerminal(terminal.id, term.cols, term.rows);
            }
          });

          if (containerRef.current) {
            resizeObserver.observe(containerRef.current);
          }

          return () => {
            unsubscribeData();
            unsubscribeExit();
            resizeObserver.disconnect();
            term.dispose();
          };
        } else {
          // Demo mode - show welcome message
          term.write('\x1b[1;34m╭─────────────────────────────────────────╮\x1b[0m\r\n');
          term.write('\x1b[1;34m│\x1b[0m   \x1b[1;36mBetter Claude Code Terminal\x1b[0m          \x1b[1;34m│\x1b[0m\r\n');
          term.write('\x1b[1;34m╰─────────────────────────────────────────╯\x1b[0m\r\n\r\n');
          term.write('\x1b[90mElectron API not available in browser preview.\x1b[0m\r\n');
          term.write('\x1b[90mRun with `npm start` to enable terminal.\x1b[0m\r\n\r\n');
          term.write('\x1b[32m➜\x1b[0m \x1b[34m~/projects\x1b[0m ');
        }
      }
    };

    loadXterm();
  }, [terminal.id, setTerminalRef]);

  useEffect(() => {
    if (isActive && fitAddonRef.current) {
      setTimeout(() => {
        fitAddonRef.current?.fit();
        xtermRef.current?.focus();
      }, 0);
    }
  }, [isActive]);

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        display: isActive ? 'block' : 'none',
      }}
    />
  );
}

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
