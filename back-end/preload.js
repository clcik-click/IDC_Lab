// preload.js
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  loadData:     () => ipcRenderer.invoke("load-data"),
  saveData:     (param) => ipcRenderer.send("save-data", param),
  pickFolder:   () => ipcRenderer.invoke("pick-folder"),
  saveConfig:   (param) => ipcRenderer.send("save-config", param),
  loadConfig:   () => ipcRenderer.invoke("load-config"),
  scanFolders:  (param) => ipcRenderer.invoke("scan-folders", param),
  moveFile:     (params) => ipcRenderer.invoke("move-file", params),
  importFile:   (params) => ipcRenderer.invoke("import-file", params),
  importFileBuffer: (params) => ipcRenderer.invoke("import-file-buffer", params),
  
});
 