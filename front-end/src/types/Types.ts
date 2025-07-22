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


export interface Note {
  id: string;                   
  author: string; 
  recipient: string;            
  message: string;             
  dateCreated: string;          
               
  folderRef?: "A" | "B" | "C";  // If tied to a queue/in-progress/done context
}
