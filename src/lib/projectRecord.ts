import { RecordData } from "@/types/record";

export function getProjectDisplayName(
  recordData: RecordData,
  recordId?: string,
): string {
  const name =
    typeof recordData.name === "string" ? recordData.name.trim() : "";
  const title =
    typeof recordData.title === "string" ? recordData.title.trim() : "";

  if (name) return name;
  if (title) return title;

  const description =
    typeof recordData.description === "string"
      ? recordData.description.trim()
      : "";
  if (description) {
    return description.length > 48
      ? `${description.slice(0, 48)}...`
      : description;
  }

  if (recordId) {
    return `Project ${recordId.slice(0, 8)}`;
  }

  return "Untitled Project";
}

/** Hide orphan rows created by legacy autosave (empty payload, no blocks). */
export function isMeaningfulProjectRecord(recordData: RecordData): boolean {
  const hasLabel = Boolean(
    (typeof recordData.name === "string" && recordData.name.trim()) ||
      (typeof recordData.title === "string" && recordData.title.trim()),
  );
  const hasDescription = Boolean(
    typeof recordData.description === "string" &&
      recordData.description.trim(),
  );
  const hasBlocks =
    Array.isArray(recordData.blocks) && recordData.blocks.length > 0;

  return hasLabel || hasDescription || hasBlocks;
}
