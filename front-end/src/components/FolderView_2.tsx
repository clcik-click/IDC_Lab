import { useState } from "react";
import type { FileItem, FolderKey } from "../types/FileItem";
import { X } from "lucide-react";

interface FolderViewProps {
  title: string;
  folderId: FolderKey;
  files: FileItem[];
  allFiles: Record<FolderKey, FileItem[]>; // 🆕
  onDropFile: (
    file: FileItem,
    from: FolderKey,
    originalIndex?: number,
    dropIndex?: number
  ) => void;
  onClickFile: (file: FileItem) => void;
  onDeleteFile: (file: FileItem, from: FolderKey) => void;
}

export default function FolderView({
  title,
  folderId,
  files,
  allFiles,
  onDropFile,
  onClickFile,
  onDeleteFile,
}: FolderViewProps) {
  // Highlight state when dragging over the folder
  const [highlight, setHighlight] = useState(false);

  // Index of item being hovered during drag
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Set of selected file IDs (for multi-select)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Toggle select/deselect file
  const toggleSelect = (file: FileItem) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(file.id)) next.delete(file.id);
      else next.add(file.id);
      return next;
    });
  };

  // Clear selection after dropping
  const clearSelection = () => setSelectedIds(new Set());

  // Handle file drag start with multi-select support
  const handleFileDragStart = (
    e: React.DragEvent,
    file: FileItem,
    from: FolderKey,
    index: number
  ) => {
    const selected = files.filter((f) => selectedIds.has(f.id));
    const dragFiles = selected.length > 0 ? selected : [file];
    const indices = dragFiles.map((f) => files.findIndex((x) => x.id === f.id));

    const dragPayload = {
      files: dragFiles,
      from,
      indices,
      primaryIndex: index, // index of the file initially dragged
    };

    e.dataTransfer.setData("text/plain", JSON.stringify(dragPayload));
  };

  // Handle drop event onto this folder view
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setHighlight(false);

    const raw = e.dataTransfer.getData("text/plain");
    if (raw) {
      const { files: droppedFiles, from, indices } = JSON.parse(raw);
      droppedFiles.forEach((file: FileItem, i: number) => {
        const originalIndex = indices?.[i] ?? undefined;
        const dropIndex = hoveredIndex ?? files.length + i;
        onDropFile(file, from, originalIndex, dropIndex);
      });
    }

    setHoveredIndex(null);
    clearSelection();
  };

  const getGlobalDuplicateIds = (
    currentFiles: FileItem[],
    allFolders: Record<FolderKey, FileItem[]>
  ) => {
    const nameCounts = new Map<string, number>();

    for (const key in allFolders) {
      allFolders[key as FolderKey].forEach((file) => {
        nameCounts.set(file.name, (nameCounts.get(file.name) ?? 0) + 1);
      });
    }

    return new Set(
      currentFiles
        .filter((file) => nameCounts.get(file.name)! > 1)
        .map((file) => file.id)
    );
  };

  const globalDuplicateIds = getGlobalDuplicateIds(files, allFiles);

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
            onDragStart={(e) => handleFileDragStart(e, file, folderId, i)}
            onDragOver={(e) => {
              e.preventDefault();
              setHoveredIndex(i);
            }}
            onClick={() => toggleSelect(file)}
            onDoubleClick={() => onClickFile(file)}
            
            className={`relative p-2 mb-2 rounded shadow text-sm cursor-pointer transition
              ${
                globalDuplicateIds.has(file.id)
                  ? "bg-orange-100 ring-2 ring-orange-400"
                  : selectedIds.has(file.id)
                  ? "bg-blue-100 ring-2 ring-blue-400"
                  : "bg-white hover:bg-gray-50"
              }
              ${hoveredIndex === i ? "ring-2 ring-blue-300" : ""}
            `}
            title={`Owner: ${file.owner || "?"}\nClass: ${file.class || "?"}\nQuantity: ${file.quantity ?? "-"}`}
          >
            {file.name}
            <span className="text-gray-500 text-xs block">
              {file.owner || "Owner"} - {file.class || "Class"} - {file.quantity || "Quantity"}
            </span>

            <button
              className="absolute top-1 right-1 text-gray-400 hover:text-red-600 text-sm"
              onClick={(e) => {
                e.stopPropagation();
                onDeleteFile(file, folderId);
              }}
              title="Delete"
            >
              <X size={20} />
            </button>
          </li>

        ))}
      </ul>
    </div>
  );
}
