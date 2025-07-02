// preload.js
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  loadData:     () => ipcRenderer.invoke("load-data"),
  saveData:     (data) => ipcRenderer.send("save-data", data),
  pickFolder:   () => ipcRenderer.invoke("pick-folder"),
  saveConfig:   (paths) => ipcRenderer.send("save-config", paths),
  loadConfig:   () => ipcRenderer.invoke("load-config"),
  scanFolders:  (folderPaths) => ipcRenderer.invoke("scan-folders", folderPaths),
  moveFile:     (payload) => ipcRenderer.invoke("move-file", payload),
  importFile:   (params) => ipcRenderer.invoke("import-file", params),

  importFileBuffer: (params) => ipcRenderer.invoke("import-file-buffer", params),
  
});
