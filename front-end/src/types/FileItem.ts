export type FolderKey = "A" | "B" | "C";

export interface FileItem {
  id: string;
  name: string;
  owner: string;
  class?: string;
  priority?: number;
  notes?: string;
  dateReceived: string; // ISO string
}