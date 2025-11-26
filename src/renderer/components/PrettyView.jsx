import React, { useState, useEffect, useRef } from 'react';
import { Copy, CheckCircle } from './Icons';

// Parse ANSI escape codes and convert to styled spans
function parseAnsi(text) {
  // Simple ANSI parser - strips codes for clean text view
  return text.replace(/\x1b\[[0-9;]*[mGKHJ]/g, '');
}

// Simple text cleaning - removes control characters but preserves newlines
function cleanText(text) {
  return parseAnsi(text)
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    // Remove cursor movement sequences
    .replace(/\x1b\[\d*[ABCD]/g, '')
    // Remove other escape sequences
    .replace(/\x1b\][^\x07]*\x07/g, '')
    .replace(/\x1b[()][AB012]/g, '')
    .replace(/\x1b\[[\d;]*[a-zA-Z]/g, '');
}

export default function PrettyView({ sessionId, isActive }) {
  const [rawBuffer, setRawBuffer] = useState('');
  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const [inputValue, setInputValue] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!window.electronAPI || !sessionId) return;

    // Listen to raw output
    const unsubscribe = window.electronAPI.onClaudeOutput(sessionId, (data) => {
      setRawBuffer(prev => prev + data);
    });

    return () => unsubscribe();
  }, [sessionId]);

  useEffect(() => {
    // Auto-scroll to bottom
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [rawBuffer]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputValue.trim() || !window.electronAPI) return;

    window.electronAPI.sendClaudeMessage(sessionId, inputValue + '\r');
    setInputValue('');
  };

  const handleCopy = () => {
    const cleanedText = cleanText(rawBuffer);
    navigator.clipboard.writeText(cleanedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const cleanedOutput = cleanText(rawBuffer);

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
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          Clean text view (ANSI codes stripped)
        </span>
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
          {cleanedOutput || 'Waiting for Claude output...'}
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
            placeholder="Type a message..."
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
      </form>
    </div>
  );
}
