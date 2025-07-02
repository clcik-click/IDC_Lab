import { useState } from "react";
import type { FileItem, FolderKey } from "../types/FileItem";

interface FolderViewProps {
  title: string;
  files: FileItem[];
  folderId: FolderKey;
  onDropFile: (file: FileItem, from: FolderKey) => void;
  onDragStart: (e: React.DragEvent, file: FileItem, from: FolderKey) => void;
  onClickFile: (file: FileItem) => void;
  folderPaths?: Record<FolderKey, string>; // needed for import
  onRefresh?: () => void; // refresh UI after import
}

export default function FolderView({
  title,
  files,
  folderId,
  onDropFile,
  onDragStart,
  onClickFile,
  folderPaths,
  onRefresh,
}: FolderViewProps) {
  const [highlight, setHighlight] = useState(false);

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setHighlight(false);

    const filesArray = Array.from(e.dataTransfer.files);
    console.log("🔽 Dropped files:", filesArray);

    filesArray.forEach((file) => {
      console.log(" - Name:", file.name, "Path:", (file as any).path);
    });

    console.log("🔽 Is Electron:", typeof window?.electronAPI !== "undefined");
    console.log("ElectronAPI:", window.electronAPI);
    console.log("e.dataTransfer.types:", e.dataTransfer.types);

    for (const file of filesArray) {
      console.log(" - name:", file.name);
      console.log(" - type:", file.type);
      console.log(" - size:", file.size);
      console.log(" - path:", (file as any).path); // ← this should not be undefined
    }

    // External file drop (from OS)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const filesArray = Array.from(e.dataTransfer.files);
      const stlFiles = filesArray.filter(
        (f) =>
          f.name.toLowerCase().endsWith(".stl") &&
          typeof (f as any).path === "string"
      );

      for (const file of stlFiles) {
        const sourcePath = (file as any).path;
        if (!sourcePath) continue;

        await window.electronAPI.importFile({
          from: sourcePath,
          name: file.name,
          toFolder: folderId,
          folderPaths: folderPaths!,
        });
      }

      if (onRefresh) onRefresh();
      return;
    }

    // Internal drag-and-drop
    const raw = e.dataTransfer.getData("text/plain");
    if (raw) {
      const { file, from } = JSON.parse(raw);
      onDropFile(file, from);
    }
  };

  return (
    <div
      className={`flex-1 min-w-[200px] p-4 border rounded bg-gray-100 h-[80vh] overflow-scroll transition ${
        highlight ? "border-blue-500 bg-blue-50" : ""
      }`}
      onDragOver={(e) => {
        e.preventDefault();
        setHighlight(true);
      }}
      onDragLeave={() => setHighlight(false)}
      onDrop={handleDrop}
    >
      <h2 className="text-lg font-semibold mb-2">{title}</h2>
      <ul>
        {files.map((file) => (
          <li
            key={file.id}
            draggable
            onDragStart={(e) => onDragStart(e, file, folderId)}
            onClick={() => onClickFile(file)}
            className="p-2 mb-2 bg-white rounded shadow text-sm cursor-pointer hover:bg-gray-50"
            title={`Owner: ${file.owner || "?"}\nClass: ${file.class || "?"}\nPriority: ${file.priority ?? "-"}`}
          >
            {file.name}
            <span className="text-gray-500 text-xs block">
              {file.owner || "Name"} - {file.class || "Class"} - {file.priority || "Priority"}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
