import type { FileItem, FolderKey} from "../types/FileItem";
import { useEffect, useState } from "react";
import { FolderUp } from "lucide-react";
import FolderView from "../components/FolderView";
import EditFileModal from "../components/EditFileModal";
import { useFolders } from "../context/FolderContext";

declare global {
  interface Window {
    electronAPI: {
      // Run at startup
      loadConfig:     () => Promise<Record<FolderKey, string>>;
      setFolderPaths: (paths: Record<FolderKey, string>) => void;
      scanFolders:    () => Promise<Record<FolderKey, FileItem[]>>;
      saveData:       (folders: Record<FolderKey, FileItem[]>) => void;

      //
      pickFolder: () => Promise<string | null>;
      saveConfig: (paths: Record<FolderKey, string>) => void;
      //

      //
      moveFile: (params: {
        name: string;
        from: FolderKey;
        to  : FolderKey;
      }) => Promise<{ success: boolean; newName?: string; error?: string }>;

      deleteFile: (params: {
        name: string;
        from: FolderKey;
      }) => Promise<{ success: boolean; error?: string }>;
      //

      importFileBuffer?: (params: {
        name: string;
        buffer: number[];
        to: FolderKey;
      }) => Promise<{ success: boolean; error?: string }>;

      getStatsFromDB: () => Promise<{
        success:            boolean;
        totalPrinted:       number;
        totalPartsPrinted:  number;
        avgPrintTime:       string;
        topStudents:        { owner: string; count: number }[];
        topClasses:         { class: string; count: number }[];
        trendData:          { day: string; count: number }[];
      }>;

    };
  }
}

function Main() {
  const [configReady, setConfigReady]   = useState(false);
  const [folderPaths, setFolderPaths]   = useState<Record<FolderKey, string>>({A: "", B: "", C: "",});
  const { folders, setFolders }         = useFolders();
  

  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  

  // Step 1: Load config at startup
  useEffect(() => {
    window.electronAPI.loadConfig().then((config) => {
      setFolderPaths(config);
      setConfigReady(true);
    });
  }, []);

  // Step 2: Load saved metadata and scan folders after config is ready
  useEffect(() => {
    if (configReady && (folderPaths.A || folderPaths.B || folderPaths.C)) {
      // Tell backend the folder paths for global use
      window.electronAPI.setFolderPaths(folderPaths);
      
      // Then scan the folders to update metadata in UI
      window.electronAPI.scanFolders().then((scanned) => {
        setFolders(scanned);
      });
    }
  }, [folderPaths, configReady]);

  // Step 3: Save updated metadata when folders change
  useEffect(() => {
    // Check if all folders are empty
    const areEmpty = Object.values(folders).every(arr => arr.length === 0);

    if (!areEmpty) {
      window.electronAPI.saveData(folders);
    }
  }, [folders]);

  // Handle file drop in the drop area
  useEffect(() => {
    const dropZone    = document.getElementById("drop-area");

    const handleDrop  = (e: DragEvent) => {
      e.preventDefault();

      // Convert e.dataTransfer to an array, and filter only .stl
      const files = Array.from(e.dataTransfer?.files || []).filter((file) =>
        file.name.toLowerCase().endsWith(".stl")
      );

      for (const file of files) {
        const reader = new FileReader();

        reader.onload = async () => {
          // buffer - file content in binary format
          const buffer = reader.result as ArrayBuffer;
          const to: FolderKey = "A"; 
          
          // result = { success: boolean, error?: string }
          const result = await window.electronAPI.importFileBuffer?.({
            name:   file.name,
            // conver buffer to a format that can be sent via IPC
            buffer: Array.from(new Uint8Array(buffer)),
            to,
          });

          if (result?.success) {
            window.electronAPI.scanFolders().then(setFolders);
          } else {
            alert(`❌ Failed to import ${file.name}: ` + result?.error);
          }
        };

        reader.readAsArrayBuffer(file);
      }
    };

    const handleDragOver = (e: DragEvent) => e.preventDefault();

    dropZone?.addEventListener("drop", handleDrop);
    dropZone?.addEventListener("dragover", handleDragOver);

    return () => {
      dropZone?.removeEventListener("drop", handleDrop);
      dropZone?.removeEventListener("dragover", handleDragOver);
    };
  }, [folderPaths]);

  // Handle picking a folder
  // FolderKey ("A", "B", "C")
  // Calls the backend to open a dialog for folder picking
  // Updates the folderPaths state with the selected path
  // Saves the updated path 
  const handlePickFolder = async (key: FolderKey) => {
    const selected = await window.electronAPI.pickFolder();
    if (selected) {
      const updatedFolderPaths = { ...folderPaths, [key]: selected };
      setFolderPaths(updatedFolderPaths);
      window.electronAPI.saveConfig(updatedFolderPaths);
    }
  }

  // Handle dropping a file
  const handleDropFile = async (
    file:           FileItem,
    from:           FolderKey,
    to:             FolderKey,
    originalIndex?: number,
    dropIndex?:     number
  ) => {
    // Reordering within same folder
    if (from === to && originalIndex != null && dropIndex != null) {
      setFolders(prev => {
        const files   = [...prev[to]];
        const [moved] = files.splice(originalIndex, 1);
        files.splice(dropIndex, 0, moved);

        // Keep all the old folders
        // and just update the folder with the new order
        return {
          ...prev,
          [to]: files,
        };
      });
      return;
    }

    // result = { success: boolean, newName?: string, error?: string }
    const result = await window.electronAPI.moveFile({
      name: file.name,
      from,
      to
    });

    if (result.success) {
      // If the file was renamed, update the name and id
      const newName = result.newName ?? file.name;
      const newId   = newName !== file.name ? `${to}-${newName}` : file.id;
    
      // Create a new file item with updated name and id
      let updatedFile: FileItem = {
        ...file,
        name: newName,
        id: newId,
      };

      // Handle dateFinished logic
      if (to === "C") {
        updatedFile.dateFinished = new Date().toISOString();
      } else if (from === "C") {
        updatedFile.dateFinished = "";
      }

      // Update the folders state
      setFolders(prev => ({
        ...prev,
        [from]: prev[from].filter((f) => f.id !== file.id),
        [to]: [updatedFile, ...prev[to]],
      }));
    }
  };

  const handleDeleteFile = async (file: FileItem, from: FolderKey) => {
    // result = { success: boolean, error?: string }
    const result = await window.electronAPI.deleteFile({
      name: file.name,
      from,
    });
    
    if (result.success) {
      setFolders((prev) => ({
        ...prev,
        // Remove from the folder
        [from]: prev[from].filter((f) => f.id !== file.id),
      }));

    } else {
      alert("❌ Failed to delete file: " + result.error);
    }
  };

  // Used by popup to update file metadata
  const handleSaveMetadata = (updatedFile: FileItem) => {
    setFolders((prev) => {
      const next = { ...prev };
      for (const key in next) {
        const folder = key as FolderKey;
        next[folder] = next[folder].map((f) =>
          f.id === updatedFile.id ? updatedFile : f
        );
      }
      return next;
    });
    setSelectedFile(null);
  }

  return (
    <div className="p-6 space-y-4">

      {/* Drop Area */}
      <div
        id="drop-area"
        className="text-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 text-gray-500 flex items-center justify-center"
      >
        Drop files here
      </div>

      <div className="flex gap-4">
        {(["A", "B", "C"] as FolderKey[]).map((key) => {
          const folderLabel =
            key === "A" ? "Queue" : key === "B" ? "In Progress" : "Done";

          return (
            <div key={key} className="flex-1 space-y-2">
              {/* Header: Folder title and pick button */}
              <div className="flex items-center border border-gray-300 rounded-md bg-white h-20 shadow-sm">
                {/* Left: Folder label + current path */}
                <div className="flex-1 flex flex-col items-center justify-center">
                  <div className="text-xl font-semibold text-gray-800">
                    {folderLabel}
                  </div>
                  <div className="text-sm text-gray-500 truncate max-w-full px-2">
                    {folderPaths[key]?.split(/[\\/]/).pop() || "Not set"}
                  </div>
                </div>

                {/* Right: Pick folder button */}
                <button
                  onClick={() => handlePickFolder(key)}
                  className="w-20 h-full bg-blue-100 border-l border-blue-300 
                            flex items-center justify-center 
                            hover:bg-blue-200 active:bg-blue-300 
                            transition-colors duration-200 rounded-r-md"
                  title={folderPaths[key] || "Pick folder"}
                >
                  <FolderUp size={28} className="text-blue-600" />
                </button>
              </div>

              {/* Folder content */}
              <FolderView
                // title={`${folderLabel} (${key})`}
                folderId={key}
                files={folders[key]}
                allFiles={folders}
                onClickFile={setSelectedFile}
                onDropFile={(file, from, originalIndex, dropIndex) =>
                  handleDropFile(file, from as FolderKey, key, originalIndex, dropIndex)
                }
                onDeleteFile={handleDeleteFile}
              />
            </div>
          );
        })}
      </div>

      {/* Metadata modal */}
      <EditFileModal
        file    ={selectedFile}
        onClose ={() => setSelectedFile(null)}
        onSave  ={handleSaveMetadata}
      />
    </div>

  );
};

export default Main;