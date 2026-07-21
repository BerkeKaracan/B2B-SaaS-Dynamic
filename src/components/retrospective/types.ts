export type RetroColumnId = 'glad' | 'sad' | 'mad';

export interface RetroCard {
  id: string;
  columnId: RetroColumnId;
  content: string;
  votedBy?: string[];
  author: string;
  createdAt: number;
}

export interface RetroColumnMeta {
  id: RetroColumnId;
  title: string;
  desc: string;
  color: string;
}
