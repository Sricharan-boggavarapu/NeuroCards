/** Models sometimes wrap JSON in markdown fences or add leading text — normalize before parse. */
export function extractJsonObject(raw: string): string {
  let t = raw.trim();
  const fence = /^```(?:json)?\s*\n?([\s\S]*?)```$/m;
  const m = t.match(fence);
  if (m) t = m[1].trim();
  const start = t.indexOf("{");
  const end = t.lastIndexOf("}");
  if (start >= 0 && end > start) return t.slice(start, end + 1);
  return t;
}
