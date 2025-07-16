export type Folder = "A" | "B" | "C";

// File structure
// Adding printer(s) selected
//
//
export interface File {
  id:           string;
  name:         string;
  owner:        string;
  email?:       string;
  class?:       string;
  quantity?:    number;
  notes?:       string;
  dateReceived: string;     // ISO string
  size: number;             // in bytes
  dateFinished?: string;    // ISO string
}

