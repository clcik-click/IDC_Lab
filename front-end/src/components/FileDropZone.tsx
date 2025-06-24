import { useState } from "react";

export default function FileDropZone() {
  const [files, setFiles] = useState<File[]>([]);

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();

    const droppedFiles = Array.from(e.dataTransfer.files);
    if (droppedFiles.length > 0) {
      // Add new files to the front of the list
      setFiles(prev => [...droppedFiles, ...prev]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); // Necessary to allow dropping
  };

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      className="w-full min-h-[200px] p-4 border-2 border-dashed rounded-lg border-gray-400 flex flex-col items-center justify-center text-gray-500"
    >
      <p>Drop your files here</p>
      <ul className="mt-4 w-full">
        {files.map((file, index) => (
          <li key={index} className="text-sm text-black bg-gray-100 p-2 my-1 rounded">
            {file.name}
          </li>
        ))}
      </ul>
    </div>
  );
}
