import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, ChevronUp, ChevronDown } from './Icons';

export default function SearchBar({ isOpen, onClose, terminalRef }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [matchCount, setMatchCount] = useState(null);
  const [currentMatch, setCurrentMatch] = useState(0);
  const inputRef = useRef(null);
  const searchAddonRef = useRef(null);

  // Load search addon when terminal ref is available
  useEffect(() => {
    if (!terminalRef?.term || searchAddonRef.current) return;

    const loadSearchAddon = async () => {
      try {
        const { SearchAddon } = await import('@xterm/addon-search');
        const addon = new SearchAddon();
        terminalRef.term.loadAddon(addon);
        searchAddonRef.current = addon;
      } catch (err) {
        console.error('Failed to load search addon:', err);
      }
    };

    loadSearchAddon();
  }, [terminalRef?.term]);

  // Focus input when opening
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isOpen]);

  // Handle escape key to close
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const findNext = useCallback(() => {
    if (!searchAddonRef.current || !searchTerm) return;
    const found = searchAddonRef.current.findNext(searchTerm, {
      caseSensitive: false,
      wholeWord: false,
      regex: false,
    });
    if (found) {
      setCurrentMatch(prev => prev + 1);
    }
  }, [searchTerm]);

  const findPrevious = useCallback(() => {
    if (!searchAddonRef.current || !searchTerm) return;
    const found = searchAddonRef.current.findPrevious(searchTerm, {
      caseSensitive: false,
      wholeWord: false,
      regex: false,
    });
    if (found) {
      setCurrentMatch(prev => Math.max(0, prev - 1));
    }
  }, [searchTerm]);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    setCurrentMatch(0);

    if (searchAddonRef.current && value) {
      searchAddonRef.current.findNext(value, {
        caseSensitive: false,
        wholeWord: false,
        regex: false,
      });
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (e.shiftKey) {
        findPrevious();
      } else {
        findNext();
      }
    }
  };

  const handleClose = () => {
    // Clear search highlighting when closing
    if (searchAddonRef.current) {
      searchAddonRef.current.clearDecorations?.();
    }
    setSearchTerm('');
    setMatchCount(null);
    setCurrentMatch(0);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        right: 16,
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        padding: '6px 10px',
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-primary)',
        borderTop: 'none',
        borderRadius: '0 0 var(--radius-md) var(--radius-md)',
        boxShadow: 'var(--shadow-md)',
      }}
    >
      <input
        ref={inputRef}
        type="text"
        value={searchTerm}
        onChange={handleSearchChange}
        onKeyDown={handleKeyDown}
        placeholder="Search..."
        style={{
          width: 200,
          padding: '4px 8px',
          background: 'var(--bg-primary)',
          border: '1px solid var(--border-primary)',
          borderRadius: 'var(--radius-sm)',
          color: 'var(--text-primary)',
          fontSize: 12,
          outline: 'none',
          fontFamily: 'inherit',
        }}
      />

      <button
        onClick={findPrevious}
        disabled={!searchTerm}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 24,
          height: 24,
          background: 'transparent',
          border: 'none',
          borderRadius: 'var(--radius-sm)',
          color: searchTerm ? 'var(--text-secondary)' : 'var(--text-muted)',
          cursor: searchTerm ? 'pointer' : 'default',
          opacity: searchTerm ? 1 : 0.5,
        }}
        title="Previous match (Shift+Enter)"
      >
        <ChevronUp style={{ width: 14, height: 14 }} />
      </button>

      <button
        onClick={findNext}
        disabled={!searchTerm}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 24,
          height: 24,
          background: 'transparent',
          border: 'none',
          borderRadius: 'var(--radius-sm)',
          color: searchTerm ? 'var(--text-secondary)' : 'var(--text-muted)',
          cursor: searchTerm ? 'pointer' : 'default',
          opacity: searchTerm ? 1 : 0.5,
        }}
        title="Next match (Enter)"
      >
        <ChevronDown style={{ width: 14, height: 14 }} />
      </button>

      <button
        onClick={handleClose}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 24,
          height: 24,
          background: 'transparent',
          border: 'none',
          borderRadius: 'var(--radius-sm)',
          color: 'var(--text-secondary)',
          cursor: 'pointer',
          marginLeft: 4,
        }}
        title="Close (Escape)"
      >
        <X style={{ width: 14, height: 14 }} />
      </button>
    </div>
  );
}
