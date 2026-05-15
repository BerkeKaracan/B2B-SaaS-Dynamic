export type BlockType = "text" | "form" | "date" | "container";

export interface BlockContent {
  id: string;
  type: BlockType;
  value: unknown;
  settings?: Record<string, unknown>;
}

export interface RecordData {
  name?: string;
  blocks?: BlockContent[];
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
