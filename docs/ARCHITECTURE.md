# Architecture & Alternative Paths

This document outlines the architectural vision and alternative implementation paths for Better Claude Code.

## Current Direction: Better Terminal App

The primary goal is to create a **better terminal application** that happens to work exceptionally well with Claude Code and other CLI tools.

### Core Philosophy
- A terminal is a terminal - Ctrl-C should always work
- Multiple tabs/sessions with proper isolation
- Enhanced viewing modes as overlays, not replacements
- Works with any CLI tool, not just Claude Code

### Key Features
1. **Multiple terminal tabs** - Each tab is a full PTY session
2. **Collapsible output ranges** - Fold verbose logs, build output, etc.
3. **Enhanced viewing mode** - Optional pretty rendering for structured output
4. **Standard terminal behavior** - All keyboard shortcuts work as expected

---

## Alternative Path: Native Claude Code Client

Preserved on branch: `feature/claude-code-ui`

This approach builds a dedicated UI specifically for Claude Code interactions.

### Concept
Instead of wrapping a terminal, directly interface with Claude Code as a native client:

1. **Direct API Integration**
   - Use Claude API directly instead of spawning `claude` CLI
   - Parse and render tool calls natively
   - Full control over message formatting

2. **Rich Conversation UI**
   - Collapsible message blocks
   - Tool call visualization with inputs/outputs
   - Syntax-highlighted code blocks
   - Diff viewers for file changes

3. **Thread Management**
   - Track unresolved questions
   - Pending items panel
   - Error aggregation

4. **Session State**
   - Persist conversations
   - Resume sessions
   - Branch conversations

### Implementation Options

#### Option A: Claude API Direct
```
App → Claude API → Tool Execution (local)
```
- Pros: Full control, native UI, no terminal needed
- Cons: Must implement all tool execution, session management

#### Option B: Claude Code as Library
```
App → Claude Code SDK → Claude API
```
- Pros: Leverage existing tool implementations
- Cons: Depends on SDK availability/stability

#### Option C: Claude Code IPC
```
App → Claude Code CLI (via IPC) → Claude API
```
- Pros: Use existing CLI, add UI layer
- Cons: Complex parsing, fragile integration

### UI Components (from feature branch)
- `ConversationView` - Renders parsed messages
- `ThreadsPanel` - Shows pending questions/items
- `MessageBlock` - Collapsible message container
- `ToolCallBlock` - Tool execution visualization

---

## Hybrid Approach (Recommended)

Combine both approaches:

1. **Base: Excellent Terminal**
   - Full PTY support, proper Ctrl-C, multiple tabs
   - Works standalone as a better terminal

2. **Enhancement Layer: Smart Rendering**
   - Detect Claude Code output patterns
   - Offer "enhanced view" toggle
   - Collapsible sections for any verbose output

3. **Future: Native Mode**
   - Optional direct API integration
   - Richer UI when using native mode
   - Fall back to terminal for compatibility

### Detection Heuristics
- Claude Code prompt patterns (`claude>`, tool markers)
- ANSI escape sequences for formatting
- JSON-like structured output
- Error/warning patterns

### Rendering Modes
1. **Raw** - Pure terminal output
2. **Enhanced** - Collapsible sections, syntax highlighting
3. **Native** - Full rich UI (future, when using API directly)

---

## Technical Considerations

### Terminal Handling
- `node-pty` for PTY spawning
- `xterm.js` for rendering
- Proper signal forwarding (SIGINT, SIGTERM, etc.)

### Performance
- Virtual scrolling for long outputs
- Lazy rendering of collapsed sections
- Background terminal buffers

### Cross-Platform
- macOS: Primary target
- Linux: Should work with minimal changes
- Windows: ConPTY support needed

---

## Branch Reference

- `main` - Better terminal app (current focus)
- `feature/claude-code-ui` - Native client experiment with conversation UI
