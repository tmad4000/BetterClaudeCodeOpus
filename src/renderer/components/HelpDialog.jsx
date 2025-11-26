import React from 'react';
import { X, Terminal, Sparkles, Zap, Keyboard, Folder, ExternalLink } from './Icons';

const shortcuts = [
  { keys: 'Cmd+T', action: 'New terminal tab' },
  { keys: 'Cmd+N', action: 'New window' },
  { keys: 'Cmd+B', action: 'Toggle sidebar' },
  { keys: 'Cmd+W', action: 'Close tab/window' },
  { keys: 'Cmd+?', action: 'Show this help' },
  { keys: 'Ctrl+C', action: 'Interrupt (in terminal)' },
];

const cliExamples = [
  { cmd: 'better-terminal .', desc: 'Open in current directory' },
  { cmd: 'better-terminal /path/to/project', desc: 'Open in specific directory' },
  { cmd: 'better-terminal . --yolo', desc: 'Start with YOLO mode' },
  { cmd: 'better-terminal . -y', desc: 'Short form for YOLO' },
];

const devExamples = [
  { cmd: 'npm start -- .', desc: 'Dev mode: open in current directory' },
  { cmd: 'npm start -- /path/to/project --yolo', desc: 'Dev mode: YOLO in specific dir' },
];

export default function HelpDialog({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--bg-primary)',
          border: '1px solid var(--border-primary)',
          borderRadius: 'var(--radius-lg)',
          width: '90%',
          maxWidth: 600,
          maxHeight: '85vh',
          overflow: 'auto',
          boxShadow: 'var(--shadow-lg)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
            borderBottom: '1px solid var(--border-primary)',
            background: 'var(--bg-secondary)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Terminal style={{ width: 20, height: 20, color: 'var(--accent-primary)' }} />
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Better Terminal Help</h2>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              padding: 4,
              cursor: 'pointer',
              color: 'var(--text-muted)',
              borderRadius: 'var(--radius-sm)',
            }}
          >
            <X style={{ width: 18, height: 18 }} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: 20 }}>
          {/* Keyboard Shortcuts */}
          <section style={{ marginBottom: 24 }}>
            <h3 style={{
              fontSize: 13,
              fontWeight: 600,
              color: 'var(--text-primary)',
              marginBottom: 12,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}>
              <Keyboard style={{ width: 16, height: 16, color: 'var(--accent-cyan)' }} />
              Keyboard Shortcuts
            </h3>
            <div style={{
              background: 'var(--bg-secondary)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-primary)',
              overflow: 'hidden',
            }}>
              {shortcuts.map((s, i) => (
                <div
                  key={s.keys}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '10px 14px',
                    borderBottom: i < shortcuts.length - 1 ? '1px solid var(--border-primary)' : 'none',
                  }}
                >
                  <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{s.action}</span>
                  <kbd style={{
                    background: 'var(--bg-tertiary)',
                    padding: '4px 8px',
                    borderRadius: 4,
                    fontSize: 12,
                    fontFamily: 'monospace',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border-primary)',
                  }}>
                    {s.keys}
                  </kbd>
                </div>
              ))}
            </div>
          </section>

          {/* Permission Modes */}
          <section style={{ marginBottom: 24 }}>
            <h3 style={{
              fontSize: 13,
              fontWeight: 600,
              color: 'var(--text-primary)',
              marginBottom: 12,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}>
              <Sparkles style={{ width: 16, height: 16, color: 'var(--accent-primary)' }} />
              Permission Modes
            </h3>
            <div style={{
              background: 'var(--bg-secondary)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-primary)',
              padding: 14,
            }}>
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 4 }}>
                  Default
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  Normal mode with permission confirmations for file writes, commands, etc.
                </div>
              </div>
              <div style={{ marginBottom: 12 }}>
                <div style={{
                  fontSize: 13,
                  fontWeight: 500,
                  color: 'var(--accent-orange)',
                  marginBottom: 4,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}>
                  <Zap style={{ width: 14, height: 14 }} />
                  YOLO
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  Skip all permission prompts. Use for trusted projects when you want faster iteration.
                  Runs with <code style={{ background: 'var(--bg-tertiary)', padding: '2px 4px', borderRadius: 2 }}>--dangerously-skip-permissions</code>
                </div>
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--accent-cyan)', marginBottom: 4 }}>
                  Plan
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  (Coming soon) Plan mode for careful execution with review steps.
                </div>
              </div>
            </div>
          </section>

          {/* CLI Usage */}
          <section style={{ marginBottom: 24 }}>
            <h3 style={{
              fontSize: 13,
              fontWeight: 600,
              color: 'var(--text-primary)',
              marginBottom: 12,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}>
              <Terminal style={{ width: 16, height: 16, color: 'var(--accent-green)' }} />
              Command Line Usage
            </h3>
            <div style={{
              background: 'var(--bg-secondary)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-primary)',
              overflow: 'hidden',
            }}>
              {cliExamples.map((ex, i) => (
                <div
                  key={ex.cmd}
                  style={{
                    padding: '10px 14px',
                    borderBottom: i < cliExamples.length - 1 ? '1px solid var(--border-primary)' : 'none',
                  }}
                >
                  <code style={{
                    display: 'block',
                    fontSize: 12,
                    fontFamily: 'monospace',
                    color: 'var(--accent-cyan)',
                    marginBottom: 4,
                  }}>
                    {ex.cmd}
                  </code>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{ex.desc}</span>
                </div>
              ))}
            </div>

            {/* Dev mode subsection */}
            <div style={{
              marginTop: 12,
              padding: 12,
              background: 'var(--bg-tertiary)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-primary)',
            }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase' }}>
                Development Mode
              </div>
              {devExamples.map((ex, i) => (
                <div key={ex.cmd} style={{ marginBottom: i < devExamples.length - 1 ? 8 : 0 }}>
                  <code style={{
                    display: 'block',
                    fontSize: 11,
                    fontFamily: 'monospace',
                    color: 'var(--accent-green)',
                    marginBottom: 2,
                  }}>
                    {ex.cmd}
                  </code>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{ex.desc}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Shell Alias Tip */}
          <section style={{ marginBottom: 24 }}>
            <h3 style={{
              fontSize: 13,
              fontWeight: 600,
              color: 'var(--text-primary)',
              marginBottom: 12,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}>
              <Folder style={{ width: 16, height: 16, color: 'var(--accent-purple)' }} />
              Quick Launch Tip
            </h3>
            <div style={{
              background: 'var(--bg-secondary)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-primary)',
              padding: 14,
            }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10 }}>
                Add to your <code style={{ background: 'var(--bg-tertiary)', padding: '2px 4px', borderRadius: 2 }}>~/.zshrc</code>:
              </div>
              <pre style={{
                background: 'var(--bg-tertiary)',
                padding: 12,
                borderRadius: 'var(--radius-sm)',
                fontSize: 11,
                fontFamily: 'monospace',
                color: 'var(--text-primary)',
                overflow: 'auto',
                margin: 0,
              }}>
{`# Quick launch
alias bt='open -a "Better Claude Code" --args "$(pwd)"'

# YOLO mode
alias bty='open -a "Better Claude Code" --args "$(pwd)" --yolo'`}
              </pre>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 10 }}>
                Then type <code style={{ background: 'var(--bg-tertiary)', padding: '2px 4px', borderRadius: 2 }}>bt</code> or{' '}
                <code style={{ background: 'var(--bg-tertiary)', padding: '2px 4px', borderRadius: 2 }}>bty</code> from any directory!
              </div>
            </div>
          </section>

          {/* Footer */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            paddingTop: 8,
          }}>
            <a
              href="https://github.com/tmad4000/BetterClaudeCodeOpus"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 12,
                color: 'var(--text-muted)',
                textDecoration: 'none',
              }}
            >
              <ExternalLink style={{ width: 14, height: 14 }} />
              View on GitHub
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
