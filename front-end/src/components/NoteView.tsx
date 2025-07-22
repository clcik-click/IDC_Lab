import { X } from "lucide-react";
import type { Note } from "../types/Types";

interface NoteViewProps {
  notes: Note[];
  onClickNote: (note: Note) => void;
  onDeleteNote: (id: string) => void;
}

function NoteView({ notes, onClickNote, onDeleteNote }: NoteViewProps) {
  return (
    <div className="flex-1 min-w-[200px] p-4 border rounded bg-gray-100 h-[80vh] overflow-scroll border-gray-300 transition-colors duration-200">
      <ul className="space-y-2">
        {notes.map((note, i) => (
          <li
            key={note.id}
            onClick={() => onClickNote(note)}
            className={`relative p-3 rounded-md text-sm cursor-pointer transition-all duration-200 shadow-sm bg-white hover:bg-gray-50 active:scale-[0.98]`}
          >
            {/* Delete Button */}
            <button
              className="absolute top-1 right-1 text-gray-400 hover:text-red-600"
              onClick={(e) => {
                e.stopPropagation();
                onDeleteNote(note.id);
              }}
              title="Delete"
            >
              <X size={20} />
            </button>

            {/* Top Row: Label + Date */}
            <div className="flex text-xs text-gray-500 mb-1">
              <span>{new Date(note.dateCreated).toLocaleDateString()}</span>
            </div>

            {/* Note Fields */}
            <div className="text-sm text-[var(--foreground2)] space-y-1">
              <div>
                <span className="font-semibold text-[--muted]">From: </span>
                {note.author || "Unknown"}
              </div>
              <div>
                <span className="font-semibold text-[--muted]">To: </span>
                {note.recipient}
              </div>
              <div>
                <span className="font-semibold text-[--muted]">Message: </span>
                {note.message}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default NoteView;
