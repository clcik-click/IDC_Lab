const { app, BrowserWindow, ipcMain } = require("electron");
const fs = require("fs");
const path = require("path");

const dataPath = path.join(app.getPath("userData"), "data.json");

function createWindow() {
  const win = new BrowserWindow({
    width: 1000,
    height: 700,
    webPreferences: {
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js"), // ✅ add this
    },
  });

  const isDev = !app.isPackaged;

  if (isDev) {
    win.loadURL("http://localhost:5173");
  } else {
    win.loadFile(path.join(__dirname, "../front-end/dist/index.html"));
  }
}

// ✅ IPC handlers
ipcMain.handle("load-data", async () => {
  try {
    const content = fs.readFileSync(dataPath, "utf-8");
    return JSON.parse(content);
  } catch {
    return { A: [], B: [], C: [] }; // fallback if no file
  }
});

ipcMain.on("save-data", (_event, data) => {
  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2), "utf-8");
});

app.whenReady().then(createWindow);
