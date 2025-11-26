const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const pty = require('node-pty');
const { exec } = require('child_process');

const isDev = process.env.NODE_ENV === 'development';

let mainWindow;
const sessions = new Map();
let sessionIdCounter = 0;

// Sessions storage path
const getSessionsPath = () => {
  const userDataPath = app.getPath('userData');
  return path.join(userDataPath, 'sessions.json');
};

// Get default working directory (~/code if exists, otherwise ~)
const determineDefaultCwd = () => {
  const codeDir = path.join(process.env.HOME, 'code');
  if (fs.existsSync(codeDir)) {
    return { path: codeDir, isFallback: false };
  }
  return { path: process.env.HOME, isFallback: true };
};

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    titleBarStyle: 'hiddenInset',
    backgroundColor: '#0d1117',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:31337');
    // Don't auto-open DevTools - use Cmd+Option+I to open manually
  } else {
    mainWindow.loadFile(path.join(__dirname, '../../dist/index.html'));
  }
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  sessions.forEach((session) => session.pty.kill());
  sessions.clear();

  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// ============ Unified Session IPC handlers ============

ipcMain.handle('session:create', (event, options = {}) => {
  const id = ++sessionIdCounter;
  const defaultCwd = determineDefaultCwd();
  const cwd = options.cwd || defaultCwd.path;
  const type = options.type || 'shell';
  const permissionMode = options.permissionMode || 'default';

  let term;
  let args = [];

  if (type === 'claude') {
    // Build args based on permission mode
    if (permissionMode === 'yolo') {
      args.push('--dangerously-skip-permissions');
    }
    
    term = pty.spawn('claude', args, {
      name: 'xterm-256color',
      cols: options.cols || 120,
      rows: options.rows || 40,
      cwd: cwd,
      env: {
        ...process.env,
        TERM: 'xterm-256color',
        FORCE_COLOR: '1'
      }
    });
  } else {
    // Standard shell - spawn as login shell to get proper PATH
    const shell = process.env.SHELL || '/bin/zsh';
    term = pty.spawn(shell, ['--login'], {
      name: 'xterm-256color',
      cols: options.cols || 80,
      rows: options.rows || 24,
      cwd: cwd,
      env: { ...process.env, TERM: 'xterm-256color' }
    });
  }

  const session = {
    id,
    pty: term,
    type,
    cwd,
    buffer: '',
    messages: [],
    createdAt: Date.now()
  };

  sessions.set(id, session);

  term.onData((data) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send(`session:data:${id}`, data);
      
      // Accumulate buffer for Claude sessions (for parsing/logging)
      if (type === 'claude') {
        session.buffer += data;
      }
    }
  });

  term.onExit(({ exitCode }) => {
    sessions.delete(id);
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send(`session:exit:${id}`, exitCode);
    }
  });

  return { id, pid: term.pid, cwd, type };
});

ipcMain.on('session:input', (event, { id, data }) => {
  const session = sessions.get(id);
  if (session) {
    session.pty.write(data);
  }
});

ipcMain.on('session:resize', (event, { id, cols, rows }) => {
  const session = sessions.get(id);
  if (session) {
    session.pty.resize(cols, rows);
  }
});

ipcMain.on('session:kill', (event, id) => {
  const session = sessions.get(id);
  if (session) {
    session.pty.kill();
    sessions.delete(id);
  }
});

// Send interrupt (Ctrl+C)
ipcMain.on('session:interrupt', (event, id) => {
  const session = sessions.get(id);
  if (session) {
    session.pty.write('\x03');
  }
});

// ============ Dialog handlers ============
ipcMain.handle('dialog:select-directory', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory'],
    title: 'Select Working Directory'
  });

  if (!result.canceled && result.filePaths.length > 0) {
    return result.filePaths[0];
  }
  return null;
});

// ============ Session persistence ============
ipcMain.handle('sessions:load', async () => {
  try {
    const sessionsPath = getSessionsPath();
    if (fs.existsSync(sessionsPath)) {
      const data = fs.readFileSync(sessionsPath, 'utf-8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Failed to load sessions:', error);
  }
  return [];
});

ipcMain.handle('sessions:save', async (event, sessionsData) => {
  try {
    const sessionsPath = getSessionsPath();
    fs.writeFileSync(sessionsPath, JSON.stringify(sessionsData, null, 2));
    return true;
  } catch (error) {
    console.error('Failed to save sessions:', error);
    return false;
  }
});

// Get app info
ipcMain.handle('app:get-info', () => {
  const defaultCwd = determineDefaultCwd();
  return {
    homePath: process.env.HOME,
    defaultCwd: defaultCwd.path,
    isDefaultCwdFallback: defaultCwd.isFallback,
    platform: process.platform,
    version: app.getVersion()
  };
});

// ============ History logging ============
const getHistoryDir = () => {
  const userDataPath = app.getPath('userData');
  const historyDir = path.join(userDataPath, 'history');
  if (!fs.existsSync(historyDir)) {
    fs.mkdirSync(historyDir, { recursive: true });
  }
  return historyDir;
};

const getPromptHistoryPath = () => {
  return path.join(getHistoryDir(), 'prompts.jsonl');
};

const getSessionHistoryPath = (sessionId) => {
  return path.join(getHistoryDir(), `session-${sessionId}.jsonl`);
};

// Log a prompt to the prompt history file (JSONL format for easy reading)
ipcMain.on('history:log-prompt', (event, data) => {
  try {
    const promptPath = getPromptHistoryPath();
    const entry = {
      ...data,
      timestamp: data.timestamp || Date.now(),
    };
    fs.appendFileSync(promptPath, JSON.stringify(entry) + '\n');
  } catch (error) {
    console.error('Failed to log prompt:', error);
  }
});

// Log session output (for full conversation history)
ipcMain.on('history:log-session-output', (event, { sessionId, data, timestamp }) => {
  try {
    const sessionPath = getSessionHistoryPath(sessionId);
    const entry = {
      type: 'output',
      data,
      timestamp: timestamp || Date.now(),
    };
    fs.appendFileSync(sessionPath, JSON.stringify(entry) + '\n');
  } catch (error) {
    console.error('Failed to log session output:', error);
  }
});

// Get prompt history
ipcMain.handle('history:get-prompts', async (event, options = {}) => {
  try {
    const promptPath = getPromptHistoryPath();
    if (!fs.existsSync(promptPath)) {
      return [];
    }
    const content = fs.readFileSync(promptPath, 'utf-8');
    const lines = content.trim().split('\n').filter(Boolean);
    const prompts = lines.map(line => JSON.parse(line));

    // Apply filters
    let filtered = prompts;
    if (options.limit) {
      filtered = filtered.slice(-options.limit);
    }
    if (options.search) {
      const searchLower = options.search.toLowerCase();
      filtered = filtered.filter(p =>
        p.prompt.toLowerCase().includes(searchLower)
      );
    }

    return filtered.reverse(); // Most recent first
  } catch (error) {
    console.error('Failed to get prompt history:', error);
    return [];
  }
});

// Get session history
ipcMain.handle('history:get-session', async (event, sessionId) => {
  try {
    const sessionPath = getSessionHistoryPath(sessionId);
    if (!fs.existsSync(sessionPath)) {
      return [];
    }
    const content = fs.readFileSync(sessionPath, 'utf-8');
    const lines = content.trim().split('\n').filter(Boolean);
    return lines.map(line => JSON.parse(line));
  } catch (error) {
    console.error('Failed to get session history:', error);
    return [];
  }
});

// Get history directory path (for user reference)
ipcMain.handle('history:get-path', () => {
  return getHistoryDir();
});

// ============ Process and Port Tracking ============

// Track spawned processes from Claude sessions
const spawnedProcesses = new Map();

// Register a spawned process
ipcMain.on('process:register', (event, { sessionId, pid, name, port, cwd }) => {
  const key = `${sessionId}-${pid}`;
  spawnedProcesses.set(key, {
    sessionId,
    pid,
    name,
    port,
    cwd,
    startedAt: Date.now(),
  });
  // Notify renderer of update
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('process:updated');
  }
});

// Unregister a spawned process
ipcMain.on('process:unregister', (event, { sessionId, pid }) => {
  const key = `${sessionId}-${pid}`;
  spawnedProcesses.delete(key);
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('process:updated');
  }
});

// Get all tracked processes
ipcMain.handle('process:get-tracked', () => {
  return Array.from(spawnedProcesses.values());
});

// Scan for listening ports (uses lsof on macOS/Linux)
ipcMain.handle('process:scan-ports', async () => {
  return new Promise((resolve) => {
    const cmd = process.platform === 'darwin' || process.platform === 'linux'
      ? 'lsof -i -P -n | grep LISTEN'
      : 'netstat -an | findstr LISTENING';

    exec(cmd, (error, stdout) => {
      if (error) {
        resolve([]);
        return;
      }

      const ports = [];
      const lines = stdout.trim().split('\n').filter(Boolean);

      for (const line of lines) {
        try {
          if (process.platform === 'darwin' || process.platform === 'linux') {
            // Parse lsof output: COMMAND PID USER FD TYPE DEVICE SIZE/OFF NODE NAME
            const parts = line.split(/\s+/);
            if (parts.length >= 9) {
              const command = parts[0];
              const pid = parseInt(parts[1], 10);
              const name = parts[8]; // e.g., *:3000 or 127.0.0.1:8080
              const portMatch = name.match(/:(\d+)$/);
              if (portMatch) {
                const port = parseInt(portMatch[1], 10);
                // Filter out common system ports
                if (port > 1024) {
                  ports.push({
                    port,
                    pid,
                    command,
                    address: name,
                  });
                }
              }
            }
          }
        } catch (e) {
          // Skip malformed lines
        }
      }

      // Dedupe by port
      const seen = new Set();
      const unique = ports.filter(p => {
        if (seen.has(p.port)) return false;
        seen.add(p.port);
        return true;
      });

      resolve(unique.sort((a, b) => a.port - b.port));
    });
  });
});

// Kill a process by PID
ipcMain.handle('process:kill', async (event, pid) => {
  return new Promise((resolve) => {
    const cmd = process.platform === 'win32' ? `taskkill /PID ${pid} /F` : `kill -9 ${pid}`;
    exec(cmd, (error) => {
      if (error) {
        resolve({ success: false, error: error.message });
      } else {
        // Remove from tracked if it was tracked
        for (const [key, proc] of spawnedProcesses.entries()) {
          if (proc.pid === pid) {
            spawnedProcesses.delete(key);
            break;
          }
        }
        resolve({ success: true });
      }
    });
  });
});

// Get running Claude sessions info
ipcMain.handle('process:get-claude-sessions', () => {
  const claudeSessions = [];
  for (const [id, session] of sessions.entries()) {
    if (session.type === 'claude') {
      claudeSessions.push({
        id,
        pid: session.pty.pid,
        cwd: session.cwd,
        createdAt: session.createdAt,
      });
    }
  }
  return claudeSessions;
});

// Get child processes (sub-agents) of Claude sessions
ipcMain.handle('process:get-subagents', async () => {
  return new Promise((resolve) => {
    // Get all PIDs of active Claude sessions
    const claudePids = Array.from(sessions.values())
      .filter(s => s.type === 'claude')
      .map(s => s.pty.pid);

    if (claudePids.length === 0) {
      resolve([]);
      return;
    }

    // Use ps to find all processes and their parents, then filter
    const cmd = process.platform === 'darwin' || process.platform === 'linux'
      ? 'ps -eo pid,ppid,command'
      : 'wmic process get processid,parentprocessid,commandline';

    exec(cmd, (error, stdout) => {
      if (error) {
        resolve([]);
        return;
      }

      const subagents = [];
      const lines = stdout.trim().split('\n').slice(1); // Skip header

      // Build a map of pid -> process info
      const processes = new Map();
      for (const line of lines) {
        const parts = line.trim().split(/\s+/);
        if (parts.length >= 3) {
          const pid = parseInt(parts[0], 10);
          const ppid = parseInt(parts[1], 10);
          const command = parts.slice(2).join(' ');
          if (!isNaN(pid) && !isNaN(ppid)) {
            processes.set(pid, { pid, ppid, command });
          }
        }
      }

      // Find all descendants of Claude sessions (recursive)
      const findDescendants = (parentPid, depth = 0) => {
        const children = [];
        for (const [pid, proc] of processes.entries()) {
          if (proc.ppid === parentPid) {
            // Check if it looks like a sub-agent or interesting process
            const isSubagent = proc.command.includes('claude') ||
                               proc.command.includes('node') ||
                               proc.command.includes('python') ||
                               proc.command.includes('npm') ||
                               proc.command.includes('npx');

            children.push({
              ...proc,
              parentClaudePid: parentPid,
              depth,
              isSubagent,
            });

            // Recursively find children of this process
            if (depth < 5) { // Limit depth to avoid infinite loops
              children.push(...findDescendants(pid, depth + 1));
            }
          }
        }
        return children;
      };

      // Find descendants for each Claude session
      for (const claudePid of claudePids) {
        const descendants = findDescendants(claudePid);
        subagents.push(...descendants);
      }

      resolve(subagents);
    });
  });
});
