import type { FileItem, FolderKey} from "../types/FileItem";
import { useEffect, useState } from "react";
import { FolderUp } from "lucide-react";
import FolderView from "../components/FolderView_2";
import EditFileModal from "../components/EditFileModal";

declare global {
  interface window{
    electronAPI: {
        // File paths
        pickFolder:   () => Promise<string | null>;
        loadConfig:   () => Promise<Record<FolderKey, string>>;
        saveConfig:   (paths: Record<FolderKey, string>) => void;

        // File metadata
        loadData:     () => Promise<Record<FolderKey, FileItem[]>>;
        saveData:     (data: Record<FolderKey, FileItem[]>) => void;
        scanFolders:  (paths: Record<FolderKey, string>) => Promise<Record<FolderKey, FileItem[]>>;
        

        moveFile:     (params: { name: string }) => Promise<{ success: boolean; error?: string }>; 

        importFileBuffer?: (params: {
          name: string;
          buffer: number[];
          toFolder: FolderKey;
          folderPaths: Record<FolderKey, string>;
        }) => Promise<{ success: boolean; error?: string }>;

        deleteFile: (params: {
          name: string;
          folder: FolderKey;
          folderPaths: Record<FolderKey, string>;
        }) => Promise<{ success: boolean; error?: string }>;

    }
  }
}

function Data() {
  const [folders, setFolders]         = useState<Record<FolderKey, FileItem[]>>({ A: [], B: [], C: [], });
  const [folderPaths, setFolderPaths] = useState<Record<FolderKey, string>>({A: "", B: "", C: "",});

  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [configReady, setConfigReady] = useState(false);

  // Step 1: Load config once
  useEffect(() => {
    window.electronAPI.loadConfig().then((config) => {
      setFolderPaths(config);
      // console.log("Loaded folder paths:", config);
      setConfigReady(true);
    });
  }, []);

  // Step 2: Load saved metadata and scan folders after config is ready
  useEffect(() => {
    if (configReady && (folderPaths.A || folderPaths.B || folderPaths.C)) {
      // First, load saved metadata
      window.electronAPI.loadData().then((saved) => {
        setFolders(saved);
        console.log("✅ Loaded saved metadata:", saved);

        // Then scan folders and merge new files
        window.electronAPI.scanFolders(folderPaths).then((scanned) => {
          setFolders(scanned);
          console.log("✅ Scanned folders and updated state");
        });
      });
    }
  }, [folderPaths, configReady]);

  // Step 3: Save updated metadata when folders change
  useEffect(() => {
    // Prevent saving empty folder state
    const isEmpty = Object.values(folders).every(arr => arr.length === 0);
    if (!isEmpty) {
      window.electronAPI.saveData(folders);
      console.log("💾 Saved metadata:", folders);
    }
  }, [folders]);

  // Handle file drop in the drop area
  useEffect(() => {
    const dropZone = document.getElementById("drop-area");

    const handleDrop = (e: DragEvent) => {
      e.preventDefault();

      const files = Array.from(e.dataTransfer?.files || []).filter((file) =>
        file.name.toLowerCase().endsWith(".stl")
      );

      for (const file of files) {
        const reader = new FileReader();

        reader.onload = async () => {
          const buffer = reader.result as ArrayBuffer;
          const toFolder: FolderKey = "A"; // 👈 adjust logic later

          const result = await window.electronAPI.importFileBuffer?.({
            name: file.name,
            buffer: Array.from(new Uint8Array(buffer)),
            toFolder,
            folderPaths,
          });

          if (result?.success) {
            window.electronAPI.scanFolders(folderPaths).then(setFolders);
            console.log(`✅ Imported: ${file.name}`);
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


  // Handle picking a folder path
  const handlePickFolder = async (key: FolderKey) => {
    const selected = await window.electronAPI.pickFolder();
    if (selected) {
      const updated = { ...folderPaths, [key]: selected };
      console.log(updated)
      setFolderPaths(updated);
      window.electronAPI.saveConfig(updated);
    }
  }

  // Handle draging a file - copy the file information to the data transfer object
  // const handleDragFile = (e: React.DragEvent, file: FileItem, from: FolderKey, index: number) => {
  //   const payload = JSON.stringify({ file, from, index });
  //   console.log("Dragging file:", file.name, "from:", from, "index:", index);
  //   console.log("Payload:", payload);
  //   e.dataTransfer.setData("text/plain", payload);
  // }

  // Handle dropping a file
  const handleDropFile = async (
    file: FileItem,
    from: FolderKey,
    to: FolderKey,
    originalIndex?: number,
    dropIndex?: number
  ) => {
    if (from === to && originalIndex != null && dropIndex != null) {
      setFolders(prev => {
        const files = [...prev[to]];
        const [moved] = files.splice(originalIndex, 1); // remove
        files.splice(dropIndex, 0, moved);              // insert
        return {
          ...prev,
          [to]: files,
        };
      });
      return; // skip API call if just reordering
    }

    const result = await window.electronAPI.moveFile({
      name: file.name,
      from,
      to,
      folderPaths
    });

    if (result.success) {
      setFolders(prev => ({
        ...prev,
        [from]: prev[from].filter((f) => f.id !== file.id),
        [to]: [file, ...prev[to]],
      }));
    }
  }

  const handleDeleteFile = async (file: FileItem, folder: FolderKey) => {
    const result = await window.electronAPI.deleteFile({
      name: file.name,
      folder,
      folderPaths,
    });

    if (result.success) {
      setFolders((prev) => ({
        ...prev,
        [folder]: prev[folder].filter((f) => f.id !== file.id),
      }));
      console.log("✅ File deleted:", file.name);
    } else {
      alert("❌ Failed to delete file: " + result.error);
    }
  };


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
  }

  return (
    <div className="p-6 space-y-4"> 

    {/* Drop Area */}
      <div id="drop-area" className="text-center w-full h-full border-2 border-dashed p-4">
        Drop here
      </div>

      <div className="flex gap-4">
        {(["A", "B", "C"] as FolderKey[]).map((key) => (
          <div key={key} className="flex-1 space-y-2">
            
            <div className="flex border h-20 w-full items-center">
              {/* Left section: Title + folder name */}
              <div className="flex-1 flex flex-col items-center justify-center">
                    <div className="text-3xl">
                      {key === "A"
                        ? "Queue"
                        : key === "B"
                        ? "In Progress"
                        : "Done"}
                    </div>
                <div className="text-sm text-gray-500 truncate max-w-full px-2">
                  {(folderPaths[key]?.split(/[\\/]/).pop()) || "Not set"}
                </div>
              </div>

              {/* Right button: Pick */}
              <button
                onClick={() => handlePickFolder(key)}
                className="w-20 h-full bg-blue-100 border-l border-blue-400 
                          flex items-center justify-center 
                          hover:bg-blue-200 active:bg-blue-300 
                          transition-colors duration-200"
              >
                <FolderUp size={36} />
              </button>
            </div>

            {/* Folder views */}
            <FolderView
              key         ={key}
              title       ={
                key === "A"
                  ? "Queue (A)"
                  : key === "B"
                  ? "In Progress (B)"
                  : "Done (C)"
              }
              folderId    ={key} // ✅ Needed if the FolderView uses this to track source during drag
              files       ={folders[key]}
              onClickFile ={setSelectedFile}
              // onDragStart ={handleDragFile}
              onDropFile  ={(file, from, originalIndex, dropIndex) =>
                handleDropFile(file, from as FolderKey, key, originalIndex, dropIndex)
              }
              onDeleteFile={handleDeleteFile}


            />
          </div>
        ))}
      </div>

      {/* Metadata modal */}
      <EditFileModal
        file    = {selectedFile}
        onClose = {() => setSelectedFile(null)}
        onSave  = {handleSaveMetadata}
      />    

    </div>
  );
};

export default Data;