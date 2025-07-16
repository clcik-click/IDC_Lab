import { createContext, useContext, useState } from "react";
import type { File, Folder } from "../types/Types"; 

// Define a type for the folder map: A, B, C each holding an array of File objects
type FolderMap = Record<Folder, File[]>;

// Define the shape of the context value
interface FolderContextType {
  folders: FolderMap;                                         // The actual data
  setFolders: React.Dispatch<React.SetStateAction<FolderMap>>; // The setter function from useState
}

// Create the context with default value `null`
const FolderContext = createContext<FolderContextType | null>(null);

// Context provider component — wrap your app (or part of it) in this to share folder state
export function FolderProvider({ children }: { children: React.ReactNode }) {
  // Initialize folders state — default is empty arrays for A, B, and C
  const [folders, setFolders] = useState<FolderMap>({ A: [], B: [], C: [] });

  return (
    <FolderContext.Provider value={{ folders, setFolders }}>
      {children}
    </FolderContext.Provider>
  );
}

// Custom hook to use the folders context safely
export function useFolders() {
  const context = useContext(FolderContext);

  // Throw error if the hook is used outside of <FolderProvider>
  if (!context) throw new Error("useFolders must be used within FolderProvider");

  return context;
}
