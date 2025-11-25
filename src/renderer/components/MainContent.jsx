import React, { useState, useRef, useEffect } from 'react';
import { useConversation } from '../context/ConversationContext';
import CollapsibleBlock from './CollapsibleBlock';
import ToolCallBlock from './ToolCallBlock';
import { Send, PanelRight, Loader } from './Icons';

function formatTime(date) {
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function Message({ message, onToggleBlock, onToggleToolCall }) {
  const isUser = message.role === 'user';

  return (
    <div className="message">
      <div className="message-header">
        <div className={`message-avatar ${isUser ? 'user' : 'assistant'}`}>
          {isUser ? 'Y' : 'C'}
        </div>
        <span className="message-author">{isUser ? 'You' : 'Claude'}</span>
        <span className="message-time">{formatTime(message.timestamp)}</span>
      </div>
      <div className="message-content">
        <p>{message.content}</p>

        {message.toolCalls?.map((toolCall) => (
          <ToolCallBlock
            key={toolCall.id}
            toolCall={toolCall}
            onToggle={() => onToggleToolCall(message.id, toolCall.id)}
          />
        ))}

        {message.blocks?.map((block) => (
          <CollapsibleBlock
            key={block.id}
            block={block}
            onToggle={() => onToggleBlock(message.id, block.id)}
          />
        ))}
      </div>
    </div>
  );
}

export default function MainContent({ viewMode, rightPanelOpen, setRightPanelOpen }) {
  const {
    messages,
    isLoading,
    toggleBlockCollapse,
    toggleToolCallCollapse,
    sendMessage,
  } = useConversation();

  const [inputValue, setInputValue] = useState('');
  const textareaRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    sendMessage(inputValue.trim());
    setInputValue('');

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleTextareaChange = (e) => {
    setInputValue(e.target.value);
    // Auto-resize
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 200) + 'px';
  };

  return (
    <div className="main-content">
      <div className="top-bar">
        <div className="top-bar-tabs">
          <span style={{ fontSize: 14, fontWeight: 500 }}>Auth Module Refactor</span>
        </div>
        <div className="top-bar-actions">
          <button
            className="icon-button"
            onClick={() => setRightPanelOpen(!rightPanelOpen)}
            title={rightPanelOpen ? 'Hide panel' : 'Show panel'}
          >
            <PanelRight style={{ width: 16, height: 16 }} />
          </button>
        </div>
      </div>

      <div
        className="conversation-container"
        style={{
          marginBottom: viewMode === 'split' ? 250 : 0,
        }}
      >
        <div className="conversation-messages">
          {messages.map((message) => (
            <Message
              key={message.id}
              message={message}
              onToggleBlock={toggleBlockCollapse}
              onToggleToolCall={toggleToolCallCollapse}
            />
          ))}

          {isLoading && (
            <div className="message">
              <div className="message-header">
                <div className="message-avatar assistant">C</div>
                <span className="message-author">Claude</span>
                <Loader
                  className="animate-spin"
                  style={{ width: 16, height: 16, color: 'var(--text-muted)' }}
                />
              </div>
              <div className="message-content">
                <p style={{ color: 'var(--text-muted)' }}>Thinking...</p>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="input-area">
        <form onSubmit={handleSubmit} className="input-container">
          <div className="input-wrapper">
            <textarea
              ref={textareaRef}
              className="input-textarea"
              placeholder="Send a message to Claude..."
              value={inputValue}
              onChange={handleTextareaChange}
              onKeyDown={handleKeyDown}
              rows={1}
            />
            <button
              type="submit"
              className="send-button"
              disabled={!inputValue.trim() || isLoading}
            >
              <Send style={{ width: 18, height: 18 }} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
