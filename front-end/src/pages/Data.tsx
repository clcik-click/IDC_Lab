import type { FileItem, FolderKey} from "../types/FileItem";
import { useEffect, useState } from "react";
import { FolderUp } from "lucide-react";
import FolderView from "../components/FolderView_2";

declare global {
  interface window{
    electronAPI: {
        loadConfig:   () => Promise<Record<FolderKey, string>>;
        saveConfig:   (paths: Record<FolderKey, string>) => void;
        loadData:     () => Promise<Record<FolderKey, FileItem[]>>;
        scanFolders:  (paths: Record<FolderKey, string>) => Promise<Record<FolderKey, FileItem[]>>;
        pickFolder:   () => Promise<string | null>;

        // Why params: { name: string} > params is a dictionary > param without s
        moveFile:     (params: { name: string }) => Promise<{ success: boolean; error?: string }>; 
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
  const handleDragFile = (e: React.DragEvent, file: FileItem, from: FolderKey, index: number) => {
    const payload = JSON.stringify({ file, from, index });
    console.log("Dragging file:", file.name, "from:", from, "index:", index);
    console.log("Payload:", payload);
    e.dataTransfer.setData("text/plain", payload);
  }

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
              onDragStart ={handleDragFile}
              onDropFile  ={(file, from, originalIndex, dropIndex) =>
                handleDropFile(file, from as FolderKey, key, originalIndex, dropIndex)
              }
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default Data;