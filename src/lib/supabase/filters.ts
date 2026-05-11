export function escapePostgrestLikePattern(value: string, maxLength = 100): string {
  const cleaned = value
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .trim()
    .slice(0, maxLength);

  const escaped = cleaned
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/%/g, "\\%")
    .replace(/_/g, "\\_");

  return `"%${escaped}%"`;
}
