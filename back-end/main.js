// app            ~ controls the life cycle of the app
// BrowserWindow  ~ creates and manages windows
// ipcMain        ~ handles IPC communication from renderer process
// dialog         ~ shows native system dialogs ~ for file picking
const { app, BrowserWindow, ipcMain, dialog } = require("electron");

// Better SQLite3 for database operations
const Database      = require("better-sqlite3");

// Path module for handling file paths
const path          = require("path");

// File system operations
const fs            = require("fs");

global.folderPaths  = { A: "", B: "", C: "" };

// app.getPath("userData") gives a default location for storing app data

// Development
const configPath    = path.join(__dirname, "../config-data/config.json");

// Needs double checking before integrating into dist-app
function createWindow() {
  const isDev = !app.isPackaged;

  const win = new BrowserWindow({
    width: 1000,
    height: 700,
    icon: path.join(__dirname, "../assets", "App.ico"),
    webPreferences: {
      // Isolate front-end from back-end
      contextIsolation: true,
      // Enable IPC communication
      preload: path.join(__dirname, "preload.js"),
      devTools: isDev, // only open devtools in dev mode
    },
  });

  if (isDev) {
    console.log("🔧 Running in development mode");
    win.loadURL("http://localhost:5173");

    // Open dev tools ~ inspect elements, console, etc.
    win.webContents.openDevTools();
  } else {
    console.log("🚀 Running in production mode");
    win.loadFile(path.join(__dirname, "../front-end/dist/index.html"));
  }
}

// Production
// const configPath  = path.join(app.getPath("userData"), "config.json");

// function createWindow() {
//   const isDev = process.env.NODE_ENV === "development";

//   const win = new BrowserWindow({
//     width: 1000,
//     height: 700,
//     webPreferences: {
//       contextIsolation: true,
//       preload: path.join(__dirname, "preload.js"),
//       sandbox: false,
//       nodeIntegration: false,
//       devTools: true,
//     },
//   });

//   if (isDev) {
//     console.log("🔧 Running in development mode");
//     win.loadURL("http://localhost:5173");
//     win.webContents.openDevTools();
//   } else {
//     const htmlPath = path.join(__dirname, "../renderer/index.html");
//     console.log("🚀 Running in production mode");
//     console.log("🧩 Resolved HTML path:", htmlPath);

//     const fs = require("fs");
//     if (!fs.existsSync(htmlPath)) {
//       console.error("❌ index.html not found at:", htmlPath);
//     } else {
//       console.log("✅ index.html found");
//       win.loadFile(htmlPath);
//     }
//   }
// }

app.whenReady().then(createWindow);

// IPC handlers 


////////////////////////////////////////////////////////
// Open a dialog for folder picking
ipcMain.handle("pick-folder", async () => {
  const result = await dialog.showOpenDialog({ properties: ["openDirectory"] });
  return result.filePaths?.[0] || null;
});
// Save the folder paths to config file
ipcMain.on("save-config", async (_e, paths) => {
  fs.writeFileSync(configPath, JSON.stringify(paths, null, 2), "utf-8");
});
////////////////////////////////////////////////////////


////////////////////////////////////////////////////////
ipcMain.handle("load-config", async () => {
  try {
    const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
    return config;
  } catch {
    return { A: "", B: "", C: "" };
  }
});
ipcMain.handle("set-folder-paths", async (_e, paths) => {
  global.folderPaths = paths;
});
////////////////////////////////////////////////////////


////////////////////////////////////////////////////////
// Move file(s) between folders
// Move row(s) between SQLite databases
// name : File_05.stl
// from : source folder key (A, B, C)
// to   : destination folder key (A, B, C)
ipcMain.handle("move-file", async (_e, { name, from, to }) => {
  try {
    const fromDir   = global.folderPaths[from];
    const toDir     = global.folderPaths[to];
    const fromPath  = path.join(fromDir, name);
    const baseName  = path.parse(name).name;      // File_05
    const ext       = path.extname(name);         // .stl

    let candidateName   = name;
    let suffixIndex     = 0;
    const romanSuffixes = ["_I", "_II", "_III", "_IV", "_V", "_VI", "_VII", "_VIII", "_IX", "_X"];

    // Prevent overwriting: find unique name in destination folder
    while (fs.existsSync(path.join(toDir, candidateName))) {
      suffixIndex   += 1;
      candidateName = `${baseName}${romanSuffixes[suffixIndex - 1] || `_copy${suffixIndex}`}${ext}`;
    }

    const toPath  = path.join(toDir, candidateName);  // File_05_I.stl or File_05_copy2.stl

    // Move the file between folders
    fs.renameSync(fromPath, toPath);

    // Move the file metadata between SQLite databases
    // Step 1: Load the metadata for the file from the "from" DB
    const fromDB  = getDB(fromDir);
    // .get() for reading
    const row     = fromDB.prepare("SELECT * FROM metadata WHERE name = ?").get(name);
    // .run() for writing
    fromDB.prepare("DELETE FROM metadata WHERE name = ?").run(name);
    fromDB.close();

    if (row) {
      // Step 2: Update metadata for new folder and name
      const toDB    = getDB(toDir);

      // let allRows = toDB.prepare("SELECT * FROM metadata").all();
      // console.log("Here 1:", allRows);
      
      const insert  = toDB.prepare(`
        INSERT OR REPLACE INTO metadata (
          id, name, owner, email, class, quantity, notes,

          printer1, printer2, printer3, printer4, printer5,
          material1, material2, material3, material4, material5,

          dateReceived, dateFinished, size
        ) VALUES (
          @id, @name, @owner, @email, @class, @quantity, @notes,

          @printer1, @printer2, @printer3, @printer4, @printer5,
          @material1, @material2, @material3, @material4, @material5,

          @dateReceived, @dateFinished, @size
        )
      `);

      // Assign new ID if renamed
      const newId =
        candidateName !== name || from !== to
          ? `${to}-${candidateName}`
          : row.id;
      
      // console.log("Moving file:", name, "from", from, "to", to);
      // console.log("New name:", candidateName, "New ID:", newId);

      insert.run({
        ...row,
        id  : newId,
        name: candidateName,
      });

      // allRows = toDB.prepare("SELECT * FROM metadata").all();
      // console.log("Here 2:", allRows);

      toDB.close();
    }

    return { success: true, newName: candidateName };
  } catch (err) {
    console.error("❌ Failed to move file or update metadata:", err);
    return { success: false, error: err.message };
  }
});

ipcMain.handle("delete-file", async (_e, { name, from }) => {
  const folderPath = global.folderPaths[from];
  const filePath = path.join(folderPath, name);

  try {
    // Delete the actual file if it exists
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
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

ipcMain.handle("import-file-buffer", async (_event, { name, buffer, to}) => {
  try {
    const toDir = global.folderPaths[to];
    if (!fs.existsSync(toDir)) fs.mkdirSync(toDir, { recursive: true });

    const toPath  = path.join(toDir, name);
    const data    = Buffer.from(buffer);  // Reconstruct from array
    fs.writeFileSync(toPath, data);
    
    return { success: true };
  } catch (err) {
    console.error("❌ Failed to import buffer:", err);
    return { success: false, error: err.message };
  }
});
////////////////////////////////////////////////////////


////////////////////////////////////////////////////////
function getDB(folderPath) {
  const dbPath = path.join(folderPath, "metadata.db");
  const db     = new Database(dbPath);
  db.pragma("journal_mode = WAL");

  db.prepare(`
    CREATE TABLE IF NOT EXISTS metadata (
      id            TEXT PRIMARY KEY,
      name          TEXT,
      owner         TEXT,
      email         TEXT,
      class         TEXT,
      quantity      INTEGER,
      notes         TEXT,

      printer1      TEXT,
      printer2      TEXT,
      printer3      TEXT,
      printer4      TEXT,
      printer5      TEXT,

      material1     TEXT,
      material2     TEXT,
      material3     TEXT,
      material4     TEXT,
      material5     TEXT,

      dateReceived  TEXT,
      dateFinished  TEXT,
      size          INTEGER
    )
  `).run();

  return db;
}

function saveMetadataToDB(folderPath, data) {
  const db = getDB(folderPath);

  const insert = db.prepare(`
    INSERT OR REPLACE INTO metadata (
      id, name, owner, email, class, quantity, notes,

      printer1, printer2, printer3, printer4, printer5,
      material1, material2, material3, material4, material5,

      dateReceived, dateFinished, size
    ) VALUES (
      @id, @name, @owner, @email, @class, @quantity, @notes,

      @printer1, @printer2, @printer3, @printer4, @printer5,
      @material1, @material2, @material3, @material4, @material5,

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

ipcMain.on("save-data", (_event, folders) => {
  for (const key of ["A", "B", "C"]) {
    saveMetadataToDB(global.folderPaths[key], folders[key]);
  }
});

function readSTLFilesFromFolder(folderPath) {
  // Step 1: Check if folder exists
  if (!fs.existsSync(folderPath)) return [];

  // Step 2: Read all file names in the folder
  const allFilenames = fs.readdirSync(folderPath);

  // Step 3: Filter only `.stl` files (case-insensitive)
  const stlFilenames = allFilenames.filter((f) =>
    f.toLowerCase().endsWith(".stl")
  );

  // Step 4: Build file info objects
  const fileData = stlFilenames.map((filename) => {
    const fullPath  = path.join(folderPath, filename);    // full file path
    const stats     = fs.statSync(fullPath);              // file metadata
    return {
      name: filename,
      fullPath,
      modifiedTime: stats.mtime,                          // last modified time
    };
  });

  // Step 5: Sort by modifiedTime (newest first)
  const sorted  = fileData.sort((a, b) => b.modifiedTime - a.modifiedTime);

  // Step 6: Limit to 50 files
  const limited = sorted.slice(0, 50);

  // Step 7: Return only name + fullPath
  return limited.map(({ name, fullPath }) => ({ name, fullPath }));
}

function loadMetadataFromDB(folderPath) {
  const db    = getDB(folderPath);
  const rows  = db.prepare("SELECT * FROM metadata").all();
  db.close();
  return rows;
}

ipcMain.handle("scan-folders", async (_event) => {
  const result = { A: [], B: [], C: [] };

  for (const key of ["A", "B", "C"]) {
    const folder   = global.folderPaths[key];
    const files    = readSTLFilesFromFolder(folder);
    const metadata = loadMetadataFromDB(folder);

    result[key] = files.map(({ name, fullPath }) => {
      let stats = null;
      try {
        stats = fs.statSync(fullPath);
      } catch {
        console.warn("⚠️ Failed to stat file:", fullPath);
      }

      // Try to find matching metadata by filename
      const existing = metadata.find((f) => f.name === name);
      return (
        existing ?? {
          id: `${key}-${name}`,
          name,
          owner:        "",
          email:        "",
          class:        "",
          quantity:     1,
          notes:        "",

          printer1:     "",
          printer2:     "",
          printer3:     "",
          printer4:     "",
          printer5:     "",

          material1:    "",
          material2:    "",
          material3:    "",
          material4:    "",
          material5:    "",

          dateReceived: stats?.mtime?.toISOString() || "",
          dateFinished: "",
          size:         stats?.size || 0,
        }
      );
    });
  }

  return result;
});
////////////////////////////////////////////////////////


////////////////////////////////////////////////////////
ipcMain.handle("get-stats-db", (_event) => {
  try {
    // Checking for existing folder and .db file
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

    // Trend chart 
     const trendData = db.prepare(`
      SELECT DATE(dateFinished) AS day, COUNT(*) AS count
      FROM metadata
      WHERE dateFinished IS NOT NULL AND TRIM(dateFinished) != ''
      GROUP BY day
      ORDER BY day
    `).all();

    db.close();

    return {
      success: true,
      totalPrinted,
      totalPartsPrinted,
      avgPrintTime: `${Math.round(avgSeconds)} sec`,
      topStudents,
      topClasses,
      trendData,
    };
  } catch (err) {
    console.error("❌ Failed to calculate stats:", err);
    return { success: false, error: err.message };
  }
});


////////////////////////////////////////////////////////
// Define path to config-data/notes.db
const notesDBPath = path.join(__dirname, "../config-data/notes.db");

// Make sure the folder exists
fs.mkdirSync(path.dirname(notesDBPath), { recursive: true });

// This line automatically creates the DB file if it doesn't exist
const notesDB = new Database(notesDBPath);

// Create table if needed
notesDB.prepare(`
  CREATE TABLE IF NOT EXISTS notes (
    id          TEXT PRIMARY KEY,
    author      TEXT NOT NULL,
    recipient   TEXT NOT NULL,
    message     TEXT NOT NULL,
    dateCreated TEXT NOT NULL
  )
`).run();


ipcMain.handle("get-notes-from-db", () => {
  const stmt = notesDB.prepare("SELECT * FROM notes ORDER BY dateCreated DESC");
  return stmt.all();
});

ipcMain.handle("save-note-to-db", (event, note) => {
  try {
    const stmt = notesDB.prepare(`
      INSERT OR REPLACE INTO notes (id, author, recipient, message, dateCreated)
      VALUES (@id, @author, @recipient, @message, @dateCreated)
    `);
    stmt.run(note);
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle("delete-note-from-db", (event, id) => {
  try {
    const stmt = notesDB.prepare("DELETE FROM notes WHERE id = ?");
    stmt.run(id);
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle("update-note-in-db", (event, note) => {
  try {
    const stmt = notesDB.prepare(`
      UPDATE notes SET 
        author = @author,
        recipient = @recipient,
        message = @message,
        dateCreated = @dateCreated
      WHERE id = @id
    `);
    stmt.run(note);
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

