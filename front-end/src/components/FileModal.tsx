import { useState, useEffect, useMemo } from "react";
import type { File }  from "../types/Types";
import { Pencil, X }  from "lucide-react";
import { useFolders } from "../context/FolderContext";

interface FileModalProps {
  file:     File | null;
  onClose:  () => void;
  onSave:   (updatedFile: File) => void;
}

export default function FileModal({ file, onClose, onSave }: FileModalProps) {
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

  const allPrinters  = ["R1", "R2", "R3", "R4", "R5"];
  const allMaterials = ["PLA", "ABS", "PETG", "TPU"];

  const [form, setForm] = useState<File | null>(file);

  useEffect(() => {
    setForm(file);
  }, [file]);

  if (!form) return null;

  const handleChange = (key: keyof File, value: string | number) => {
    setForm(prev => prev ? { ...prev, [key]: value } : prev);
  };

  function DropdownRow({
    label,
    baseKey,
    options,
  }: {
    label:    string;
    baseKey:  string;
    options:  string[];
  }) {
    return (
      <label className="block text-sm ">
        <span className="text-gray-600">{label}</span>
        <div className="flex gap-2 mt-1">
          {[1, 2, 3, 4, 5].map((i) => {
            const key = `${baseKey}${i}` as keyof File;
            return (
              <select
                key       ={key}
                value     ={form[key] ?? ""}
                onChange  ={(e) => handleChange(key, e.target.value)}
                className ="w-24 border rounded px-1 py-1 text-sm"
              >
                <option value="">—</option>
                {options.map((val) => (
                  <option key={val} value={val}>
                    {val}
                  </option>
                ))}
              </select>
            );
          })}
        </div>
      </label>
    );
  }

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-white/30 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-xl shadow-lg w-[400px] space-y-2 relative">
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

{/* Editable Fields with Suggestions — excluding "Notes" */}
{([
  ["Owner", "owner", owners],
  ["Email", "email", emails],
  ["Quantity", "quantity", []],
  ["Class", "class", classes],
] as const).map(([label, key, suggestions]) => {
  const isNumber   = key === "quantity";
  const datalistId = `datalist-${key}`;

  return (
    <label key={key} className="block text-sm mb-3">
      <span className="text-gray-600 font-medium">{label}</span>
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

{/* Notes textarea styled like Message box */}
<div className="flex justify-between items-center mb-1">
  <label className="text-sm text-gray-600 font-medium">Notes</label>
  <div className="text-xs text-gray-500">
    {(form.notes?.length ?? 0)}/140
  </div>
</div>
<textarea
  value={form.notes ?? ""}
  onChange={(e) => handleChange("notes", e.target.value)}
  maxLength={140}
  rows={3}
  className="w-full border rounded p-2 resize-none"
  placeholder="Enter notes (max 140 characters)"
/>


        <DropdownRow label="Printers"  baseKey="printer"  options={allPrinters} />
        <DropdownRow label="Materials" baseKey="material" options={allMaterials} />

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
