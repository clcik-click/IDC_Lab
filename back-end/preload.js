// preload.js
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  // ... other APIs
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

  // Notes API
  getNotesFromDB:   () => ipcRenderer.invoke("get-notes-from-db"),
  saveNoteToDB:     (note) => ipcRenderer.invoke("save-note-to-db", note),
  deleteNoteFromDB: (id) => ipcRenderer.invoke("delete-note-from-db", id),
  updateNoteInDB:   (note) => ipcRenderer.invoke("update-note-in-db", note),
  
});
  

