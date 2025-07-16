// preload.js
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  loadConfig:       () => ipcRenderer.invoke("load-config"),
  setFolderPaths:   (folderPaths) => ipcRenderer.invoke("set-folder-paths", folderPaths),
  scanFolders:      () => ipcRenderer.invoke("scan-folders"),
  saveData:         (folders) => ipcRenderer.send("save-data", folders),

  pickFolder:       () => ipcRenderer.invoke("pick-folder"),
  saveConfig:       (updatedFolderPaths) => ipcRenderer.send("save-config", updatedFolderPaths),
  
  moveFile:         ({ name, from, to }) => ipcRenderer.invoke("move-file", { name, from, to }),
  deleteFile:       ({ name, from }) => ipcRenderer.invoke("delete-file", { name, from }),

  importFileBuffer: ({ name, buffer, to }) => ipcRenderer.invoke("import-file-buffer", { name, buffer, to }),

  getStatsFromDB:   () => ipcRenderer.invoke("get-stats-db"),
  
});
  