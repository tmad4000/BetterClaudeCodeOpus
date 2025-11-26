const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Session operations (Unified)
  createSession: (options) => ipcRenderer.invoke('session:create', options),
  sendSessionInput: (id, data) => ipcRenderer.send('session:input', { id, data }),
  resizeSession: (id, cols, rows) => ipcRenderer.send('session:resize', { id, cols, rows }),
  killSession: (id) => ipcRenderer.send('session:kill', id),
  interruptSession: (id) => ipcRenderer.send('session:interrupt', id),

  onSessionData: (id, callback) => {
    const channel = `session:data:${id}`;
    const subscription = (event, data) => callback(data);
    ipcRenderer.on(channel, subscription);
    return () => ipcRenderer.removeListener(channel, subscription);
  },

  onSessionExit: (id, callback) => {
    const channel = `session:exit:${id}`;
    const subscription = (event, exitCode) => callback(exitCode);
    ipcRenderer.on(channel, subscription);
    return () => ipcRenderer.removeListener(channel, subscription);
  },

  // Aliases for PrettyView compatibility
  onClaudeOutput: (id, callback) => {
    const channel = `session:data:${id}`;
    const subscription = (event, data) => callback(data);
    ipcRenderer.on(channel, subscription);
    return () => ipcRenderer.removeListener(channel, subscription);
  },
  sendClaudeMessage: (id, data) => ipcRenderer.send('session:input', { id, data }),

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

  // Tab management
  onCloseCurrentTab: (callback) => {
    const subscription = () => callback();
    ipcRenderer.on('close-current-tab', subscription);
    return () => ipcRenderer.removeListener('close-current-tab', subscription);
  },
});
