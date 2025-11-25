import React from 'react';
import { ChevronRight, Code, FileText, AlertCircle } from './Icons';

const BLOCK_ICONS = {
  code: Code,
  analysis: FileText,
  diff: Code,
  error: AlertCircle,
};

export default function CollapsibleBlock({ block, onToggle }) {
  const Icon = BLOCK_ICONS[block.type] || FileText;
  const isCollapsed = block.isCollapsed !== false;

  return (
    <div className="collapsible-block">
      <div className="collapsible-header" onClick={onToggle}>
        <ChevronRight
          className={`collapsible-icon ${!isCollapsed ? 'expanded' : ''}`}
        />
        <Icon style={{ width: 16, height: 16, color: 'var(--accent-primary)' }} />
        <span className="collapsible-title">{block.title}</span>
        {block.language && (
          <span className="collapsible-badge">{block.language}</span>
        )}
      </div>
      <div className={`collapsible-content ${!isCollapsed ? 'expanded' : ''}`}>
        {block.type === 'code' || block.type === 'diff' ? (
          <pre style={{ margin: 0 }}>
            <code>{block.content}</code>
          </pre>
        ) : (
          <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
            {block.content}
          </div>
        )}
      </div>
    </div>
  );
}
