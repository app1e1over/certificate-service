// DD.MM.YYYY, matching the certificate's printed date style.
export function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const dd = String(d.getUTCDate()).padStart(2, "0");
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `${dd}.${mm}.${d.getUTCFullYear()}`;
}

export function average(marks: number[]): number {
  if (!marks.length) return 0;
  return marks.reduce((s, m) => s + m, 0) / marks.length;
}
