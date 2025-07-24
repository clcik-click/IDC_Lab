import { useRef } from "react";
import CollapsibleSection from "../components/CollapsibleSection";

import { Home, BarChart2, StickyNote } from "lucide-react"; 

function Instructions() {
  const setupRef  = useRef<HTMLDivElement>(null);
  const manageRef = useRef<HTMLDivElement>(null);
  const statsRef  = useRef<HTMLDivElement>(null);

  const scrollTo = (ref: React.RefObject<HTMLDivElement>) => {
    ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
<div className="max-w-4xl mx-auto px-4 pb-24 pt-6 space-y-6 text-[--foreground2]">
  <h1 className="text-3xl font-bold text-gray-800 text-center">User Manual</h1>
  <p className="text-gray-500 text-sm text-center">
    Learn how to navigate each part of the application. ~ 2 minute read
  </p>

  {/* 🔷 Intro */}
  <section className="text-gray-600 text-sm bg-blue-50 rounded-lg border border-blue-200 p-6 shadow-sm">
    <p className="mb-2">
      This app was built to support a real-world 3D printing workflow: tracking STL files, managing progress, and visualizing stats. Whether you're a student, instructor, or lab manager, this guide walks you through the core features of the application — from file management to performance tracking — so you can make the most of it.
    </p>
    <p>
      Below you'll find collapsible sections that cover the three main areas of the app: <strong>Main</strong> (file flow), <strong>Dashboard</strong> (visual stats), and <strong>Notes</strong> (reminders and messages).
    </p>
  </section>

  {/* 🔹 Main Section */}
  <section ref={setupRef} className="bg-white border border-gray-200 rounded-md shadow-sm p-4">
    <CollapsibleSection 
      title={
        <span className="inline-flex items-center gap-1">
          <Home className="w-4 h-4" />
          Main
        </span>
      }
    >
      <ul className="list-disc ml-6 text-gray-700 space-y-1">
        <li>Click <strong>Select Folder A/B/C</strong> to assign Queue, In Progress, and Done folders.</li>
        <li>Only <code className="bg-blue-100 px-1 rounded text-sm">.stl</code> files are detected and displayed.</li>
        <li>Drop files into the app or click <strong>Insert File(s)</strong> to add new files to the Queue folder.</li>
        <li>Hovering over the folder button reveals the full folder path on your computer.</li>
        <li>Drag files between folders to reflect their printing status (Queue → In Progress → Done).</li>
        <li>Double-click a file to edit its metadata (only one file editable at a time).</li>
        <li>Click once to select (multi-select supported); selected files are highlighted in blue.</li>
        <li>Duplicate files across folders are highlighted in orange. Moving duplicates triggers auto-renaming.</li>
        <li>When moved to the Done folder, the file’s completion date is updated automatically.</li>
        <li>Click the ❌ icon on a file to delete it from that folder.</li>
      </ul>
    </CollapsibleSection>
  </section>

  {/* 🔹 Dashboard Section */}
  <section ref={manageRef} className="bg-white border border-gray-200 rounded-md shadow-sm p-4">
    <CollapsibleSection 
      title={
        <span className="inline-flex items-center gap-1">
          <BarChart2 className="w-4 h-4" />
          Dashboard
        </span>
      }
    >
      <ul className="list-disc ml-6 text-gray-700 space-y-1">
        <li>Stats are generated from all files in the <strong>Done</strong> folder.</li>
        <li><strong>Daily Files Printed</strong> chart tracks completions over time.</li>
        <li><strong>Top 5 Students</strong> and <strong>Top 5 Classes</strong> show the most frequent entries in metadata.</li>
        <li><strong>Total Parts Printed</strong> is based on quantity per file.</li>
        <li><strong>Average Print Time</strong> is calculated from received and finished timestamps.</li>
        <li><strong>Total Files Displayed</strong>: Only 50 files per folder (max 150) are shown for smoother performance.</li>
        <li>All stats update automatically as files are moved to Done with metadata.</li>
        <li>It’s recommended to create new folders per semester for organized tracking.</li>
      </ul>
    </CollapsibleSection>
  </section>

  {/* 🔹 Notes Section */}
  <section ref={statsRef} className="bg-white border border-gray-200 rounded-md shadow-sm p-4">
    <CollapsibleSection 
      title={
        <span className="inline-flex items-center gap-1">
          <StickyNote className="w-4 h-4" />
          Notes
        </span>
      }
    >
      <ul className="list-disc ml-6 text-gray-700 space-y-1">
        <li>Use notes to jot down thoughts, reminders, or lab observations.</li>
        <li>Click <strong>+ New</strong> to create a new note.</li>
        <li>Click once to view or edit a note. Click ❌ to delete it.</li>
        <li>Notes are simple, local, and great for keeping your team in sync.</li>
      </ul>
    </CollapsibleSection>
  </section>

  {/* 🔸 Conclusion */}
  <section className="text-gray-600 text-sm bg-blue-50 border border-blue-200 rounded-lg p-6 mt-8">
    <p className="mb-2">
      That's it! Now you're equipped to manage, move, and monitor your 3D print workflow from one place. From editing file metadata to tracking top students and print history, this app was designed to stay lightweight, clear, and flexible.
    </p>
    <p className="italic">
      Designed with care by Hoan Lam 🧠💡 — enjoy printing smarter.
    </p>
  </section>

  {/* 💠 Floating Emoji Nav */}
  <div className="sticky bottom-6 inset-x-0 text-center z-50">
    <div className="inline-flex bg-blue-100 border border-blue-300 shadow-md rounded-full py-2 px-4 gap-4 backdrop-blur-md">
      <button
        onClick={() => scrollTo(setupRef)}
        className="text-2xl active:scale-110 transition-transform cursor-pointer"
        title="Setup"
      >
        <Home className="w-5 h-5" />
      </button>
      <button
        onClick={() => scrollTo(manageRef)}
        className="text-2xl active:scale-110 transition-transform cursor-pointer"
        title="Manage Files"
      >
        <BarChart2 className="w-5 h-5" />
      </button>
      <button
        onClick={() => scrollTo(statsRef)}
        className="text-2xl active:scale-110 transition-transform cursor-pointer"
        title="Stats"
      >
        <StickyNote className="w-5 h-5" />
      </button>
    </div>
  </div>
</div>

  );
}

export default Instructions;
