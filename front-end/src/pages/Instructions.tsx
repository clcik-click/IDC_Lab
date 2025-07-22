import { useRef } from "react";
import CollapsibleSection from "../components/CollapsibleSection";

function Instructions() {
  const setupRef  = useRef<HTMLDivElement>(null);
  const manageRef = useRef<HTMLDivElement>(null);
  const statsRef  = useRef<HTMLDivElement>(null);

  const scrollTo = (ref: React.RefObject<HTMLDivElement>) => {
    ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 pb-24 pt-6 space-y-6 text-[--foreground2]">
      <h1 className="text-3xl font-bold text-blue-600 text-center">📝 How to Use the App</h1>
      <p className="text-gray-500 text-sm text-center">
        Learn how to set up folders, manage files, and monitor print activity.
      </p>

      {/* 📁 Setup Section */}
      <div ref={setupRef}>
        <CollapsibleSection title="📁 Setup">
          <ul className="list-disc ml-6 text-gray-700 space-y-1">
            <li>Click <strong>Select Folder A/B/C</strong> to assign folders.</li>
            <li>Only <code className="bg-blue-100 px-1 rounded text-sm">.stl</code> files are detected.</li>
            <li>Drag between folders to reflect progress.</li>
                        <li>Click <strong>Select Folder A/B/C</strong> to assign folders.</li>
            <li>Only <code className="bg-blue-100 px-1 rounded text-sm">.stl</code> files are detected.</li>
            <li>Drag between folders to reflect progress.</li>
                        <li>Click <strong>Select Folder A/B/C</strong> to assign folders.</li>
            <li>Only <code className="bg-blue-100 px-1 rounded text-sm">.stl</code> files are detected.</li>
            <li>Drag between folders to reflect progress.</li>
                        <li>Click <strong>Select Folder A/B/C</strong> to assign folders.</li>
            <li>Only <code className="bg-blue-100 px-1 rounded text-sm">.stl</code> files are detected.</li>
            <li>Drag between folders to reflect progress.</li>
                        <li>Click <strong>Select Folder A/B/C</strong> to assign folders.</li>
            <li>Only <code className="bg-blue-100 px-1 rounded text-sm">.stl</code> files are detected.</li>
            <li>Drag between folders to reflect progress.</li>
                        <li>Click <strong>Select Folder A/B/C</strong> to assign folders.</li>
            <li>Only <code className="bg-blue-100 px-1 rounded text-sm">.stl</code> files are detected.</li>
            <li>Drag between folders to reflect progress.</li>
                        <li>Click <strong>Select Folder A/B/C</strong> to assign folders.</li>
            <li>Only <code className="bg-blue-100 px-1 rounded text-sm">.stl</code> files are detected.</li>
            <li>Drag between folders to reflect progress.</li>
                        <li>Click <strong>Select Folder A/B/C</strong> to assign folders.</li>
            <li>Only <code className="bg-blue-100 px-1 rounded text-sm">.stl</code> files are detected.</li>
            <li>Drag between folders to reflect progress.</li>
            
          </ul>
        </CollapsibleSection>
      </div>

      {/* 🗂️ Managing Files Section */}
      <div ref={manageRef}>
        <CollapsibleSection title="🗂️ Managing Files">
          <ul className="list-disc ml-6 text-gray-700 space-y-1">
            <li>Edit metadata by clicking a file.</li>
            <li>Use the Notes tab for lab reminders.</li>
          </ul>
        </CollapsibleSection>
      </div>

      {/* 📊 Stats & Persistence Section */}
      <div ref={statsRef}>
        <CollapsibleSection title="📊 Stats & Persistence">
          <ul className="list-disc ml-6 text-gray-700 space-y-1">
            <li>View stats in the dashboard.</li>
            <li>Metadata is stored locally using SQLite.</li>
          </ul>
        </CollapsibleSection>
      </div>

      {/* 💠 Floating Emoji Nav */}
      <div className="sticky bottom-6 inset-x-0 text-center z-50">
        <div className="inline-flex bg-blue-100 border border-blue-300 shadow-md rounded-full py-2 px-4 gap-4">
          <button
            onClick={() => scrollTo(setupRef)}
            className="text-2xl active:scale-110 transition-transform cursor-pointer"
            title="Setup"
          >
            📁
          </button>
          <button
            onClick={() => scrollTo(manageRef)}
            className="text-2xl active:scale-110 transition-transform cursor-pointer"
            title="Manage Files"
          >
            🗂️
          </button>
          <button
            onClick={() => scrollTo(statsRef)}
            className="text-2xl active:scale-110 transition-transform cursor-pointer"
            title="Stats"
          >
            📊
          </button>
        </div>
      </div>
    </div>
  );
}

export default Instructions;
