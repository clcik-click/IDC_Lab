// components/EditFileModal.tsx
import type { FileItem } from "../types/FileItem";
import { useState, useEffect } from "react";

interface EditFileModalProps {
  file: FileItem | null;
  onClose: () => void;
  onSave: (updatedFile: FileItem) => void;
}

export default function EditFileModal({ file, onClose, onSave }: EditFileModalProps) {
  const [form, setForm] = useState<FileItem | null>(file);

  useEffect(() => {
    setForm(file);
  }, [file]);

  if (!form) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-96">
        <h2 className="text-xl font-semibold mb-4">Edit File</h2>

        <label className="block mb-2">
          <span className="text-sm text-gray-600">File Name</span>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full border px-2 py-1 rounded"
          />
        </label>

        <label className="block mb-2">
          <span className="text-sm text-gray-600">Owner</span>
          <input
            type="text"
            value={form.owner}
            onChange={(e) => setForm({ ...form, owner: e.target.value })}
            className="w-full border px-2 py-1 rounded"
          />
        </label>

        <div className="flex justify-end mt-4 gap-2">
          <button onClick={onClose} className="px-4 py-1 bg-gray-300 rounded">
            Cancel
          </button>
          <button
            onClick={() => form && onSave(form)}
            className="px-4 py-1 bg-blue-500 text-white rounded"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
