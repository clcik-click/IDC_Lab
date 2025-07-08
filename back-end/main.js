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
      preload: path.join(__dirname, "preload.js"),
      sandbox: false,           // ✅ Needed to access file paths
      nodeIntegration: false,   // ✅ Recommended for security
      devTools: true,
    },
  });

  if (isDev) {
    console.log("🔧 Running in development mode");
    win.loadURL("http://localhost:5173");
    win.webContents.openDevTools();
  } else {
    console.log("🚀 Running in production mode");
    win.loadFile(path.join(__dirname, "../front-end/dist/index.html"));
  }
}

// ✅ IPC handlers
ipcMain.handle("move-file", async (_event, { name, from, to, folderPaths }) => {
  try {
    const fromPath = path.join(folderPaths[from], name);
    const baseName = path.parse(name).name;
    const ext = path.extname(name);
    const targetDir = folderPaths[to];

    let candidateName = name;
    let suffixIndex = 0;
    const romanSuffixes = ["_I", "_II", "_III", "_IV", "_V", "_VI", "_VII", "_VIII", "_IX", "_X"];

    // Find an available name
    while (fs.existsSync(path.join(targetDir, candidateName))) {
      suffixIndex += 1;
      candidateName = `${baseName}${romanSuffixes[suffixIndex - 1] || `_copy${suffixIndex}`}${ext}`;
    }

    const destPath = path.join(targetDir, candidateName);
    fs.renameSync(fromPath, destPath);

    return { success: true, newName: candidateName };
  } catch (err) {
    console.error("❌ Failed to move file:", err);
    return { success: false, error: err.message };
  }
});

// Helper to read existing metadata from data.json
function loadMetadata() {
  try {
    const raw = fs.readFileSync(dataPath, "utf-8");
    const parsed = JSON.parse(raw);
    // console.log("✅ Loaded saved metadata:", parsed);
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

function readSTLFilesFromFolder(folderPath) {
  if (!fs.existsSync(folderPath)) return [];
  const files = fs.readdirSync(folderPath);
  return files
    .filter((f) => f.toLowerCase().endsWith(".stl"))
    .map((filename) => ({
      name: filename,
      fullPath: path.join(folderPath, filename),
    }));
}

ipcMain.handle("scan-folders", async (_event, folderPaths) => {
  const metadata = loadMetadata(); // You still track extra info like notes, etc.
  const result = { A: [], B: [], C: [] };

  for (const key of ["A", "B", "C"]) {
    const folder = folderPaths[key];
    const files = readSTLFilesFromFolder(folder);
    // console.log(`📂 Scanned folder ${key}:`, files.map(f => f.name));

    result[key] = files.map(({ name, fullPath }) => {
      let stats = null;
      try {
        stats = fs.statSync(fullPath);
      } catch {
        console.warn("⚠️ Failed to stat file:", fullPath);
      }

      const existing = metadata[key]?.find((f) => f.name === name);
      return (
        existing ?? {
          id: `${key}-${name}`,
          name,
          owner: "",
          email: "",
          class: "",
          quantity: 1,
          notes: "",
          dateReceived: stats?.mtime?.toISOString() || "", // file modified time
          size: stats?.size || 0, // in bytes
          dateFinished: "", // initially empty
        }
      );
    });
  }

  return result;
});


// Folder picker dialog
ipcMain.handle("pick-folder", async () => {
  const result = await dialog.showOpenDialog({ properties: ["openDirectory"] });
  // console.log("Picked folder:", result.filePaths);
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

  // console.log("💾 Saving metadata:", data);
  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2), "utf-8");
});

ipcMain.handle("import-file-buffer", async (_event, { name, buffer, toFolder, folderPaths }) => {
  try {
    const destDir = folderPaths[toFolder];
    if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });

    const destPath = path.join(destDir, name);
    const data = Buffer.from(buffer);  // Reconstruct from array
    fs.writeFileSync(destPath, data);
    
    return { success: true };
  } catch (err) {
    console.error("❌ Failed to import buffer:", err);
    return { success: false, error: err.message };
  }
});

ipcMain.handle("delete-file", async (_event, { name, folder, folderPaths }) => {
  try {
    const targetPath = path.join(folderPaths[folder], name);
    if (fs.existsSync(targetPath)) {
      fs.unlinkSync(targetPath); // delete the file
      return { success: true };
    } else {
      return { success: false, error: "File not found" };
    }
  } catch (err) {
    console.error("❌ Failed to delete file:", err);
    return { success: false, error: err.message };
  }
});

app.whenReady().then(createWindow);
