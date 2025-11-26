import React, { useEffect, useRef, useState } from 'react';
import { useClaudeSession } from '../context/ClaudeSessionContext';
import { RefreshCw } from './Icons';

let XTerminal;
let FitAddon;

export default function ClaudeTerminal({ sessionId, isActive, onReady }) {
  const containerRef = useRef(null);
  const xtermRef = useRef(null);
  const fitAddonRef = useRef(null);
  const { setTerminalRef, createSession, currentCwd } = useClaudeSession();
  const [isLoaded, setIsLoaded] = useState(false);
  const [isExited, setIsExited] = useState(false);

  useEffect(() => {
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
            selectionBackground: '#3b5070',
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
          fontFamily: '"JetBrains Mono", "SF Mono", Monaco, "Cascadia Code", monospace',
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

        // Ensure container is properly sized
        requestAnimationFrame(() => {
          fitAddon.fit();
        });

        xtermRef.current = term;
        fitAddonRef.current = fitAddon;
        setTerminalRef(sessionId, { term, fitAddon });

        // Set up data listeners
        if (window.electronAPI) {
          // Send keyboard input to Claude process
          term.onData((data) => {
            window.electronAPI.sendClaudeMessage(sessionId, data);
          });

          const unsubscribeData = window.electronAPI.onClaudeOutput(sessionId, (data) => {
            term.write(data);
            // Log to session history
            window.electronAPI.logSessionOutput(sessionId, data);
          });

          const unsubscribeExit = window.electronAPI.onClaudeExit(sessionId, (exitCode) => {
            term.write(`\r\n\x1b[90m[Session ended with code ${exitCode}]\x1b[0m\r\n`);
            setIsExited(true);
          });

          // Handle resize
          const resizeObserver = new ResizeObserver(() => {
            if (containerRef.current && containerRef.current.offsetWidth > 0) {
              fitAddon.fit();
              if (window.electronAPI && term.cols && term.rows) {
                window.electronAPI.resizeClaudeSession(sessionId, term.cols, term.rows);
              }
            }
          });

          if (containerRef.current) {
            resizeObserver.observe(containerRef.current);
          }

          setIsLoaded(true);
          onReady?.();

          return () => {
            unsubscribeData();
            unsubscribeExit();
            resizeObserver.disconnect();
            term.dispose();
          };
        }
      }
    };

    loadXterm();
  }, [sessionId, setTerminalRef, onReady]);

  useEffect(() => {
    if (isActive && fitAddonRef.current && xtermRef.current) {
      requestAnimationFrame(() => {
        fitAddonRef.current?.fit();
        xtermRef.current?.focus();
      });
    }
  }, [isActive]);

  return (
    <div
      ref={containerRef}
      onClick={() => xtermRef.current?.focus()}
      style={{
        width: '100%',
        height: '100%',
        display: isActive ? 'block' : 'none',
        backgroundColor: '#0d1117',
        padding: '8px',
        boxSizing: 'border-box',
        position: 'relative',
      }}
    >
      {isExited && (
        <div
          style={{
            position: 'absolute',
            bottom: 24,
            right: 24,
            zIndex: 10,
          }}
        >
          <button
            onClick={() => createSession({ cwd: currentCwd })}
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
