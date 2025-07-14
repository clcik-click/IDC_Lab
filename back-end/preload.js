// preload.js
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  loadConfig:       () => ipcRenderer.invoke("load-config"),
  setFolderPaths:   (folderPaths) => ipcRenderer.invoke("set-folder-paths", folderPaths),
  scanFolders:      () => ipcRenderer.invoke("scan-folders"),
  saveData:         (folders) => ipcRenderer.send("save-data", folders),

  pickFolder:       () => ipcRenderer.invoke("pick-folder"),
  saveConfig:       (param) => ipcRenderer.send("save-config", param),
  
  
  moveFile:         (params) => ipcRenderer.invoke("move-file", params),
  importFileBuffer: (params) => ipcRenderer.invoke("import-file-buffer", params),
  deleteFile:       (params) => ipcRenderer.invoke("delete-file", params),

  getStatsFromDB:   () => ipcRenderer.invoke("get-stats-db"),
  
});
  