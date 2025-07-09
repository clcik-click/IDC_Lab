import type { FileItem, FolderKey } from "../types/FileItem";

declare global {
  interface Window {
    electronAPI: {
      // File paths
      pickFolder: () => Promise<string | null>;
      loadConfig: () => Promise<Record<FolderKey, string>>;
      saveConfig: (paths: Record<FolderKey, string>) => void;
      setFolderPaths?: (paths: Record<FolderKey, string>) => void;

      // File metadata
      saveData: (data: {
        folders: Record<FolderKey, FileItem[]>;
        folderPaths: Record<FolderKey, string>;
      }) => void;

      scanFolders: (
        paths: Record<FolderKey, string>
      ) => Promise<Record<FolderKey, FileItem[]>>;

      moveFile: (params: {
        name: string;
        from: FolderKey;
        to: FolderKey;
        folderPaths: Record<FolderKey, string>;
      }) => Promise<{ success: boolean; newName?: string; error?: string }>;

      deleteFile: (params: {
        name: string;
        folder: FolderKey;
        folderPaths: Record<FolderKey, string>;
      }) => Promise<{ success: boolean; error?: string }>;

      importFileBuffer?: (params: {
        name: string;
        buffer: number[];
        toFolder: FolderKey;
        folderPaths: Record<FolderKey, string>;
      }) => Promise<{ success: boolean; error?: string }>;

      // Stats for Test tab
      getStatsFromDB: () => Promise<{
        totalPrinted: number;
        avgPrintTime: string;
        topStudents: { owner: string; count: number }[];
        topClasses: { class: string; count: number }[];
      }>;
    };
  }
}

export {};
