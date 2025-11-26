import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTerminal } from '../context/TerminalContext';
import { Copy, CheckCircle, RefreshCw } from './Icons';

// Extract text from xterm buffer - this gives us the "rendered" view
function getBufferText(term) {
  if (!term || !term.buffer) return '';

  const buffer = term.buffer.active;
  const lines = [];

  // Get all lines from the buffer
  for (let i = 0; i < buffer.length; i++) {
    const line = buffer.getLine(i);
    if (line) {
      lines.push(line.translateToString(true)); // true = trim trailing whitespace
    }
  }

  // Join and clean up excessive blank lines
  let text = lines.join('\n');

  // Remove excessive consecutive newlines (more than 2)
  text = text.replace(/\n{3,}/g, '\n\n');

  // Trim leading/trailing whitespace
  text = text.trim();

  return text;
}

export default function PrettyView({ sessionId, isActive }) {
  const { getTerminalRef } = useTerminal();
  const [bufferText, setBufferText] = useState('');
  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const [inputValue, setInputValue] = useState('');
  const [copied, setCopied] = useState(false);

  // Update buffer text periodically when active
  const updateBufferText = useCallback(() => {
    const termRef = getTerminalRef(sessionId);
    if (termRef?.term) {
      const text = getBufferText(termRef.term);
      setBufferText(text);
    }
  }, [sessionId, getTerminalRef]);

  useEffect(() => {
    if (!isActive) return;

    // Update immediately when becoming active
    updateBufferText();

    // Poll for updates while active
    const interval = setInterval(updateBufferText, 500);

    return () => clearInterval(interval);
  }, [isActive, updateBufferText]);

  useEffect(() => {
    // Auto-scroll to bottom when content changes
    if (containerRef.current && isActive) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [bufferText, isActive]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputValue.trim() || !window.electronAPI) return;

    window.electronAPI.sendClaudeMessage(sessionId, inputValue + '\r');
    setInputValue('');

    // Update view after sending
    setTimeout(updateBufferText, 100);
  };

  const handleKeyDown = (e) => {
    // Enter sends, Shift+Enter or Option+Enter for newline
    if (e.key === 'Enter' && !e.shiftKey && !e.altKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(bufferText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      style={{
        display: isActive ? 'flex' : 'none',
        flexDirection: 'column',
        height: '100%',
        background: 'var(--bg-primary)',
      }}
    >
      {/* Header bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 16px',
          background: 'var(--bg-secondary)',
          borderBottom: '1px solid var(--border-primary)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            Clean text view (from terminal buffer)
          </span>
          <button
            onClick={updateBufferText}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              padding: '2px 6px',
              background: 'transparent',
              border: '1px solid var(--border-primary)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-muted)',
              fontSize: 11,
              cursor: 'pointer',
            }}
            title="Refresh view"
          >
            <RefreshCw style={{ width: 12, height: 12 }} />
          </button>
        </div>
        <button
          onClick={handleCopy}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '4px 10px',
            background: 'var(--bg-tertiary)',
            border: '1px solid var(--border-primary)',
            borderRadius: 'var(--radius-sm)',
            color: copied ? 'var(--accent-green)' : 'var(--text-secondary)',
            fontSize: 12,
            cursor: 'pointer',
          }}
        >
          {copied ? (
            <>
              <CheckCircle style={{ width: 14, height: 14 }} />
              Copied!
            </>
          ) : (
            <>
              <Copy style={{ width: 14, height: 14 }} />
              Copy All
            </>
          )}
        </button>
      </div>

      {/* Clean output area */}
      <div
        ref={containerRef}
        style={{
          flex: 1,
          overflow: 'auto',
          padding: 16,
        }}
      >
        <div
          style={{
            fontFamily: '"JetBrains Mono", "SF Mono", Monaco, monospace',
            fontSize: 13,
            lineHeight: 1.6,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            color: 'var(--text-primary)',
          }}
        >
          {bufferText || 'Waiting for Claude output...'}
        </div>
      </div>

      {/* Input area */}
      <form
        onSubmit={handleSubmit}
        style={{
          padding: 16,
          borderTop: '1px solid var(--border-primary)',
          background: 'var(--bg-secondary)',
        }}
      >
        <div
          style={{
            display: 'flex',
            gap: 8,
            alignItems: 'center',
          }}
        >
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message... (Enter to send)"
            style={{
              flex: 1,
              padding: '10px 14px',
              background: 'var(--bg-primary)',
              border: '1px solid var(--border-primary)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-primary)',
              fontSize: 13,
              outline: 'none',
              fontFamily: '"JetBrains Mono", "SF Mono", Monaco, monospace',
            }}
          />
          <button
            type="submit"
            style={{
              padding: '10px 16px',
              background: 'var(--accent-primary)',
              color: 'white',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Send
          </button>
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>
          Press Enter to send
        </div>
      </form>
    </div>
  );
}
