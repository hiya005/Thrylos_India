// Lightweight CSV export utility — no dependencies
export function toCSV<T extends Record<string, unknown>>(rows: T[], headers?: (keyof T)[]): string {
  if (!rows.length) return "";
  const cols = (headers ?? (Object.keys(rows[0]) as (keyof T)[])) as (keyof T)[];
  const escape = (val: unknown): string => {
    if (val === null || val === undefined) return "";
    const s = typeof val === "object" ? JSON.stringify(val) : String(val);
    if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  const head = cols.map(c => escape(String(c))).join(",");
  const body = rows.map(r => cols.map(c => escape(r[c])).join(",")).join("\n");
  return `${head}\n${body}`;
}

export function downloadCSV(filename: string, csv: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
