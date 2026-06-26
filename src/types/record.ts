export type BlockType =
  | 'text'
  | 'form'
  | 'date'
  | 'container'
  | 'dropdown'
  | 'checkbox'
  | 'badge_selector'
  | 'asset_stream';

export interface BlockContent {
  id: string;
  type: BlockType;
  value: unknown;
  x: number;
  y: number;
  width?: number;
  height?: number;
  settings?: Record<string, unknown>;
}

export interface PageContent {
  id: string;
  type:
    | 'empty'
    | 'kanban'
    | 'notes'
    | 'document'
    | 'timeline'
    | 'database'
    | 'whiteboard'
    | 'mindmap'
    | 'retrospective';
  title: string;
  x: number;
  y: number;
  width: number;
  height: number;
  blocks: BlockContent[];
}

export interface RecordData {
  name?: string;
  pages?: PageContent[];
  [key: string]: unknown;
}

export interface RecordBase {
  tenant_id: string;
  module_name: string;
  record_data: RecordData;
}

export interface RecordResponse extends RecordBase {
  id: string;
  created_at: string;
}
