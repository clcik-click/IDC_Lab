const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const fs = require("fs");
const path = require("path");

const dataPath = path.join(app.getPath("userData"), "data.json");
const configPath = path.join(app.getPath("userData"), "config.json");

function createWindow() {
  const isDev = !app.isPackaged;

  const win = new BrowserWindow({
    width: 1000,
    height: 700,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      webSecurity: !isDev,
      enableRemoteModule: false,
      preload: path.join(__dirname, "preload.js"),
    },
  });

  // if (isDev) {
  //   win.loadURL("http://localhost:5173");
  //   win.webContents.openDevTools();
  // } else {
  //   win.loadFile(path.join(__dirname, "../front-end/dist/index.html"));
  // }
    if (true || isDev) { // 👈 Force this to true
    win.loadFile(path.join(__dirname, "../front-end/dist/index.html"));
  } else {
    win.loadURL("http://localhost:5173");
  }

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

// Helper to read existing metadata from data.json
function loadMetadata() {
  try {
    const raw = fs.readFileSync(dataPath, "utf-8");
    const parsed = JSON.parse(raw);
    console.log("✅ Loaded saved metadata:", parsed);
    return parsed;
  } catch (err) {
    console.error("❌ Failed to load metadata:", err);
    return { A: [], B: [], C: [] };
  }
}

// Load saved metadata only
ipcMain.handle("load-data", () => {
  return loadMetadata();
});

// Scan folders and merge with existing metadata
ipcMain.handle("scan-folders", async (_event, folderPaths) => {
  const metadata = loadMetadata();
  const result = { A: [], B: [], C: [] };

  for (const key of ["A", "B", "C"]) {
    const folder = folderPaths[key];
    const files = readSTLFilesFromFolder(folder);

    result[key] = files.map((filename) => {
      const existing = metadata[key]?.find((f) => f.name === filename);
      return (
        existing ?? {
          id: `${key}-${filename}`,
          name: filename,
          owner: "",
          class: "",
          notes: "",
          priority: 1,
          dateReceived: new Date().toISOString(),
        }
      );
    });
  }

  return result;
});

// Folder picker dialog
ipcMain.handle("pick-folder", async () => {
  const result = await dialog.showOpenDialog({ properties: ["openDirectory"] });
  console.log("Picked folder:", result.filePaths);
  return result.filePaths?.[0] || null;
});

// Load folder path config
ipcMain.handle("load-config", () => {
  try {
    const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
    return config;
  } catch {
    return { A: "", B: "", C: "" };
  }
});

// Save folder path config
ipcMain.on("save-config", (_event, paths) => {
  fs.writeFileSync(configPath, JSON.stringify(paths, null, 2), "utf-8");
});

// Save updated metadata
ipcMain.on("save-data", (_event, data) => {
  const isEmpty = Object.values(data).every(arr => Array.isArray(arr) && arr.length === 0);
  if (isEmpty) {
    console.warn("⚠️ Attempted to save empty metadata. Skipping save.");
    return;
  }

  console.log("💾 Saving metadata:", data);
  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2), "utf-8");
});

ipcMain.handle("import-file", async (_event, { from, name, toFolder, folderPaths }) => {
  try {
    if (!folderPaths || !folderPaths[toFolder]) {
      throw new Error(`Missing folder path for target folder "${toFolder}"`);
    }

    const destDir = folderPaths[toFolder];
    const destPath = path.join(destDir, name);
    console.log("Trying to copy from:", from);
    console.log("To destination:", destPath);

    if (!fs.existsSync(from)) throw new Error("Source file does not exist");

    fs.copyFileSync(from, destPath);
    return { success: true };
  } catch (err) {
    console.error("❌ Failed to import file:", err);
    return { success: false, error: err.message };
  }
});

function readSTLFilesFromFolder(folderPath) {
  if (!fs.existsSync(folderPath)) return [];
  const files = fs.readdirSync(folderPath);
  return files.filter(f => f.toLowerCase().endsWith(".stl"));
}



app.whenReady().then(createWindow);
