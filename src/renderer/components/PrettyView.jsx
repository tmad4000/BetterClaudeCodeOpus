import React, { useState, useEffect, useRef } from 'react';
import { ChevronRight, ChevronDown, Code, FileText, Terminal, Copy, CheckCircle } from './Icons';

// Parse ANSI escape codes and convert to styled spans
function parseAnsi(text) {
  // Simple ANSI parser - strips codes for pretty view
  return text.replace(/\x1b\[[0-9;]*m/g, '');
}

// Detect message type from content
function detectMessageType(content) {
  const clean = parseAnsi(content).toLowerCase();
  if (clean.includes('reading') || clean.includes('read file')) return 'read';
  if (clean.includes('writing') || clean.includes('wrote') || clean.includes('edit')) return 'write';
  if (clean.includes('running') || clean.includes('bash') || clean.includes('$')) return 'command';
  if (clean.includes('error') || clean.includes('failed')) return 'error';
  if (clean.includes('search') || clean.includes('grep') || clean.includes('glob')) return 'search';
  return 'message';
}

// Collapsible block component
function CollapsibleBlock({ title, type, children, defaultExpanded = false, timestamp }) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [copied, setCopied] = useState(false);

  const typeColors = {
    read: 'var(--accent-cyan)',
    write: 'var(--accent-green)',
    command: 'var(--accent-orange)',
    error: 'var(--accent-red)',
    search: 'var(--accent-purple)',
    message: 'var(--text-secondary)',
    user: 'var(--accent-primary)',
  };

  const typeIcons = {
    read: FileText,
    write: FileText,
    command: Terminal,
    error: FileText,
    search: FileText,
    message: FileText,
    user: FileText,
  };

  const Icon = typeIcons[type] || FileText;
  const color = typeColors[type] || 'var(--text-secondary)';

  const handleCopy = (e) => {
    e.stopPropagation();
    const text = typeof children === 'string' ? children : '';
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      style={{
        marginBottom: 8,
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-primary)',
        borderRadius: 'var(--radius-md)',
        overflow: 'hidden',
      }}
    >
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '10px 12px',
          cursor: 'pointer',
          background: isExpanded ? 'var(--bg-tertiary)' : 'transparent',
        }}
      >
        <span style={{ color: 'var(--text-muted)', width: 16 }}>
          {isExpanded ? (
            <ChevronDown style={{ width: 16, height: 16 }} />
          ) : (
            <ChevronRight style={{ width: 16, height: 16 }} />
          )}
        </span>
        <Icon style={{ width: 16, height: 16, color }} />
        <span style={{ flex: 1, fontSize: 13, color: 'var(--text-primary)', fontWeight: 500 }}>
          {title}
        </span>
        {timestamp && (
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            {new Date(timestamp).toLocaleTimeString()}
          </span>
        )}
        <button
          onClick={handleCopy}
          style={{
            background: 'transparent',
            border: 'none',
            padding: 4,
            cursor: 'pointer',
            color: copied ? 'var(--accent-green)' : 'var(--text-muted)',
          }}
        >
          {copied ? (
            <CheckCircle style={{ width: 14, height: 14 }} />
          ) : (
            <Copy style={{ width: 14, height: 14 }} />
          )}
        </button>
      </div>
      {isExpanded && (
        <div
          style={{
            padding: '12px 16px',
            borderTop: '1px solid var(--border-primary)',
            fontFamily: 'monospace',
            fontSize: 12,
            lineHeight: 1.5,
            whiteSpace: 'pre-wrap',
            color: 'var(--text-secondary)',
            maxHeight: 400,
            overflow: 'auto',
          }}
        >
          {children}
        </div>
      )}
    </div>
  );
}

// User message component
function UserMessage({ content, timestamp }) {
  return (
    <div
      style={{
        marginBottom: 12,
        display: 'flex',
        justifyContent: 'flex-end',
      }}
    >
      <div
        style={{
          maxWidth: '80%',
          padding: '10px 14px',
          background: 'var(--accent-primary)',
          color: 'white',
          borderRadius: 'var(--radius-md)',
          borderBottomRightRadius: 4,
          fontSize: 13,
        }}
      >
        {content}
        {timestamp && (
          <div style={{ fontSize: 10, opacity: 0.7, marginTop: 4, textAlign: 'right' }}>
            {new Date(timestamp).toLocaleTimeString()}
          </div>
        )}
      </div>
    </div>
  );
}

// Assistant message component
function AssistantMessage({ content, blocks, timestamp }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div
        style={{
          fontSize: 11,
          color: 'var(--text-muted)',
          marginBottom: 6,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        <span style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: 'var(--accent-primary)'
        }} />
        Claude
        {timestamp && (
          <span style={{ marginLeft: 'auto' }}>
            {new Date(timestamp).toLocaleTimeString()}
          </span>
        )}
      </div>

      {/* Text content */}
      {content && (
        <div
          style={{
            padding: '10px 14px',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-primary)',
            borderRadius: 'var(--radius-md)',
            fontSize: 13,
            lineHeight: 1.6,
            color: 'var(--text-primary)',
            marginBottom: blocks?.length ? 8 : 0,
          }}
        >
          {content}
        </div>
      )}

      {/* Tool use blocks */}
      {blocks?.map((block, i) => (
        <CollapsibleBlock
          key={i}
          title={block.title}
          type={block.type}
          timestamp={block.timestamp}
          defaultExpanded={block.type === 'error'}
        >
          {block.content}
        </CollapsibleBlock>
      ))}
    </div>
  );
}

export default function PrettyView({ sessionId, isActive }) {
  const [messages, setMessages] = useState([]);
  const [rawBuffer, setRawBuffer] = useState('');
  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    if (!window.electronAPI || !sessionId) return;

    // Listen to raw output and parse it
    const unsubscribe = window.electronAPI.onClaudeOutput(sessionId, (data) => {
      setRawBuffer(prev => {
        const newBuffer = prev + data;
        // Try to parse messages from buffer
        parseBuffer(newBuffer);
        return newBuffer;
      });
    });

    return () => unsubscribe();
  }, [sessionId]);

  const parseBuffer = (buffer) => {
    // This is a simplified parser - in reality you'd want more sophisticated parsing
    // For now, we'll just show the raw output in blocks
    const clean = parseAnsi(buffer);

    // Split by common patterns
    const lines = clean.split('\n');
    const newMessages = [];
    let currentBlock = { type: 'message', content: '', lines: [] };

    for (const line of lines) {
      if (line.includes('❯') || line.includes('>')) {
        // User input prompt
        if (currentBlock.lines.length > 0) {
          newMessages.push({ ...currentBlock, content: currentBlock.lines.join('\n') });
        }
        currentBlock = { type: 'user', content: '', lines: [] };
      } else if (line.includes('Reading') || line.includes('Read ')) {
        if (currentBlock.lines.length > 0) {
          newMessages.push({ ...currentBlock, content: currentBlock.lines.join('\n') });
        }
        currentBlock = { type: 'read', title: line.trim(), content: '', lines: [] };
      } else if (line.includes('Writing') || line.includes('Wrote') || line.includes('Edit')) {
        if (currentBlock.lines.length > 0) {
          newMessages.push({ ...currentBlock, content: currentBlock.lines.join('\n') });
        }
        currentBlock = { type: 'write', title: line.trim(), content: '', lines: [] };
      } else if (line.includes('Running') || line.includes('$ ')) {
        if (currentBlock.lines.length > 0) {
          newMessages.push({ ...currentBlock, content: currentBlock.lines.join('\n') });
        }
        currentBlock = { type: 'command', title: line.trim(), content: '', lines: [] };
      } else {
        currentBlock.lines.push(line);
      }
    }

    if (currentBlock.lines.length > 0) {
      newMessages.push({ ...currentBlock, content: currentBlock.lines.join('\n') });
    }

    if (newMessages.length > 0) {
      setMessages(newMessages);
    }
  };

  useEffect(() => {
    // Auto-scroll to bottom
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages, rawBuffer]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputValue.trim() || !window.electronAPI) return;

    window.electronAPI.sendClaudeMessage(sessionId, inputValue + '\r');
    setInputValue('');
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
      {/* Messages area */}
      <div
        ref={containerRef}
        style={{
          flex: 1,
          overflow: 'auto',
          padding: 16,
        }}
      >
        {messages.length === 0 ? (
          <div
            style={{
              padding: '12px 16px',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-primary)',
              borderRadius: 'var(--radius-md)',
              fontSize: 13,
              color: 'var(--text-muted)',
              fontFamily: 'monospace',
              whiteSpace: 'pre-wrap',
              lineHeight: 1.5,
            }}
          >
            {parseAnsi(rawBuffer) || 'Waiting for Claude...'}
          </div>
        ) : (
          messages.map((msg, i) => {
            if (msg.type === 'user') {
              return <UserMessage key={i} content={msg.content} />;
            }
            return (
              <CollapsibleBlock
                key={i}
                title={msg.title || (msg.type === 'message' ? 'Output' : msg.type)}
                type={msg.type}
                defaultExpanded={msg.type === 'message' || msg.type === 'error'}
              >
                {msg.content}
              </CollapsibleBlock>
            );
          })
        )}
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
