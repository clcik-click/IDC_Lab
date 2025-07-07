import type { FileItem } from "../types/FileItem";
import { useState, useEffect } from "react";
import { Pencil, X } from "lucide-react"; // optional icons if you use lucide

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
    <div className="fixed inset-0 backdrop-blur-sm bg-white/30 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-xl shadow-lg w-[400px] space-y-4 relative">
        <button onClick={onClose} className="absolute top-2 right-2 text-gray-500 hover:text-black">
          <X size={20} />
        </button>

        <h2 className="text-2xl font-semibold flex items-center gap-2">
          <Pencil size={20} /> Edit Metadata
        </h2>

        <p className="text-sm text-gray-500">
             File Name: {form.name || "Unknown"}
        </p>

        {[
          ["Owner", "owner"],
          ["Email", "email"],
          ["Quantity", "quantity"],
          ["Class", "class"],
          ["Notes", "notes"],
        ].map(([label, key]) => (
          <label key={key} className="block text-sm">
            <span className="text-gray-600">{label}</span>
            <input
              type={key === "quantity" ? "number" : "text"}
              value={(form as any)[key] ?? ""}
              onChange={(e) => setForm({ ...form, [key]: e.target.value })}
              className="w-full mt-1 border rounded px-2 py-1"
            />
          </label>
        ))}
 
        <p className="text-sm text-gray-500">
             Received: {new Date(form.dateReceived).toLocaleString()}
        </p>

        <p className="text-sm text-gray-500">
             Size: {(form.size).toLocaleString()} bytes
        </p>

        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="px-4 py-1 rounded bg-gray-300 hover:bg-gray-400">
            Cancel
          </button>
          <button
            onClick={() => form && onSave(form)}
            className="px-4 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
