const { app, BrowserWindow, ipcMain, dialog } = require("electron");

const Database  = require("better-sqlite3");
const path      = require("path");
const fs        = require("fs");

// const dataPath    = path.join(app.getPath("userData"), "data.json");
const configPath  = path.join(app.getPath("userData"), "config.json");

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

// Folder picker dialog
ipcMain.handle("pick-folder", async () => {
  const result = await dialog.showOpenDialog({ properties: ["openDirectory"] });
  // console.log("Picked folder:", result.filePaths);
  return result.filePaths?.[0] || null;
});

////////////////////////////////////////////////////////
ipcMain.handle("load-config", () => {
  try {
    const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
    return config;
  } catch {
    return { A: "", B: "", C: "" };
  }
});
ipcMain.on("save-config", (_event, paths) => {
  fs.writeFileSync(configPath, JSON.stringify(paths, null, 2), "utf-8");
});
////////////////////////////////////////////////////////

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


/////////////////////

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

function getDB(folderPath) {
  const dbPath = path.join(folderPath, "metadata.db");
  const db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
  db.prepare(`
    CREATE TABLE IF NOT EXISTS metadata (
      id TEXT PRIMARY KEY,
      name TEXT,
      owner TEXT,
      email TEXT,
      class TEXT,
      quantity INTEGER,
      notes TEXT,
      dateReceived TEXT,
      dateFinished TEXT,
      size INTEGER
    )
  `).run();
  return db;
}

function loadMetadataFromDB(folderPath) {
  const db = getDB(folderPath);
  const rows = db.prepare("SELECT * FROM metadata").all();
  db.close();
  return rows;
}

function saveMetadataToDB(folderPath, data) {
  const db = getDB(folderPath);
  const insert = db.prepare(`
    INSERT OR REPLACE INTO metadata (
      id, name, owner, email, class, quantity, notes,
      dateReceived, dateFinished, size
    ) VALUES (
      @id, @name, @owner, @email, @class, @quantity, @notes,
      @dateReceived, @dateFinished, @size
    )
  `);
  const tx = db.transaction((items) => {
    for (const item of items) {
      insert.run(item);
    }
  });
  tx(data);
  db.close();
}

ipcMain.on("save-data", (_event, { folders, folderPaths }) => {
  for (const key of ["A", "B", "C"]) {
    saveMetadataToDB(folderPaths[key], folders[key]);
  }
});

ipcMain.handle("scan-folders", async (_event, folderPaths) => {
  const result = { A: [], B: [], C: [] };

  for (const key of ["A", "B", "C"]) {
    const folder    = folderPaths[key];
    const files     = readSTLFilesFromFolder(folder);
    const metadata  = loadMetadataFromDB(folder);

    result[key] = files.map(({ name, fullPath }) => {
      let stats = null;
      try {
        stats = fs.statSync(fullPath);
      } catch {
        console.warn("⚠️ Failed to stat file:", fullPath);
      }

      const existing = metadata.find((f) => f.name === name);
      return (
        existing ?? {
          id: `${key}-${name}`,
          name,
          owner: "",
          email: "",
          class: "",
          quantity: 1,
          notes: "",
          dateReceived: stats?.mtime?.toISOString() || "",
          dateFinished: "",
          size: stats?.size || 0,
        }
      );
    });
  }

  return result;
});

app.whenReady().then(createWindow);
