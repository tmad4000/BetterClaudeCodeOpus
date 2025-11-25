import React, { useState } from 'react';
import { ChevronRight, Terminal, CheckCircle, Clock, AlertCircle } from './Icons';

const STATUS_CONFIG = {
  success: { icon: CheckCircle, label: 'Success', className: 'success' },
  pending: { icon: Clock, label: 'Running', className: 'pending' },
  error: { icon: AlertCircle, label: 'Error', className: 'error' },
};

export default function ToolCallBlock({ toolCall, onToggle }) {
  const [isCollapsed, setIsCollapsed] = useState(toolCall.isCollapsed !== false);
  const statusConfig = STATUS_CONFIG[toolCall.status] || STATUS_CONFIG.pending;
  const StatusIcon = statusConfig.icon;

  const handleToggle = () => {
    setIsCollapsed(!isCollapsed);
    onToggle?.();
  };

  const formatInput = (input) => {
    if (typeof input === 'string') return input;
    return JSON.stringify(input, null, 2);
  };

  return (
    <div className="tool-call">
      <div className="tool-call-header" onClick={handleToggle} style={{ cursor: 'pointer' }}>
        <ChevronRight
          className={`collapsible-icon ${!isCollapsed ? 'expanded' : ''}`}
          style={{ width: 14, height: 14 }}
        />
        <Terminal className="tool-call-icon" />
        <span className="tool-call-name">{toolCall.name}</span>
        <span className={`tool-call-status ${statusConfig.className}`}>
          <StatusIcon style={{ width: 12, height: 12, marginRight: 4, display: 'inline' }} />
          {statusConfig.label}
        </span>
      </div>
      {!isCollapsed && (
        <div className="tool-call-content">
          {toolCall.input && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ color: 'var(--text-muted)', marginBottom: 4, fontSize: 11, textTransform: 'uppercase' }}>
                Input
              </div>
              <div style={{ color: 'var(--text-primary)' }}>
                {formatInput(toolCall.input)}
              </div>
            </div>
          )}
          {toolCall.output && (
            <div>
              <div style={{ color: 'var(--text-muted)', marginBottom: 4, fontSize: 11, textTransform: 'uppercase' }}>
                Output
              </div>
              <div style={{ color: 'var(--accent-green)' }}>
                {toolCall.output}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
