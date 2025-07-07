export type FolderKey = "A" | "B" | "C";

export interface FileItem {
  id: string;
  name: string;
  owner: string;
  email?: string;
  class?: string;
  quantity?: number;
  notes?: string;
  dateReceived: string; // ISO string
  size: number; // in bytes
}