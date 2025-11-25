# Better Claude Code

A modern, feature-rich desktop interface for Claude Code that improves on the terminal experience.

## Features

### Conversation View
- **Collapsible Blocks**: Expand/collapse code blocks, analysis sections, and diffs to manage visual clutter
- **Tool Call Visualization**: See tool calls with their inputs/outputs in a clean, expandable format
- **Message Threading**: Clear visual distinction between user and assistant messages

### Right Panel - Open Threads
- **Unresolved Questions**: Track questions Claude has asked that you haven't addressed
- **Pending Items**: See tasks that are waiting on external actions
- **Errors**: Quick access to any errors that occurred
- **Mark as Resolved**: Dismiss items once handled

### Integrated Terminal
- **Multiple Tabs**: Create multiple terminal sessions
- **Claude Sessions**: Start dedicated Claude Code sessions with one click
- **Full Terminal Mode**: Switch to full-screen terminal when you need it

### View Modes
- **Chat**: Full conversation view
- **Split**: Conversation + terminal panel below
- **Terminal**: Full terminal mode (revert to classic experience)

### Session Management
- Switch between different coding sessions
- View message counts and timestamps
- Start new sessions with one click

## Installation

```bash
# Install dependencies
npm install

# Rebuild native modules for Electron
npm run rebuild

# Start the app in development mode
npm start
```

## Development

```bash
# Run in development mode with hot reload
npm run dev

# Build for production
npm run build
```

## Architecture

- **Electron** - Desktop application framework
- **React** - UI framework
- **xterm.js** - Terminal emulator
- **node-pty** - Native terminal backend
- **Vite** - Build tooling

## Project Structure

```
src/
├── main/
│   ├── main.js      # Electron main process
│   └── preload.js   # Preload script for IPC
└── renderer/
    ├── components/  # React components
    ├── context/     # React context providers
    ├── styles/      # CSS styles
    ├── App.jsx      # Main app component
    └── main.jsx     # Entry point
```

## Design Decisions

1. **Collapsible Everything**: Long outputs, code blocks, and tool results can all be collapsed to reduce noise
2. **Persistent Threads Panel**: Never lose track of questions or pending items
3. **Native Terminal**: Real terminal emulation, not just styled output
4. **Multiple Sessions**: Keep context separated between different coding tasks
5. **Quick Mode Switching**: Easily switch between rich UI and pure terminal mode
