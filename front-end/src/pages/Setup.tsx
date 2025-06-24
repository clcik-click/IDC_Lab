import { useState, useEffect } from "react";
import type { FileItem, FolderKey } from "../types/FileItem";
import FolderView from "../components/FolderView";
import EditFileModal from "../components/EditFileModal";

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
    A: [],
    B: [],
    C: [],
  });

  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);

  useEffect(() => {
    window.electronAPI.loadData().then(setFolders);
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

  const handleDropFile = (
    file: FileItem,
    from: FolderKey,
    to: FolderKey
  ) => {
    if (from === to) return;
    setFolders((prev) => ({
      ...prev,
      [from]: prev[from].filter((f) => f.id !== file.id),
      [to]: [file, ...prev[to]],
    }));
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
  };

  return (
    <div className="flex gap-4 p-6">
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
          onDropFile={(file, from) => handleDropFile(file, from as FolderKey, key)}
          onDragStart={handleDragStart}
          onClickFile={(file) => setSelectedFile(file)}
        />
      ))}

      <EditFileModal
        file={selectedFile}
        onClose={() => setSelectedFile(null)}
        onSave={handleSaveMetadata}
      />
    </div>
  );
}