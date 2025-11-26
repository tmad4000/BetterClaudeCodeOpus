import React, { useEffect, useRef, useState } from 'react';
import { useTerminal } from '../context/TerminalContext';
import { RefreshCw } from './Icons';

// Lazy load xterm to avoid SSR issues
let XTerminal;
let FitAddon;

export default function TerminalInstance({ terminal, isActive }) {
  const containerRef = useRef(null);
  const xtermRef = useRef(null);
  const fitAddonRef = useRef(null);
  const { setTerminalRef, createTerminal } = useTerminal();
  const [isExited, setIsExited] = useState(false);

  useEffect(() => {
    // Dynamic import for xterm
    const loadXterm = async () => {
      if (!XTerminal) {
        const xtermModule = await import('@xterm/xterm');
        const fitModule = await import('@xterm/addon-fit');
        XTerminal = xtermModule.Terminal;
        FitAddon = fitModule.FitAddon;

        // Load xterm CSS
        if (!document.querySelector('link[href*="xterm"]')) {
          const link = document.createElement('link');
          link.rel = 'stylesheet';
          link.href = 'https://cdn.jsdelivr.net/npm/@xterm/xterm@5.3.0/css/xterm.min.css';
          document.head.appendChild(link);
        }
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
          scrollback: 50000,
          allowProposedApi: true,
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
          const unsubscribeData = window.electronAPI.onSessionData(terminal.id, (data) => {
            term.write(data);
            // Log to session history for Claude sessions
            if (terminal.type === 'claude') {
               window.electronAPI.logSessionOutput(terminal.id, data);
            }
          });

          const unsubscribeExit = window.electronAPI.onSessionExit(terminal.id, (exitCode) => {
            term.write(`\r\n\x1b[90mProcess exited with code ${exitCode}\x1b[0m\r\n`);
            if (terminal.type === 'claude') {
                setIsExited(true);
            }
          });

          // Send input to backend
          term.onData((data) => {
            window.electronAPI.sendSessionInput(terminal.id, data);
          });

          // Handle resize
          const resizeObserver = new ResizeObserver(() => {
            fitAddon.fit();
            if (window.electronAPI && term.cols && term.rows) {
              window.electronAPI.resizeSession(terminal.id, term.cols, term.rows);
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
          // Demo mode
          term.write('\x1b[1;34mBetter Terminal\x1b[0m\r\n');
        }
      }
    };

    loadXterm();
  }, [terminal.id, setTerminalRef, terminal.type]);

  useEffect(() => {
    if (isActive && fitAddonRef.current && xtermRef.current) {
      // Use setTimeout to ensure DOM has updated after visibility change
      setTimeout(() => {
        fitAddonRef.current?.fit();
        // Refresh the terminal to redraw content after being hidden
        xtermRef.current?.refresh(0, xtermRef.current.rows - 1);
        xtermRef.current?.focus();
      }, 50);

      // Double-check focus after a longer delay (sometimes needed)
      setTimeout(() => {
        if (isActive && xtermRef.current) {
          xtermRef.current.focus();
        }
      }, 200);
    }
  }, [isActive]);

  const handleRestart = async () => {
      // Create new session with same options
      await createTerminal({
          type: 'claude',
          cwd: terminal.cwd,
          permissionMode: terminal.permissionMode
      });
      // Note: Ideally we would replace the current tab, but appending is safer for now.
  };

  return (
    <div
      ref={containerRef}
      onClick={() => xtermRef.current?.focus()}
      style={{
        width: '100%',
        height: '100%',
        padding: '8px',
        boxSizing: 'border-box',
        position: isActive ? 'relative' : 'absolute',
        visibility: isActive ? 'visible' : 'hidden',
        top: 0,
        left: 0,
        zIndex: isActive ? 1 : 0,
      }}
    >
        {isExited && terminal.type === 'claude' && (
        <div
          style={{
            position: 'absolute',
            bottom: 24,
            right: 24,
            zIndex: 10,
          }}
        >
          <button
            onClick={handleRestart}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 16px',
              background: 'var(--accent-primary)',
              color: 'white',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
              boxShadow: 'var(--shadow-lg)',
            }}
          >
            <RefreshCw style={{ width: 16, height: 16 }} />
            Start New Session
          </button>
        </div>
      )}
    </div>
  );
}
