import type { FileItem, FolderKey } from "../types/FileItem";

interface FolderViewProps {
  title: string;
  files: FileItem[];
  folderId: FolderKey;
  onDropFile: (file: FileItem, from: FolderKey) => void;
  onDragStart: (e: React.DragEvent, file: FileItem, from: FolderKey) => void;
  onClickFile: (file: FileItem) => void;
}

export default function FolderView({
  title,
  files,
  folderId,
  onDropFile,
  onDragStart,
  onClickFile,
}: FolderViewProps) {

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const data = e.dataTransfer.getData("text/plain");
    const parsed = JSON.parse(data);
    onDropFile(parsed.file, parsed.from);
  };

  return (
    <div
      className="flex-1 min-w-[200px] p-4 border rounded bg-gray-100"
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
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
            title={`
              Owner: ${file.owner || "?"}
              Class: ${file.class || "?"}
              Priority: ${file.priority ?? "-"}
              Notes: ${file.notes || ""}`}
            >
            {file.name}
            <span className="text-gray-500 text-xs block">
              ({file.owner || "Unknown"})
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
