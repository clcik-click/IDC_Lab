import { useState, useEffect, useMemo } from "react";
import type { File }  from "../types/Types";
import { Pencil, X }  from "lucide-react";
import { useFolders } from "../context/FolderContext";

interface EditFileModalProps {
  file:     File | null;
  onClose:  () => void;
  onSave:   (updatedFile: File) => void;
}

export default function EditFileModal({ file, onClose, onSave }: EditFileModalProps) {
  const { folders } = useFolders();

  // update when const folders changes
  // allFiles = [File1, File2, File3,...]
  const allFiles    = useMemo(() => Object.values(folders).flat(), [folders]);

 
  // allFiles.map(f => f.owner) ~ pulls the owner filed from every file
  // .filter(Boolean)           ~ removes falsy values (null, undefined, "", false, etc)
  // Set                        ~ removes duplication
  // [...new Set(...)]          ~ converts set to array
  // useMemo(..., [allFiles])   ~ re-runs when "allFiles" changes
  const owners  = useMemo(() => [...new Set(allFiles.map(f => f.owner).filter(Boolean))], [allFiles]);
  const emails  = useMemo(() => [...new Set(allFiles.map(f => f.email).filter(Boolean))], [allFiles]);
  const classes = useMemo(() => [...new Set(allFiles.map(f => f.class).filter(Boolean))], [allFiles]);

  const [form, setForm] = useState<File | null>(file);

  useEffect(() => {
    setForm(file);
  }, [file]);

  if (!form) return null;

  const handleChange = (key: keyof File, value: string | number) => {
    setForm(prev => prev ? { ...prev, [key]: value } : prev);
  };

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-white/30 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-xl shadow-lg w-[400px] space-y-4 relative">
        {/* Close Button */}
        <button onClick={onClose} className="absolute top-2 right-2 text-gray-500 hover:text-black">
          <X size={20} />
        </button>

        {/* Title */}
        <h2 className="text-2xl font-semibold flex items-center gap-2">
          <Pencil size={20} /> Edit Metadata
        </h2>

        {/* File Name */}
        <p className="text-sm text-gray-500">File Name: {form.name || "Unknown"}</p>

        {/* Editable Fields with Suggestions */}
        {([
          ["Owner", "owner", owners],
          ["Email", "email", emails],
          ["Quantity", "quantity", []],
          ["Class", "class", classes],
          ["Notes", "notes", []],
        ] as const).map(([label, key, suggestions]) => {
          const isNumber = key === "quantity";
          const datalistId = `datalist-${key}`;

          return (
            <label key={key} className="block text-sm">
              <span className="text-gray-600">{label}</span>
              <input
                type={isNumber ? "number" : key === "email" ? "email" : "text"}
                value={(form[key] as string | number) ?? ""}
                onChange={(e) =>
                  handleChange(key, isNumber ? Number(e.target.value) : e.target.value)
                }
                className="w-full mt-1 border rounded px-2 py-1"
                list={suggestions.length > 0 ? datalistId : undefined}
                autoComplete="off"
              />
              {suggestions.length > 0 && (
                <datalist id={datalistId}>
                  {suggestions.map((val) => (
                    <option key={val} value={val} />
                  ))}
                </datalist>
              )}
            </label>
          );
        })}

        {/* Date Info */}
        <p className="text-sm text-gray-500">
          Received: {new Date(form.dateReceived).toLocaleString()}
        </p>
        <p className="text-sm text-gray-500">
          Finished: {form.dateFinished ? new Date(form.dateFinished).toLocaleString() : "In progress"}
        </p>

        {/* Action Buttons */}
        <div className="flex justify-end gap-2 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-1 rounded bg-gray-300 hover:bg-gray-400"
          >
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
