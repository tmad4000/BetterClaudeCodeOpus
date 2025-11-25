const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Terminal operations
  createTerminal: (options) => ipcRenderer.invoke('terminal:create', options),
  sendTerminalInput: (id, data) => ipcRenderer.send('terminal:input', { id, data }),
  resizeTerminal: (id, cols, rows) => ipcRenderer.send('terminal:resize', { id, cols, rows }),
  killTerminal: (id) => ipcRenderer.send('terminal:kill', id),
  onTerminalData: (id, callback) => {
    const channel = `terminal:data:${id}`;
    const subscription = (event, data) => callback(data);
    ipcRenderer.on(channel, subscription);
    return () => ipcRenderer.removeListener(channel, subscription);
  },
  onTerminalExit: (id, callback) => {
    const channel = `terminal:exit:${id}`;
    const subscription = (event, exitCode) => callback(exitCode);
    ipcRenderer.on(channel, subscription);
    return () => ipcRenderer.removeListener(channel, subscription);
  },

  // Claude session operations
  createClaudeSession: (options) => ipcRenderer.invoke('claude:create-session', options),
  sendClaudeMessage: (id, message) => ipcRenderer.send('claude:send-message', { id, message }),
  resizeClaudeSession: (id, cols, rows) => ipcRenderer.send('claude:resize', { id, cols, rows }),
  killClaudeSession: (id) => ipcRenderer.send('claude:kill', id),
  interruptClaude: (id) => ipcRenderer.send('claude:interrupt', id),
  onClaudeOutput: (id, callback) => {
    const channel = `claude:raw-output:${id}`;
    const subscription = (event, data) => callback(data);
    ipcRenderer.on(channel, subscription);
    return () => ipcRenderer.removeListener(channel, subscription);
  },
  onClaudeExit: (id, callback) => {
    const channel = `claude:exit:${id}`;
    const subscription = (event, exitCode) => callback(exitCode);
    ipcRenderer.on(channel, subscription);
    return () => ipcRenderer.removeListener(channel, subscription);
  },

  // Dialog
  selectDirectory: () => ipcRenderer.invoke('dialog:select-directory'),

  // Sessions persistence
  loadSessions: () => ipcRenderer.invoke('sessions:load'),
  saveSessions: (sessions) => ipcRenderer.invoke('sessions:save', sessions),

  // App info
  getAppInfo: () => ipcRenderer.invoke('app:get-info'),

  // History logging
  logPrompt: (data) => ipcRenderer.send('history:log-prompt', data),
  logSessionOutput: (sessionId, data) => ipcRenderer.send('history:log-session-output', { sessionId, data, timestamp: Date.now() }),
  getPromptHistory: (options) => ipcRenderer.invoke('history:get-prompts', options),
  getSessionHistory: (sessionId) => ipcRenderer.invoke('history:get-session', sessionId),
  getHistoryPath: () => ipcRenderer.invoke('history:get-path'),

  // Process and port tracking
  registerProcess: (data) => ipcRenderer.send('process:register', data),
  unregisterProcess: (data) => ipcRenderer.send('process:unregister', data),
  getTrackedProcesses: () => ipcRenderer.invoke('process:get-tracked'),
  scanPorts: () => ipcRenderer.invoke('process:scan-ports'),
  killProcess: (pid) => ipcRenderer.invoke('process:kill', pid),
  getClaudeSessions: () => ipcRenderer.invoke('process:get-claude-sessions'),
  getSubagents: () => ipcRenderer.invoke('process:get-subagents'),
  onProcessUpdated: (callback) => {
    const subscription = () => callback();
    ipcRenderer.on('process:updated', subscription);
    return () => ipcRenderer.removeListener('process:updated', subscription);
  },
});
