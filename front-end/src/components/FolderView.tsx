import type { File, Folder } from "../types/Types";
import { useFolders } from "../context/FolderContext";
import { useState, useEffect } from "react";
import { X } from "lucide-react";

interface FolderViewProps {
  folder: Folder;
  files: File[];
  onDropFile: (
    file: File,
    from: Folder,
    originalIndex?: number,
    dropIndex?: number
  ) => void;
  onClickFile: (file: File) => void;
  onDeleteFile: (file: File, from: Folder) => void;
}

export default function FolderView({
  folder,
  files,
  onDropFile,
  onClickFile,
  onDeleteFile,
}: FolderViewProps) {

  // global folders { A: [], B: [], C: [] }
  const { folders }                     = useFolders();

  // Highlight state when dragging over the folder
  const [highlight, setHighlight]       = useState(false);

  // Index of item being hovered during drag
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Creating a React state that holds a Set of strings
  // Set<string>: A built-in JavaScript data stucture for unque strings (no duplicates).
  // new Set():   Initializes the staet with an empty set
  // Set { "abc123", "def456", "xyz789" }
  const [selectedIds, setSelectedIds]   = useState<Set<string>>(new Set());

  ////////////////////////////////////////////////////////////////////////
  const toggleSelect = (file: File) => {
    setSelectedIds((prev) => {
        // React needs a new reference to detect state changes.
        // Directly modifying the existing Set won't trigger re-renders
        const next = new Set(prev);

        // Toggle select/deselect file(s)
        (next.has(file.id)) ? next.delete(file.id) : next.add(file.id);
      return next;
    });
  };

  // Clear selection after dropping
  const clearSelection = () => setSelectedIds(new Set());
  ////////////////////////////////////////////////////////////////////////


  ////////////////////////////////////////////////////////////////////////
  // Handle file drag with multi-select support
  // The dragged file is not selected (no blue) > drag just 1 file
  // The dragged file is selected (blue highlighted) > drag all selected files
  // Package file(s) information for dataTransfer
  const handleFileDragStart = (
    e:      React.DragEvent,
    file:   File,
    from:   Folder,
    index:  number
  ) => {
    const selected  = files.filter((f) => selectedIds.has(f.id));
    const dragFiles = selected.length > 0 ? selected : [file];
    const indices   = dragFiles.map((f) => files.findIndex((x) => x.id === f.id));

    const dragPayload = {
      files: dragFiles,
      from,
      indices,
      primaryIndex: index, // index of the file initially dragged
    };

    e.dataTransfer.setData("text/plain", JSON.stringify(dragPayload));
  };

  // Handle drop event onto this folder view
  // Unpack file(s) information from dataTransfer
  // Call onDropFile for moving file at the back-end and metadata
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setHighlight(false);

    const raw = e.dataTransfer.getData("text/plain");
    if (raw) {
      const { files: droppedFiles, from, indices } = JSON.parse(raw);
      droppedFiles.forEach((file: File, i: number) => {
        const originalIndex = indices?.[i] ?? undefined;
        const dropIndex     = hoveredIndex ?? files.length + i;
        onDropFile(file, from, originalIndex, dropIndex);
      });
    }

    setHoveredIndex(null);
    clearSelection();
  };
  ////////////////////////////////////////////////////////////////////////

  const getGlobalDuplicateIds = (
    currentFiles: File[],
    folders:      Record<Folder, File[]>
  ) => {
    const nameCounts = new Map<string, number>();

    for (const key in folders) {
      folders[key as Folder].forEach((file) => {
        nameCounts.set(file.name, (nameCounts.get(file.name) ?? 0) + 1);
      });
    }
    // {
    // 0:{"File_15.stl" => 1}
    // 1:{"File_16.stl" => 2}
    // ...
    // }

    // Return a set of duplication(s)
    return new Set(
      currentFiles
        .filter((file) => nameCounts.get(file.name)! > 1)
        .map((file) => file.id)
    );
  };

  const globalDuplicateIds = getGlobalDuplicateIds(files, folders);

  return (
    <div className={`flex-1 min-w-[200px] p-4 border rounded bg-gray-100 h-[80vh] overflow-scroll transition-colors duration-200
        ${highlight ? "border-blue-500 bg-blue-50" : "border-gray-300"}
      `}
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
      <ul className="space-y-2">
        {files.map((file, i) => (
          <li
            key={file.id}
            draggable
            onDragStart={(e) => handleFileDragStart(e, file, folder, i)}
            onDragOver={(e) => {
              e.preventDefault();
              setHoveredIndex(i);
            }}
            onClick={() => toggleSelect(file)}
            onDoubleClick={() => onClickFile(file)}
            className={`relative p-3 rounded-md text-sm cursor-pointer transition-all duration-200 shadow-sm
              ${
                globalDuplicateIds.has(file.id)
                  ? "bg-orange-100 ring-2 ring-orange-400"
                  : selectedIds.has(file.id)
                  ? "bg-blue-100 ring-2 ring-blue-400"
                  : "bg-white hover:bg-gray-50"
              }
              ${hoveredIndex === i ? "ring-2 ring-blue-300 scale-[1.01]" : ""}
              active:scale-[0.98] drag-shadow
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
                onDeleteFile(file, folder);
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
