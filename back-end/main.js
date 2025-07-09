const { app, BrowserWindow, ipcMain, dialog } = require("electron");

const Database  = require("better-sqlite3");
const path      = require("path");
const fs        = require("fs");

global.folderPaths = { A: "", B: "", C: "" };

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

// IPC handlers for main process

////////////////////////////////////////////////////////
ipcMain.handle("load-config", () => {
  try {
    const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
    return config;
  } catch {
    return { A: "", B: "", C: "" };
  }
});
ipcMain.handle("pick-folder", async () => {
  const result = await dialog.showOpenDialog({ properties: ["openDirectory"] });
  return result.filePaths?.[0] || null;
});
ipcMain.on("save-config", (_event, paths) => {
  fs.writeFileSync(configPath, JSON.stringify(paths, null, 2), "utf-8");
});
////////////////////////////////////////////////////////

////////////////////////////////////////////////////////
ipcMain.handle("move-file", async (_event, { name, from, to, folderPaths }) => {
  try {
    const fromDir = folderPaths[from];
    const toDir = folderPaths[to];
    const fromPath = path.join(fromDir, name);
    const baseName = path.parse(name).name;
    const ext = path.extname(name);

    let candidateName = name;
    let suffixIndex = 0;
    const romanSuffixes = ["_I", "_II", "_III", "_IV", "_V", "_VI", "_VII", "_VIII", "_IX", "_X"];

    // Prevent overwriting: find unique name in destination folder
    while (fs.existsSync(path.join(toDir, candidateName))) {
      suffixIndex += 1;
      candidateName = `${baseName}${romanSuffixes[suffixIndex - 1] || `_copy${suffixIndex}`}${ext}`;
    }

    const destPath = path.join(toDir, candidateName);
    fs.renameSync(fromPath, destPath);

    // Step 1: Load the metadata for the file from the "from" DB
    const fromDB = getDB(fromDir);
    const row = fromDB.prepare("SELECT * FROM metadata WHERE name = ?").get(name);
    fromDB.prepare("DELETE FROM metadata WHERE name = ?").run(name);
    fromDB.close();

    if (row) {
      // Step 2: Update metadata for new folder and name
      const toDB = getDB(toDir);
      const insert = toDB.prepare(`
        INSERT OR REPLACE INTO metadata (
          id, name, owner, email, class, quantity, notes,
          dateReceived, dateFinished, size
        ) VALUES (
          @id, @name, @owner, @email, @class, @quantity, @notes,
          @dateReceived, @dateFinished, @size
        )
      `);

      // Assign new ID if renamed
      const newId = candidateName !== name ? `${to}-${candidateName}` : row.id;

      insert.run({
        ...row,
        id: newId,
        name: candidateName,
      });

      toDB.close();
    }

    return { success: true, newName: candidateName };
  } catch (err) {
    console.error("❌ Failed to move file or update metadata:", err);
    return { success: false, error: err.message };
  }
});

ipcMain.handle("delete-file", async (_event, { name, folder, folderPaths }) => {
  const folderPath = folderPaths[folder];
  const targetPath = path.join(folderPath, name);

  try {
    // Delete the actual file if it exists
    if (fs.existsSync(targetPath)) {
      fs.unlinkSync(targetPath);
    }

    // Then delete metadata from the SQLite DB
    const db = getDB(folderPath);
    db.prepare("DELETE FROM metadata WHERE name = ?").run(name);
    db.close();

    return { success: true };
  } catch (err) {
    console.error("❌ Failed to delete file or metadata:", err);
    return { success: false, error: err.message };
  }
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
////////////////////////////////////////////////////////

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


////////////////////////////////////////////////////////
ipcMain.handle("get-stats-db", (_event) => {
  try {
    const folderCPath = global.folderPaths?.["C"];
    if (!folderCPath) throw new Error("Folder C not set");

    const dbPath = path.join(folderCPath, "metadata.db");
    if (!fs.existsSync(dbPath)) {
      throw new Error("DB file does not exist at: " + dbPath);
    }

    const db = new Database(dbPath, { readonly: true });

    // Total files printed
    const totalPrinted = db.prepare("SELECT COUNT(*) as count FROM metadata").get().count;

    // Total parts printed (sum of quantity)
    const totalPartsPrinted = db.prepare(`
      SELECT SUM(quantity) as totalParts
      FROM metadata
      WHERE quantity IS NOT NULL
    `).get().totalParts || 0;

    // Average print time
    const avg = db.prepare(`
      SELECT AVG(
        JULIANDAY(dateFinished) - JULIANDAY(dateReceived)
      ) * 86400.0 as avgSec
      FROM metadata
      WHERE dateFinished IS NOT NULL AND TRIM(dateFinished) != ''
    `).get();
    const avgSeconds = avg?.avgSec || 0;

    // Top 5 students
    const topStudents = db.prepare(`
      SELECT owner, COUNT(*) as count
      FROM metadata
      WHERE owner IS NOT NULL AND TRIM(owner) != ''
      GROUP BY owner
      ORDER BY count DESC
      LIMIT 5
    `).all();

    // Top 5 classes
    const topClasses = db.prepare(`
      SELECT class, COUNT(*) as count
      FROM metadata
      WHERE class IS NOT NULL AND TRIM(class) != ''
      GROUP BY class
      ORDER BY count DESC
      LIMIT 5
    `).all();

    db.close();

    return {
      success: true,
      totalPrinted,
      totalPartsPrinted,
      avgPrintTime: `${Math.round(avgSeconds)} sec`,
      topStudents,
      topClasses,
    };
  } catch (err) {
    console.error("❌ Failed to calculate stats:", err);
    return { success: false, error: err.message };
  }
});


ipcMain.handle("set-folder-paths", (_e, paths) => {
  global.folderPaths = paths;
  // console.log("📂 Folder paths updated:", global.folderPaths);
});
