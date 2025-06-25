const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const fs = require("fs");
const path = require("path");

const dataPath = path.join(app.getPath("userData"), "data.json");
const configPath = path.join(app.getPath("userData"), "config.json");

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
    win.webContents.openDevTools();
  } else {
    win.loadFile(path.join(__dirname, "../front-end/dist/index.html"));
  }
}

function readSTLFilesFromFolder(folderPath) {
  if (!fs.existsSync(folderPath)) return [];
  const files = fs.readdirSync(folderPath);
  return files.filter(f => f.toLowerCase().endsWith(".stl"));
}

// ✅ IPC handlers
ipcMain.handle("move-file", async (_event, { name, from, to, folderPaths }) => {
  try {
    const fromPath = path.join(folderPaths[from], name);
    const toPath = path.join(folderPaths[to], name);

    if (!fs.existsSync(fromPath)) {
      throw new Error("Source file does not exist");
    }

    fs.renameSync(fromPath, toPath);
    return { success: true };
  } catch (err) {
    console.error("Failed to move file:", err);
    return { success: false, error: err.message };
  }
});

ipcMain.handle("scan-folders", async (_event, folderPaths) => {
  let metadata = {};
  try {
    metadata = JSON.parse(fs.readFileSync(dataPath, "utf-8"));
  } catch {
    metadata = { A: [], B: [], C: [] };
  }

  const result = { A: [], B: [], C: [] };

  for (const key of ["A", "B", "C"]) {
    const folder = folderPaths[key];
    const files = readSTLFilesFromFolder(folder);

    result[key] = files.map((filename) => {
      const existing = metadata[key].find((f) => f.name === filename);
      if (existing) return existing;

      return {
        id: `${key}-${filename}`,
        name: filename,
        owner: "",
        class: "",
        notes: "",
        priority: 1,
        dateReceived: new Date().toISOString(),
      };
    });
  }

  return result;
});

ipcMain.handle("pick-folder", async () => {
  const result = await dialog.showOpenDialog({ properties: ["openDirectory"] });
  return result.filePaths?.[0] || null;
});

ipcMain.handle("load-config", () => {
  try {
    return JSON.parse(fs.readFileSync(configPath, "utf-8"));
  } catch {
    return { A: "", B: "", C: "" };
  }
});

ipcMain.on("save-config", (_event, paths) => {
  fs.writeFileSync(configPath, JSON.stringify(paths, null, 2), "utf-8");
});

ipcMain.on("save-data", (_event, data) => {
  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2), "utf-8");
});

app.whenReady().then(createWindow);
