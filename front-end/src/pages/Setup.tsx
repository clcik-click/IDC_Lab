import { useState, useEffect } from "react";
import type { FileItem, FolderKey } from "../types/FileItem";
import FolderView from "../components/FolderView";

declare global {
  interface Window {
    electronAPI: {
      loadData: () => Promise<Record<FolderKey, FileItem[]>>;
      saveData: (data: Record<FolderKey, FileItem[]>) => void;
    };
  }
}

export default function Setup() {
  const [folders, setFolders] = useState<Record<FolderKey, FileItem[]>>({
    A: [
      { id: "file1", name: "Hoan_model.stl", owner: "Hoan" },
      { id: "file2", name: "Cube.stl", owner: "Alice" },
    ],
    B: [{ id: "file3", name: "Rocket.stl", owner: "Bob" }],
    C: [],
  });
  
  useEffect(() => {
    window.electronAPI.loadData().then((data) => {
      setFolders(data);
    });
  }, []);

  useEffect(() => {
    window.electronAPI.saveData(folders);
  }, [folders]);

  const handleDragStart = (
    e: React.DragEvent,
    file: FileItem,
    from: FolderKey
  ) => {
    const payload = JSON.stringify({ file, from });
    e.dataTransfer.setData("text/plain", payload);
  };

  const handleDropFile = (file: FileItem, from: FolderKey, to: FolderKey) => {
    if (from === to) return;

    setFolders((prev) => ({
      ...prev,
      [from]: prev[from].filter((f) => f.id !== file.id),
      [to]: [file, ...prev[to]],
    }));
  };

  return (
    <div className="flex gap-4 p-6">
      {(["A", "B", "C"] as FolderKey[]).map((key) => (
        <FolderView
          key={key}
          title={
            key === "A" ? "Queue (A)" : key === "B" ? "In Progress (B)" : "Done (C)"
          }
          folderId={key}
          files={folders[key]}
          onDropFile={(file, from) => handleDropFile(file, from as FolderKey, key)}
          onDragStart={handleDragStart}
        />
      ))}
    </div>
  );
}
