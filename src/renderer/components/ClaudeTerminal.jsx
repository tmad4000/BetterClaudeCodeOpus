import React, { useEffect, useRef, useState } from 'react';
import { useClaudeSession } from '../context/ClaudeSessionContext';

let XTerminal;
let FitAddon;

export default function ClaudeTerminal({ sessionId, isActive, onReady }) {
  const containerRef = useRef(null);
  const xtermRef = useRef(null);
  const fitAddonRef = useRef(null);
  const { setTerminalRef } = useClaudeSession();
  const [isLoaded, setIsLoaded] = useState(false);

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

        // Small delay to ensure container is properly sized
        setTimeout(() => {
          fitAddon.fit();
        }, 50);

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
      setTimeout(() => {
        fitAddonRef.current?.fit();
        xtermRef.current?.focus();
      }, 50);
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
      }}
    />
  );
}
