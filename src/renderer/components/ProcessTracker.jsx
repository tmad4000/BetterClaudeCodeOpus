import React, { useState, useEffect, useCallback } from 'react';
import { Activity, X, RefreshCw, Globe, Server, Cpu, ExternalLink } from './Icons';

export default function ProcessTracker({ isExpanded, onToggle }) {
  const [ports, setPorts] = useState([]);
  const [claudeSessions, setClaudeSessions] = useState([]);
  const [subagents, setSubagents] = useState([]);
  const [isScanning, setIsScanning] = useState(false);
  const [lastScan, setLastScan] = useState(null);

  const scanPorts = useCallback(async () => {
    if (!window.electronAPI) return;

    setIsScanning(true);
    try {
      const [portResults, sessionResults, subagentResults] = await Promise.all([
        window.electronAPI.scanPorts(),
        window.electronAPI.getClaudeSessions(),
        window.electronAPI.getSubagents(),
      ]);
      setPorts(portResults);
      setClaudeSessions(sessionResults);
      setSubagents(subagentResults || []);
      setLastScan(Date.now());
    } catch (error) {
      console.error('Failed to scan ports:', error);
    }
    setIsScanning(false);
  }, []);

  useEffect(() => {
    // Initial scan
    scanPorts();

    // Set up auto-refresh every 10 seconds when expanded
    let interval;
    if (isExpanded) {
      interval = setInterval(scanPorts, 10000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isExpanded, scanPorts]);

  const handleKillProcess = async (pid) => {
    if (!window.electronAPI) return;

    const result = await window.electronAPI.killProcess(pid);
    if (result.success) {
      // Refresh the list
      scanPorts();
    } else {
      console.error('Failed to kill process:', result.error);
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  };

  // Group ports by common dev servers
  const categorizedPorts = ports.reduce((acc, port) => {
    let category = 'other';
    if (port.command.includes('node') || port.command.includes('npm')) {
      category = 'node';
    } else if (port.command.includes('python') || port.command.includes('Python')) {
      category = 'python';
    } else if (port.command.includes('ruby') || port.command.includes('rails')) {
      category = 'ruby';
    } else if (port.command.includes('java') || port.command.includes('gradle')) {
      category = 'java';
    }
    if (!acc[category]) acc[category] = [];
    acc[category].push(port);
    return acc;
  }, {});

  return (
    <div
      style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-primary)',
        borderRadius: 'var(--radius-md)',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        onClick={onToggle}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '10px 12px',
          cursor: 'pointer',
          background: isExpanded ? 'var(--bg-tertiary)' : 'transparent',
        }}
      >
        <Activity style={{ width: 16, height: 16, color: 'var(--accent-green)' }} />
        <span style={{ flex: 1, fontSize: 13, fontWeight: 500 }}>
          Processes & Servers
        </span>
        <div style={{ display: 'flex', gap: 6, fontSize: 11 }}>
          {subagents.length > 0 && (
            <span style={{ color: 'var(--accent-yellow)', fontWeight: 500 }}>
              {subagents.length} agent{subagents.length !== 1 ? 's' : ''}
            </span>
          )}
          {ports.length > 0 && (
            <span style={{ color: 'var(--accent-cyan)' }}>
              {ports.length} server{ports.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        <span
          style={{
            transform: isExpanded ? 'rotate(180deg)' : 'rotate(0)',
            transition: 'transform 0.2s',
            color: 'var(--text-muted)',
          }}
        >
          ▼
        </span>
      </div>

      {/* Expanded content */}
      {isExpanded && (
        <div style={{ padding: '0 12px 12px' }}>
          {/* Refresh button and last scan time */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 12,
              paddingTop: 8,
            }}
          >
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              {lastScan && `Last scan: ${formatTime(lastScan)}`}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                scanPorts();
              }}
              disabled={isScanning}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                padding: '4px 8px',
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--border-primary)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text-secondary)',
                fontSize: 11,
                cursor: isScanning ? 'wait' : 'pointer',
              }}
            >
              <RefreshCw
                style={{
                  width: 12,
                  height: 12,
                  animation: isScanning ? 'spin 1s linear infinite' : 'none',
                }}
              />
              Refresh
            </button>
          </div>

          {/* Running Servers - Most prominent section */}
          {ports.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: 'var(--accent-cyan)',
                  marginBottom: 6,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <Globe style={{ width: 12, height: 12 }} />
                Running Servers
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {ports.map((port) => (
                  <div
                    key={`${port.port}-${port.pid}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '8px 10px',
                      background: 'linear-gradient(135deg, rgba(34, 211, 238, 0.1) 0%, rgba(34, 211, 238, 0.05) 100%)',
                      border: '1px solid rgba(34, 211, 238, 0.2)',
                      borderRadius: 'var(--radius-sm)',
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <a
                        href={`http://localhost:${port.port}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          color: 'var(--accent-cyan)',
                          fontFamily: 'monospace',
                          textDecoration: 'none',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                        }}
                      >
                        localhost:{port.port}
                        <ExternalLink style={{ width: 12, height: 12, opacity: 0.7 }} />
                      </a>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
                        {port.command} (PID: {port.pid})
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleKillProcess(port.pid);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 24,
                        height: 24,
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.2)',
                        borderRadius: 'var(--radius-sm)',
                        color: 'var(--accent-red)',
                        cursor: 'pointer',
                      }}
                      title="Stop server"
                    >
                      <X style={{ width: 12, height: 12 }} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sub-agents / Child Processes */}
          {subagents.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: 'var(--accent-yellow)',
                  marginBottom: 6,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <Cpu style={{ width: 12, height: 12 }} />
                Sub-Agents & Processes
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {subagents.map((agent) => (
                  <div
                    key={agent.pid}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '6px 8px',
                      paddingLeft: 8 + (agent.depth * 12),
                      background: agent.isSubagent
                        ? 'linear-gradient(135deg, rgba(250, 204, 21, 0.1) 0%, rgba(250, 204, 21, 0.05) 100%)'
                        : 'var(--bg-primary)',
                      border: agent.isSubagent ? '1px solid rgba(250, 204, 21, 0.2)' : 'none',
                      borderRadius: 'var(--radius-sm)',
                    }}
                  >
                    <Cpu style={{
                      width: 14,
                      height: 14,
                      color: agent.isSubagent ? 'var(--accent-yellow)' : 'var(--text-muted)',
                      flexShrink: 0,
                    }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 11,
                          color: agent.isSubagent ? 'var(--text-primary)' : 'var(--text-secondary)',
                          fontFamily: 'monospace',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                        title={agent.command}
                      >
                        {agent.command.length > 50 ? agent.command.slice(0, 50) + '...' : agent.command}
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                        PID: {agent.pid}
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleKillProcess(agent.pid);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 20,
                        height: 20,
                        background: 'transparent',
                        border: 'none',
                        borderRadius: 'var(--radius-sm)',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        flexShrink: 0,
                      }}
                      title="Kill process"
                    >
                      <X style={{ width: 12, height: 12 }} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Claude Sessions */}
          {claudeSessions.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: 'var(--text-muted)',
                  marginBottom: 6,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <Server style={{ width: 12, height: 12 }} />
                Claude Sessions
              </div>
              {claudeSessions.map((session) => (
                <div
                  key={session.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '6px 8px',
                    background: 'var(--bg-primary)',
                    borderRadius: 'var(--radius-sm)',
                    marginBottom: 4,
                  }}
                >
                  <Server style={{ width: 14, height: 14, color: 'var(--accent-primary)' }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-primary)' }}>
                      Session {session.id}
                    </div>
                    <div
                      style={{
                        fontSize: 10,
                        color: 'var(--text-muted)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      PID: {session.pid} • {session.cwd}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty state */}
          {ports.length === 0 && subagents.length === 0 && claudeSessions.length === 0 && (
            <div
              style={{
                padding: '16px',
                textAlign: 'center',
                color: 'var(--text-muted)',
                fontSize: 12,
              }}
            >
              No active processes or servers detected
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
