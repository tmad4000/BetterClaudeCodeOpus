import React, { useState, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import MainContent from './components/MainContent';
import RightPanel from './components/RightPanel';
import TerminalPanel from './components/TerminalPanel';
import { ConversationProvider } from './context/ConversationContext';
import { TerminalProvider } from './context/TerminalContext';

export default function App() {
  const [viewMode, setViewMode] = useState('split'); // 'conversation', 'terminal', 'split'
  const [rightPanelOpen, setRightPanelOpen] = useState(true);
  const [terminalHeight, setTerminalHeight] = useState(250);
  const [isResizingTerminal, setIsResizingTerminal] = useState(false);

  const handleTerminalResize = useCallback((e) => {
    if (!isResizingTerminal) return;
    const windowHeight = window.innerHeight;
    const newHeight = windowHeight - e.clientY;
    setTerminalHeight(Math.max(100, Math.min(newHeight, windowHeight - 200)));
  }, [isResizingTerminal]);

  const handleResizeEnd = useCallback(() => {
    setIsResizingTerminal(false);
    document.removeEventListener('mousemove', handleTerminalResize);
    document.removeEventListener('mouseup', handleResizeEnd);
  }, [handleTerminalResize]);

  const startTerminalResize = useCallback(() => {
    setIsResizingTerminal(true);
  }, []);

  React.useEffect(() => {
    if (isResizingTerminal) {
      document.addEventListener('mousemove', handleTerminalResize);
      document.addEventListener('mouseup', handleResizeEnd);
    }
    return () => {
      document.removeEventListener('mousemove', handleTerminalResize);
      document.removeEventListener('mouseup', handleResizeEnd);
    };
  }, [isResizingTerminal, handleTerminalResize, handleResizeEnd]);

  return (
    <ConversationProvider>
      <TerminalProvider>
        <div className={`app ${viewMode === 'terminal' ? 'full-terminal-mode' : ''}`}>
          <div className="titlebar-drag-region" />

          <Sidebar
            viewMode={viewMode}
            setViewMode={setViewMode}
          />

          {viewMode !== 'terminal' && (
            <MainContent
              viewMode={viewMode}
              setViewMode={setViewMode}
              rightPanelOpen={rightPanelOpen}
              setRightPanelOpen={setRightPanelOpen}
            />
          )}

          {viewMode !== 'terminal' && rightPanelOpen && (
            <RightPanel onClose={() => setRightPanelOpen(false)} />
          )}

          {viewMode === 'terminal' && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <TerminalPanel fullScreen />
            </div>
          )}

          {viewMode === 'split' && (
            <div
              style={{
                position: 'fixed',
                bottom: terminalHeight,
                left: 280,
                right: rightPanelOpen ? 320 : 0,
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              <div
                className="resize-handle vertical"
                style={{ cursor: 'row-resize' }}
                onMouseDown={startTerminalResize}
              />
              <TerminalPanel height={terminalHeight} />
            </div>
          )}
        </div>
      </TerminalProvider>
    </ConversationProvider>
  );
}
