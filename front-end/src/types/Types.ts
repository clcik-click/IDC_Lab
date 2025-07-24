export type Folder = "A" | "B" | "C";

// File structure
// Adding printer(s) selected
//
//
export interface File {
  id:           string;     // unique id
  name:         string;     // file name
  owner:        string;     // student name
  quantity:     number;

  email?:       string;
  class?:       string;
  notes?:       string;

  printer1:     string;
  printer2?:    string;
  printer3?:    string;
  printer4?:    string;
  printer5?:    string;

  material1:    string;
  material2?:   string;
  material3?:   string;
  material4?:   string;
  material5?:   string;

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
