// App.tsx
import { FolderProvider } from "./context/FolderContext";

import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Link,
  useLocation,
} from "react-router-dom";

import Setup from "./pages/Setup";
import Data from "./pages/Data";
import Test from "./pages/Test";

function TabNav() {
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="flex gap-4 border-b mb-4 p-4">
      <Link
        to="/setup"
        className={`px-4 py-2 border-b-2 ${
          isActive("/setup") ? "border-pink-500 text-pink-500" : "border-transparent text-gray-500"
        }`}
      >
        Setup
      </Link>
      <Link
        to="/data"
        className={`px-4 py-2 border-b-2 ${
          isActive("/data") ? "border-pink-500 text-pink-500" : "border-transparent text-gray-500"
        }`}
      >
        Data
      </Link>

      <Link
        to="/test"
        className={`px-4 py-2 border-b-2 ${
          isActive("/test") ? "border-pink-500 text-pink-500" : "border-transparent text-gray-500"
        }`}
      >
        Test
      </Link>
    </div>
  );
}

function App() {
  return (
    <FolderProvider>
      <BrowserRouter>
        <TabNav />
        <Routes>
          <Route path="/" element={<Navigate to="/setup" replace />} />
          <Route path="/setup" element={<Setup />} />
          <Route path="/data" element={<Data />} />
          <Route path="/test" element={<Test />} />
        </Routes>
      </BrowserRouter>
    </FolderProvider>
  );
}

export default App;
