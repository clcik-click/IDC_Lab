import { useState, useEffect } from "react";
import type { FileItem, FolderKey } from "../types/FileItem";
import FolderView from "../components/FolderView";
import EditFileModal from "../components/EditFileModal";

// Mirror IPC routes defined in preload.js in the Electron backend
declare global {
  interface Window {
    electronAPI: {
      // loads saved file metadata
      loadData:     () => Promise<Record<FolderKey, FileItem[]>>;
      // saves file metadata
      saveData:     (data: Record<FolderKey, FileItem[]>) => void;
      // opens folder picker dialog
      pickFolder:   () => Promise<string | null>;
      // saves folder paths
      saveConfig:   (paths: Record<FolderKey, string>) => void;
      // loads folder paths
      loadConfig:   () => Promise<Record<FolderKey, string>>;
      // scans the folders and returns their .stl file contents
      scanFolders:  (paths: Record<FolderKey, string>) => Promise<Record<FolderKey, FileItem[]>>; 
      // moves a file from one folder to another
      moveFile:     (params: {
        name: string;
        from: FolderKey;
        to: FolderKey;
        folderPaths: Record<FolderKey, string>;
      }) => Promise<{ success: boolean; error?: string }>;
    };
  }
}

export default function Setup() {
  const [folders, setFolders] = useState<Record<FolderKey, FileItem[]>>({ A: [], B: [], C: [], });
  const [folderPaths, setFolderPaths]   = useState<Record<FolderKey, string>>({ A: "", B: "", C: "", });
  
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [configReady, setConfigReady]   = useState(false);

  // Load config once
  useEffect(() => {
    window.electronAPI.loadConfig().then((config) => {
      setFolderPaths(config);
      setConfigReady(true);
    });
  }, []);

  // After config is loaded AND complete, scan folders
  useEffect(() => {
    if (
      // configReady &&
      folderPaths.A ||
      folderPaths.B ||
      folderPaths.C
    ) {
      window.electronAPI.scanFolders(folderPaths).then(setFolders);
    }
  }, [folderPaths, configReady]);
  
  // Save metadata on every folder change
  useEffect(() => {
    window.electronAPI.saveData(folders);
  }, [folders]);

  // Select folder paths
  const handlePickFolder = async (key: FolderKey) => {
    const selected = await window.electronAPI.pickFolder();
    if (selected) {
      const updated = { ...folderPaths, [key]: selected };
      setFolderPaths(updated);
      window.electronAPI.saveConfig(updated);
    }
  };

  // Drag & Drop features
  const handleDragStart = (
    e: React.DragEvent,
    file: FileItem,
    from: FolderKey
  ) => {
    const payload = JSON.stringify({ file, from });
    e.dataTransfer.setData("text/plain", payload);
  };

  const handleDropFile = async (
    file: FileItem,
    from: FolderKey,
    to: FolderKey
  ) => {
    if (from === to) return;

    // Attempt to move the file
    const result = await window.electronAPI.moveFile({
      name: file.name,
      from,
      to,
      folderPaths,
    });

    if (result.success) {
      // Update metadata and UI
      setFolders((prev) => ({
        ...prev,
        [from]: prev[from].filter((f) => f.id !== file.id),
        [to]: [file, ...prev[to]],
      }));
    } else {
      alert("❌ Failed to move file: " + result.error);
    }
  };

  //
  const handleSaveMetadata = (updated: FileItem) => {
    setFolders((prev) => {
      const next = { ...prev };
      for (const key in next) {
        const folder = key as FolderKey;
        next[folder] = next[folder].map((f) =>
          f.id === updated.id ? updated : f
        );
      }
      return next;
    });
    setSelectedFile(null);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Folder picker controls */}
      <div className="flex gap-4">
        {(["A", "B", "C"] as FolderKey[]).map((key) => (
          <div key={key} className="space-y-1 text-sm max-w-[250px]">
            <button
              onClick={() => handlePickFolder(key)}
              className="px-3 py-1 rounded bg-blue-600 text-white text-sm"
            >
              Select Folder {key}
            </button>
            <div className="text-gray-500 truncate">{folderPaths[key] || "Not set"}</div>
          </div>
        ))}
      </div>

      {/* Folder views */}
      <div className="flex gap-4">
        {(["A", "B", "C"] as FolderKey[]).map((key) => (
          <FolderView
            key={key}
            title={
              key === "A"
                ? "Queue (A)"
                : key === "B"
                ? "In Progress (B)"
                : "Done (C)"
            }
            folderId={key}
            files={folders[key]}
            onDropFile={(file, from) =>
              handleDropFile(file, from as FolderKey, key)
            }
            onDragStart={handleDragStart}
            onClickFile={(file) => setSelectedFile(file)}
          />
        ))}
      </div>

      {/* Metadata modal */}
      <EditFileModal
        file    ={selectedFile}
        onClose ={() => setSelectedFile(null)}
        onSave  ={handleSaveMetadata}
      />
    </div>
  );
}
