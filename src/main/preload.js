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

  // Claude Code specific
  startClaude: (options) => ipcRenderer.invoke('claude:start', options),
});
