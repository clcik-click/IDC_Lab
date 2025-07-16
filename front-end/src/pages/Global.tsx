import type { File, Folder } from "../types/Types";

//
declare global {
  interface Window {
    electronAPI: {
      // Run at startup
      loadConfig:     () => Promise<Record<Folder, string>>;
      setFolderPaths: (paths: Record<Folder, string>) => void;
      scanFolders:    () => Promise<Record<Folder, File[]>>;
      saveData:       (folders: Record<Folder, File[]>) => void;

      //
      pickFolder: () => Promise<string | null>;
      saveConfig: (paths: Record<Folder, string>) => void;
      //

      //
      moveFile: (params: {
        name: string;
        from: Folder;
        to  : Folder;
      }) => Promise<{ success: boolean; newName?: string; error?: string }>;

      deleteFile: (params: {
        name: string;
        from: Folder;
      }) => Promise<{ success: boolean; error?: string }>;
      //

      importFileBuffer?: (params: {
        name:   string;
        buffer: number[];
        to:     Folder;
      }) => Promise<{ success: boolean; error?: string }>;

      getStatsFromDB: () => Promise<{
        success:            boolean;
        totalPrinted:       number;
        totalPartsPrinted:  number;
        avgPrintTime:       string;
        topStudents:        { owner: string; count: number }[];
        topClasses:         { class: string; count: number }[];
        trendData:          { day: string; count: number }[];
      }>;

    };
  }
}
