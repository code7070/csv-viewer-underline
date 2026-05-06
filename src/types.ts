export interface CSVData {
  headers: string[];
  rows: string[][];
}

export type SortConfig = {
  key: number;
  direction: 'ascending' | 'descending';
} | null;
