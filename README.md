# Better Terminal

A modern terminal app optimized for Claude Code. Launch Claude sessions from anywhere with proper Ctrl+C support, multiple tabs, and convenient keyboard shortcuts.

## Quick Start

```bash
# Install dependencies
npm install

# Rebuild native modules for Electron
npm run rebuild

# Start the app
npm start
```

## Command Line Usage

Launch the app from any terminal with your current session:

```bash
# Open in current directory (default: starts Claude)
better-terminal .

# Open in specific directory
better-terminal /path/to/project

# Open with YOLO mode (skips permission prompts)
better-terminal . --yolo
better-terminal . -y

# Explicitly start Claude (default behavior)
better-terminal --claude
better-terminal -c
```

### Development Mode

Before the app is packaged/installed, you can launch from the project directory:

```bash
# From the BetterClaudeCodeOpus directory:
npm start -- .                          # Open in current directory
npm start -- /path/to/project           # Open in specific directory
npm start -- . --yolo                   # YOLO mode
npm start -- /path/to/project -y        # Combine options
```

### Shell Aliases (Recommended)

Add to your `~/.zshrc` or `~/.bashrc`:

```bash
# Quick launch in current directory
alias bt='open -a "Better Claude Code" --args "$(pwd)"'

# YOLO mode (skips all permission prompts)
alias bty='open -a "Better Claude Code" --args "$(pwd)" --yolo'
```

Then just type `bt` or `bty` from any directory!

## Features

### Terminal
- **Real Terminal**: Full xterm.js terminal with proper Ctrl+C, colors, and shell integration
- **Login Shell**: Inherits your PATH, aliases, and shell configuration
- **Multiple Tabs**: Create as many terminal sessions as you need
- **Tab Persistence**: Each tab maintains its own session state

### Claude Integration
- **Auto-Start Claude**: Opens Claude Code automatically when you launch
- **Permission Modes**:
  - **Default**: Normal mode with permission confirmations
  - **YOLO**: Skip all permission prompts (`--dangerously-skip-permissions`)
  - **Plan**: (Coming soon) Plan mode for careful execution
- **Mode Indicator**: See the current mode in the top bar

### Interface
- **Collapsible Sidebar**: Toggle with `Cmd+B` for more terminal space
- **Working Directory**: Click to change the working directory
- **Pretty View**: Toggle between terminal and clean text view (strips ANSI codes)
- **Process Tracker**: See running processes and ports

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd+T` | New terminal tab |
| `Cmd+N` | New window |
| `Cmd+B` | Toggle sidebar |
| `Cmd+W` | Close tab/window |

## Development

```bash
# Run in development mode (hot reload)
npm start

# Build for production
npm run build

# Package the app
npm run package
```

### Project Structure

```
src/
├── main/
│   ├── main.js      # Electron main process, PTY spawning, IPC
│   └── preload.js   # Secure bridge between main and renderer
└── renderer/
    ├── components/  # React components (TerminalInstance, PrettyView, etc.)
    ├── context/     # React context (TerminalContext for state management)
    ├── styles/      # CSS styles
    ├── App.jsx      # Main app component
    └── main.jsx     # Entry point
```

### Architecture

- **Electron** - Desktop application framework
- **React** - UI framework
- **xterm.js** - Terminal emulator
- **node-pty** - Native terminal backend (spawns real shells)
- **Vite** - Build tooling

### Why a Terminal Wrapper?

Instead of trying to parse and render Claude's output (which uses complex ANSI formatting), this app:

1. Spawns a real login shell (`zsh --login`)
2. Auto-types the `claude` command
3. Lets xterm.js handle all the terminal rendering

This means:
- Full compatibility with Claude Code's terminal UI
- Proper Ctrl+C handling
- All your shell configuration works
- No parsing bugs or missing features

## Tips

### For Voice/Dictation Users
The terminal has been optimized for dictation workflows - click anywhere on the terminal to focus it.

### Permission Modes
- Start with **Default** mode until you're comfortable
- Use **YOLO** mode for trusted projects where you want faster iteration
- The mode is shown in the top bar so you always know what mode you're in

### Multiple Projects
Open different windows for different projects - each window tracks its own working directory and permission settings.

## Contributing

PRs welcome! This is an open-source project to make Claude Code more accessible.

## License

MIT
