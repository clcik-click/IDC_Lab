import type { FileItem, FolderKey} from "../types/FileItem";
import { useEffect, useState } from "react";

declare global {
  interface window{
    electronAPI: {
        pickFolder: () => Promise<string | null>;
        saveConfig: (paths: Record<FolderKey, string>) => void;
        loadConfig: () => Promise<Record<FolderKey, string>>;
    }
  }
}

function Data() {
  const [folderPaths, setFolderPaths] = useState<Record<FolderKey, string>>({A: "", B: "", C: "",});
  const [configReady, setConfigReady] = useState(false);

  useEffect(() => {
    window.electronAPI.loadConfig().then((config) => {
      setFolderPaths(config);
      // console.log("Loaded folder paths:", config);
      setConfigReady(true);
    });
  }, []);

  // Select folder paths
  const handlePickFolder = async (key: FolderKey) => {
    const selected = await window.electronAPI.pickFolder();
    if (selected) {
      const updated = { ...folderPaths, [key]: selected };
      console.log(updated)
      setFolderPaths(updated);
      window.electronAPI.saveConfig(updated);
    }
  }

  return (
    <div className="p-6 space-y-6"> 

    {/* Drop Area */}
      <div id="drop-area" className="text-center w-full h-full border-2 border-dashed p-4">
        Drop here
      </div>

      <div className="flex gap-4">
        {(["A", "B", "C"] as FolderKey[]).map((key) => (
          <div key={key} className="flex-1 space-y-2">
            {/* Folder picker controls */}
            <div className="space-y-1 text-sm flex flex-col items-center">
              <button
                onClick={() => handlePickFolder(key)}
                className="px-3 py-1 rounded bg-blue-600 text-white text-sm"
              >
                Select Folder {key}
              </button>
              <div className="text-gray-500 truncate text-center w-full">
                {folderPaths[key] || "Not set"}
              </div>
            </div>

            {/* Folder views */}
            {/* <FolderView
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
              folderPaths={folderPaths}
              onRefresh={() => {
                window.electronAPI.scanFolders(folderPaths).then(setFolders);
              }}
            /> */}
          </div>
        ))}


      </div>

      
    </div>
  );
};

export default Data;