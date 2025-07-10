import type { FileItem, FolderKey} from "../types/FileItem";
import { useEffect, useState } from "react";
import { FolderUp } from "lucide-react";
import FolderView from "../components/FolderView";
import EditFileModal from "../components/EditFileModal";
import { useFolders } from "../context/FolderContext";

declare global {
  interface Window {
    electronAPI: {
      // File paths
      pickFolder: () => Promise<string | null>;
      loadConfig: () => Promise<Record<FolderKey, string>>;
      saveConfig: (paths: Record<FolderKey, string>) => void;
      setFolderPaths?: (paths: Record<FolderKey, string>) => void;

      // File metadata
      saveData: (data: {
        folders: Record<FolderKey, FileItem[]>;
        folderPaths: Record<FolderKey, string>;
      }) => void;

      scanFolders: (
        paths: Record<FolderKey, string>
      ) => Promise<Record<FolderKey, FileItem[]>>;

      moveFile: (params: {
        name: string;
        from: FolderKey;
        to: FolderKey;
        folderPaths: Record<FolderKey, string>;
      }) => Promise<{ success: boolean; newName?: string; error?: string }>;

      deleteFile: (params: {
        name: string;
        folder: FolderKey;
        folderPaths: Record<FolderKey, string>;
      }) => Promise<{ success: boolean; error?: string }>;

      importFileBuffer?: (params: {
        name: string;
        buffer: number[];
        toFolder: FolderKey;
        folderPaths: Record<FolderKey, string>;
      }) => Promise<{ success: boolean; error?: string }>;

      // Stats for Test tab
      getStatsFromDB: () => Promise<{
        totalPrinted: number;
        totalPartsPrinted: number;
        avgPrintTime: string;
        topStudents: { owner: string; count: number }[];
        topClasses: { class: string; count: number }[];
        trendData: { day: string; count: number }[];
      }>;
    };
  }
}


function Main() {
  const { folders, setFolders } = useFolders();
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
      // ✅ Tell backend the folder paths for global use (e.g., in stats)
      window.electronAPI.setFolderPaths(folderPaths);

      // ✅ Then scan the folders to update metadata in UI
      window.electronAPI.scanFolders(folderPaths).then((scanned) => {
        console.log("📂 Scanned folders:", scanned);
        setFolders(scanned);
      });
    }
  }, [folderPaths, configReady]);



  // Step 3: Save updated metadata when folders change
  useEffect(() => {
    const isEmpty = Object.values(folders).every(arr => arr.length === 0);
    if (!isEmpty) {
      window.electronAPI.saveData({ folders, folderPaths });
      // console.log("💾 Saved metadata:", folders);
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
            // console.log(`✅ Imported: ${file.name}`);
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
      // console.log(`updated folder path for ${key}:`, selected);
      setFolderPaths(updated);
      window.electronAPI.saveConfig(updated);
    }
  }

  // Handle dropping a file
  const handleDropFile = async (
    file: FileItem,
    from: FolderKey,
    to: FolderKey,
    originalIndex?: number,
    dropIndex?: number
  ) => {
    // Reordering within same folder
    if (from === to && originalIndex != null && dropIndex != null) {
      setFolders(prev => {
        const files = [...prev[to]];
        const [moved] = files.splice(originalIndex, 1);
        files.splice(dropIndex, 0, moved);
        return {
          ...prev,
          [to]: files,
        };
      });
      return;
    }

    const result = await window.electronAPI.moveFile({
      name: file.name,
      from,
      to,
      folderPaths
    });

    if (result.success) {
      const newName = result.newName ?? file.name;
      const newId = newName !== file.name ? `${to}-${newName}` : file.id;

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

      setFolders(prev => ({
        ...prev,
        [from]: prev[from].filter((f) => f.id !== file.id),
        [to]: [updatedFile, ...prev[to]],
      }));
    }
  };

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
      // console.log("✅ File deleted:", file.name);
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
            title={`${folderLabel} (${key})`}
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
    file={selectedFile}
    onClose={() => setSelectedFile(null)}
    onSave={handleSaveMetadata}
  />
</div>


  );
};

export default Main;