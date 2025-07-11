// App.tsx
import { FolderProvider } from "./context/FolderContext";
import { Home, BarChart2, StickyNote, BookOpen } from "lucide-react"; // icon

import {
  HashRouter,
  Routes,
  Route,
  Navigate,
  Link,
  useLocation,
} from "react-router-dom";

import Main from "./pages/Main";
import Dashboard from "./pages/Dashboard";
import Notes from "./pages/Notes";
import Instructions from "./pages/Instructions";

function TabNav() {
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="flex bg-gray-100 p-2 rounded-lg space-x-6 ml-2 mr-2">
      {[
        { to: "/main", label: "Main", icon: <Home size={16} /> },
        { to: "/dashboard", label: "Dashboard", icon: <BarChart2 size={16} /> },
        { to: "/notes", label: "Notes", icon: <StickyNote size={16} /> },
        { to: "/instructions", label: "Instructions", icon: <BookOpen size={16} /> },
      ].map(({ to, label, icon }) => {
        const active = isActive(to);
        return (
          <Link
            key={to}
            to={to}
            className={`flex items-center justify-center gap-2 flex-1 px-4 py-2 text-base font-medium rounded-md
              transition-all duration-300 ease-in-out transform
              ${active
                ? "bg-white text-blue-600 shadow-md scale-105"
                : "text-gray-600 hover:bg-white hover:text-black hover:shadow-sm hover:scale-[1.02]"
              }`}
          >
            {icon}
            {label}
          </Link>
        );
      })}
    </div>

  );
}

function App() {
  return (
    <FolderProvider>
      <HashRouter>
        <TabNav />
        <Routes>
          <Route path="/" element={<Navigate to="/main" replace />} />
          <Route path="/main" element={<Main />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/notes" element={<Notes />} />
          <Route path="/instructions" element={<Instructions />} />
        </Routes>
      </HashRouter>
    </FolderProvider>
  );
}

export default App;
