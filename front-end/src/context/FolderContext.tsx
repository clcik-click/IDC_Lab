import { createContext, useContext, useState } from "react";
import type { FileItem, FolderKey } from "../types/FileItem";

type FolderMap = Record<FolderKey, FileItem[]>;

interface FolderContextType {
  folders: FolderMap;
  setFolders: React.Dispatch<React.SetStateAction<FolderMap>>;
}

const FolderContext = createContext<FolderContextType | null>(null);

export function FolderProvider({ children }: { children: React.ReactNode }) {
  const [folders, setFolders] = useState<FolderMap>({ A: [], B: [], C: [] });

  return (
    <FolderContext.Provider value={{ folders, setFolders }}>
      {children}
    </FolderContext.Provider>
  );
}

export function useFolders() {
  const context = useContext(FolderContext);
  if (!context) throw new Error("useFolders must be used within FolderProvider");
  return context;
}
