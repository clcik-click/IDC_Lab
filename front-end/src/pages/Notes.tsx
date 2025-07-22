import { useEffect, useState } from "react";
import NoteView from "../components/NoteView";
import NoteModal from "../components/NoteModal";
import type { Note } from "../types/Types";

function Notes() {
  const [notes, setNotes]               = useState<Note[]>([]);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [isCreating, setIsCreating]     = useState(false);

  // Load notes from DB on mount
  useEffect(() => {
    window.electronAPI.getNotesFromDB().then((loadedNotes) => {
      setNotes(loadedNotes);
    });
  }, []);

  const handleSave = async (updatedNote: Note) => {
    const res = await window.electronAPI.saveNoteToDB(updatedNote);
    if (res.success) {
      setNotes((prev) =>
        prev.some((n) => n.id === updatedNote.id)
          ? prev.map((n) => (n.id === updatedNote.id ? updatedNote : n))
          : [...prev, updatedNote]
      );
    } else {
      console.error("Failed to save note:", res.error);
    }
  };

  const handleDelete = async (id: string) => {
    const res = await window.electronAPI.deleteNoteFromDB(id);
    if (res.success) {
      setNotes((prev) => prev.filter((n) => n.id !== id));
      if (selectedNote?.id === id) setSelectedNote(null);
    } else {
      console.error("Failed to delete note:", res.error);
    }
  };

  return (
    <div className="p-6 flex flex-col items-center min-h-screen bg-[--surface] text-[var(--foreground2)]">
      <div className="w-full max-w-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center border border-gray-300 rounded-md bg-white h-20 shadow-sm">
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="text-xl font-semibold text-gray-800">Notes</div>
            <div className="text-sm text-gray-500">All lab messages</div>
          </div>

          <button
            onClick={() => setIsCreating(true)}
            className="w-28 h-full bg-blue-100 border-l border-blue-300 
                      flex items-center justify-center 
                      hover:bg-blue-200 active:bg-blue-300 
                      transition-colors duration-200 rounded-r-md text-blue-600 font-medium"
            title="Add new note"
          >
            + New
          </button>
        </div>

        {/* Notes List */}
        <NoteView
          notes={notes}
          onClickNote={setSelectedNote}
          onDeleteNote={handleDelete}
        />
      </div>

      {/* Edit Existing Note */}
      {selectedNote && (
        <NoteModal
          note    ={selectedNote}
          onClose ={() => setSelectedNote(null)}
          onSave  ={handleSave}
        />
      )}

      {/* New Note Modal */}
      {isCreating && (
        <NoteModal
          onClose={() => setIsCreating(false)}
          onSave={(newNote) => {
            handleSave(newNote);
            setIsCreating(false);
          }}
        />
      )}
    </div>
  );
}

export default Notes;
