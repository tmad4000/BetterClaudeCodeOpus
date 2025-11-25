const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const pty = require('node-pty');

const isDev = process.env.NODE_ENV === 'development';

let mainWindow;
const terminals = new Map();
const claudeSessions = new Map();
let terminalIdCounter = 0;
let claudeSessionIdCounter = 0;

// Sessions storage path
const getSessionsPath = () => {
  const userDataPath = app.getPath('userData');
  return path.join(userDataPath, 'sessions.json');
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
    mainWindow.loadURL('http://localhost:5173');
    // Don't auto-open DevTools - use Cmd+Option+I to open manually
  } else {
    mainWindow.loadFile(path.join(__dirname, '../../dist/index.html'));
  }
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  terminals.forEach((term) => term.pty.kill());
  terminals.clear();
  claudeSessions.forEach((session) => session.pty.kill());
  claudeSessions.clear();

  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// ============ Terminal IPC handlers ============
ipcMain.handle('terminal:create', (event, options = {}) => {
  const id = ++terminalIdCounter;
  const shell = process.env.SHELL || '/bin/zsh';

  const term = pty.spawn(shell, [], {
    name: 'xterm-256color',
    cols: options.cols || 80,
    rows: options.rows || 24,
    cwd: options.cwd || process.env.HOME,
    env: { ...process.env, TERM: 'xterm-256color' }
  });

  terminals.set(id, { pty: term, type: 'shell' });

  term.onData((data) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send(`terminal:data:${id}`, data);
    }
  });

  term.onExit(({ exitCode }) => {
    terminals.delete(id);
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send(`terminal:exit:${id}`, exitCode);
    }
  });

  return { id, pid: term.pid };
});

ipcMain.on('terminal:input', (event, { id, data }) => {
  const term = terminals.get(id);
  if (term) {
    term.pty.write(data);
  }
});

ipcMain.on('terminal:resize', (event, { id, cols, rows }) => {
  const term = terminals.get(id);
  if (term) {
    term.pty.resize(cols, rows);
  }
});

ipcMain.on('terminal:kill', (event, id) => {
  const term = terminals.get(id);
  if (term) {
    term.pty.kill();
    terminals.delete(id);
  }
});

// ============ Claude Session IPC handlers ============

ipcMain.handle('claude:create-session', (event, options = {}) => {
  const id = ++claudeSessionIdCounter;
  const cwd = options.cwd || process.env.HOME;
  const permissionMode = options.permissionMode || 'default';

  // Build args based on permission mode
  const args = [];
  if (permissionMode === 'yolo') {
    args.push('--dangerously-skip-permissions');
  }

  // Spawn claude
  const term = pty.spawn('claude', args, {
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

  const session = {
    id,
    pty: term,
    cwd,
    buffer: '',
    messages: [],
    createdAt: Date.now()
  };

  claudeSessions.set(id, session);

  // Stream raw terminal data for the embedded terminal view
  term.onData((data) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      // Send raw data for terminal rendering
      mainWindow.webContents.send(`claude:raw-output:${id}`, data);

      // Also accumulate for parsing
      session.buffer += data;
    }
  });

  term.onExit(({ exitCode }) => {
    claudeSessions.delete(id);
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send(`claude:exit:${id}`, exitCode);
    }
  });

  return { id, pid: term.pid, cwd };
});

ipcMain.on('claude:send-message', (event, { id, message }) => {
  const session = claudeSessions.get(id);
  if (session) {
    // Write raw input to the pty (terminal handles its own line editing)
    session.pty.write(message);
  }
});

ipcMain.on('claude:resize', (event, { id, cols, rows }) => {
  const session = claudeSessions.get(id);
  if (session) {
    session.pty.resize(cols, rows);
  }
});

ipcMain.on('claude:kill', (event, id) => {
  const session = claudeSessions.get(id);
  if (session) {
    session.pty.kill();
    claudeSessions.delete(id);
  }
});

// Send interrupt (Ctrl+C)
ipcMain.on('claude:interrupt', (event, id) => {
  const session = claudeSessions.get(id);
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

ipcMain.handle('sessions:save', async (event, sessions) => {
  try {
    const sessionsPath = getSessionsPath();
    fs.writeFileSync(sessionsPath, JSON.stringify(sessions, null, 2));
    return true;
  } catch (error) {
    console.error('Failed to save sessions:', error);
    return false;
  }
});

// Get app info
ipcMain.handle('app:get-info', () => {
  return {
    homePath: process.env.HOME,
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
