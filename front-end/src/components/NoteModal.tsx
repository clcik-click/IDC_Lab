import { useState, useEffect } from "react";
import type { Note } from "../types/Types";

interface NoteModalProps {
  note?: Note; // if undefined, it's a new note
  onClose: () => void;
  onSave: (note: Note) => void;
}

function NoteModal({ note, onClose, onSave }: NoteModalProps) {
  const [author, setAuthor] = useState(note?.author || "");
  const [recipient, setRecipient] = useState(note?.recipient || "");
  const [message, setMessage] = useState(note?.message || "");

  useEffect(() => {
    setAuthor(note?.author || "");
    setRecipient(note?.recipient || "");
    setMessage(note?.message || "");
  }, [note]);

  const handleSave = () => {
    const trimmedMsg = message.trim();
    const trimmedAuthor = author.trim();
    const trimmedRecipient = recipient.trim();

    if (!trimmedMsg || !trimmedAuthor || !trimmedRecipient) return;

    const updatedNote: Note = {
      id:           note?.id || crypto.randomUUID(),
      author:       trimmedAuthor,
      recipient:    trimmedRecipient,
      message:      trimmedMsg,
      dateCreated:  note?.dateCreated || new Date().toISOString(),
    };

    onSave(updatedNote);
    onClose();
  };

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-white/30 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
        <h2 className="text-lg font-semibold mb-4">
          {note ? "Edit Note" : "New Note"}
        </h2>

        {/* From */}
        <label className="block text-sm mb-1 text-gray-600 font-medium">
          From
        </label>
        <input
          type="text"
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          placeholder="Enter your name"
          className="w-full border rounded p-2 mb-4"
        />

        {/* To */}
        <label className="block text-sm mb-1 text-gray-600 font-medium">
          To
        </label>
        <input
          type="text"
          value={recipient}
          onChange={(e) => setRecipient(e.target.value)}
          placeholder="Enter recipient name"
          className="w-full border rounded p-2 mb-4"
        />

        {/* Message */}
        <label className="block text-sm mb-1 text-gray-600 font-medium">
          Message
        </label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          maxLength={140}
          rows={3}
          className="w-full border rounded p-2 resize-none"
          placeholder="Enter message (max 140 characters)"
        />
        <div className="text-right text-xs text-gray-500 mb-4">
          {message.length}/140
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-1 rounded text-sm bg-gray-200 hover:bg-gray-300"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!author.trim() || !recipient.trim() || !message.trim()}
            className="px-4 py-1 rounded text-sm bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

export default NoteModal;
