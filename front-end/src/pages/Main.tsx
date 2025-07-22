import type { File, Folder} from "../types/Types";
import { useEffect, useState } from "react";
import { FolderUp } from "lucide-react";
import FolderView from "../components/FolderView";
import EditFileModal from "../components/EditFileModal";
import { useFolders } from "../context/FolderContext";

function Main() {
  const [configReady, setConfigReady]   = useState(false);
  const [folderPaths, setFolderPaths]   = useState<Record<Folder, string>>({A: "", B: "", C: "",});
  const { folders, setFolders }         = useFolders();
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

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
          const to: Folder = "A"; 
          
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
  // Folder ("A", "B", "C")
  // Calls the backend to open a dialog for folder picking
  // Updates the folderPaths state with the selected path
  // Saves the updated path 
  const handlePickFolder = async (key: Folder) => {
    const selected = await window.electronAPI.pickFolder();
    if (selected) {
      const updatedFolderPaths = { ...folderPaths, [key]: selected };
      setFolderPaths(updatedFolderPaths);
      window.electronAPI.saveConfig(updatedFolderPaths);
    }
  }

  // Handle dropping a file
  const handleDropFile = async (
    file:           File,
    from:           Folder,
    to:             Folder,
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
      let updatedFile: File = {
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

  const handleDeleteFile = async (file: File, from: Folder) => {
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
  const handleSaveMetadata = (updatedFile: File) => {
    setFolders((prev) => {
      const next = { ...prev };
      for (const key in next) {
        const folder = key as Folder;
        next[folder] = next[folder].map((f) =>
          f.id === updatedFile.id ? updatedFile : f
        );
      }
      return next;
    });
    setSelectedFile(null);
  }

const handleFiles = (fileList: FileList | null) => {
  if (!fileList) return;

  const files = Array.from(fileList).filter((file) =>
    file.name.toLowerCase().endsWith(".stl")
  );

  for (const file of files) {
    const reader = new FileReader();

    reader.onload = async () => {
      const buffer = reader.result as ArrayBuffer;
      const to: Folder = "A";

      const result = await window.electronAPI.importFileBuffer?.({
        name: file.name,
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

  return (
    <div className="p-6 space-y-6">

<div className="flex items-center gap-6 w-full">
  {/* Drop Area */}
  <div
    id="drop-area"
    className="flex-1 h-32 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 text-gray-500 flex items-center justify-center"
  >
    Drop files here
  </div>

  {/* Insert Button */}
  <button
    onClick={() => document.getElementById("file-picker")?.click()}
    className="h-32 px-4 py-2 border-dashed border-gray-300 rounded-lg bg-blue-300 text-blue-600 hover:bg-blue-200 transition"
  >
    Insert File(s)
  </button>

  {/* Hidden File Input */}
  <input
    type="file"
    id="file-picker"
    accept=".stl"
    multiple
    className="hidden"
    onChange={(e) => handleFiles(e.target.files)} // Make sure handleFiles is in scope
  />
</div>


      <div className="flex gap-6">
        {(["A", "B", "C"] as Folder[]).map((folder) => {
          const folderLabel =
            folder === "A" ? "Queue" : folder === "B" ? "In Progress" : "Done";

          return (
            <div key={folder} className="flex-1 space-y-6">
              {/* Header: Folder title and pick button */}
              <div className="flex items-center border border-gray-300 rounded-md bg-white h-20 shadow-sm">
                {/* Left: Folder label + current path */}
                <div className="flex-1 flex flex-col items-center justify-center">
                  <div className="text-xl font-semibold text-gray-800">
                    {folderLabel}
                  </div>
                  <div className="text-sm text-gray-500 truncate max-w-full px-2">
                    {folderPaths[folder]?.split(/[\\/]/).pop() || "Not set"}
                  </div>
                </div>

                {/* Right: Pick folder button */}
                <button
                  onClick={() => handlePickFolder(folder)}
                  className="w-20 h-full bg-blue-100 border-l border-blue-300 
                            flex items-center justify-center 
                            hover:bg-blue-200 active:bg-blue-300 
                            transition-colors duration-200 rounded-r-md"
                  title={folderPaths[folder] || "Pick folder"}
                >
                  <FolderUp size={28} className="text-blue-600" />
                </button>
              </div>

              {/* Folder content */}
              <FolderView
                folder      ={folder}
                files       ={folders[folder]}
                onClickFile ={setSelectedFile}
                onDropFile  ={(file, from, originalIndex, dropIndex) =>
                  handleDropFile(file, from as Folder, folder, originalIndex, dropIndex)
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