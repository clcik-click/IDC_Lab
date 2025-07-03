import { useState } from "react";
import type { FileItem, FolderKey } from "../types/FileItem";

interface FolderViewProps {
  title: string;
  folderId: FolderKey;
  files: FileItem[];
  onDropFile: (
    file: FileItem,
    from: FolderKey,
    originalIndex?: number,
    dropIndex?: number
  ) => void;
  onDragStart: (
    e: React.DragEvent,
    file: FileItem,
    from: FolderKey,
    index: number
  ) => void;
  onClickFile: (file: FileItem) => void;
}

export default function FolderView({
  title,
  folderId,
  files,
  onDropFile,
  onDragStart,
  onClickFile,
}: FolderViewProps) {
  const [highlight, setHighlight] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setHighlight(false);

    const raw = e.dataTransfer.getData("text/plain");
    if (raw) {
      const { file, from, index: originalIndex } = JSON.parse(raw);
      onDropFile(file, from, originalIndex, hoveredIndex ?? files.length);
    }
    setHoveredIndex(null);
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
      onDragLeave={() => {
        setHighlight(false);
        setHoveredIndex(null);
      }}
      onDrop={handleDrop}
    >
      <h2 className="text-lg font-semibold mb-2">{title}</h2>
      <ul>
        {files.map((file, i) => (
          <li
            key={file.id}
            draggable
            onDragStart={(e) => onDragStart(e, file, folderId, i)}
            onDragOver={(e) => {
              e.preventDefault();
              setHoveredIndex(i);
            }}
            onClick={() => onClickFile(file)}
            className={`p-2 mb-2 bg-white rounded shadow text-sm cursor-pointer hover:bg-gray-50 ${
              hoveredIndex === i ? "ring-2 ring-blue-300" : ""
            }`}
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
