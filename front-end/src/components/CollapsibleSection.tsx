import { useState } from "react";

interface CollapsibleSectionProps {
  title: React.ReactNode;         // <-- changed from string to React.ReactNode
  children: React.ReactNode;
}

function CollapsibleSection({ title, children }: CollapsibleSectionProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-l-4 border-blue-200 pl-4 bg-blue-50 rounded-md p-4 space-y-2">
      <button
        onClick={() => setOpen(!open)}
        className="text-blue-600 font-medium hover:underline inline-flex items-center gap-2"
      >
        {open ? (
          <>
            {title}
            <span> ~ Hide</span>
          </>
        ) : (
          <> 
            {title}
            <span> ~ Read More </span>
          </>
        )}
      </button>

      <div
        className={`transition-all duration-500 ease-in-out overflow-hidden ${
          open ? "max-h-[2000px] opacity-100 mt-2" : "max-h-0 opacity-0"
        }`}
      >
        <div className="text-sm leading-relaxed">{children}</div>
      </div>
    </div>
  );
}

export default CollapsibleSection;

