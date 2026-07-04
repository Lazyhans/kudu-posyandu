import * as XLSX from "xlsx";

export function exportToCSV(filename: string, rows: Record<string, unknown>[]) {
  if (rows.length === 0) {
    alert("Tidak ada data untuk diekspor");
    return;
  }
  const headers = Object.keys(rows[0]);
  const escape = (v: unknown) => {
    const s = v === null || v === undefined ? "" : String(v);
    return `"${s.replace(/"/g, '""')}"`;
  };
  const csv = [
    headers.join(","),
    ...rows.map((r) => headers.map((h) => escape(r[h])).join(",")),
  ].join("\n");
  const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportToXLSX(
  filename: string,
  rows: Record<string, unknown>[],
  sheetName = "Data",
) {
  if (rows.length === 0) {
    alert("Tidak ada data untuk diekspor");
    return;
  }
  const headers = Object.keys(rows[0]);
  const ws = XLSX.utils.json_to_sheet(rows, { header: headers });

  // Column widths based on content length
  ws["!cols"] = headers.map((h) => {
    const maxLen = Math.max(
      h.length,
      ...rows.map((r) => (r[h] == null ? 0 : String(r[h]).length)),
    );
    return { wch: Math.min(Math.max(maxLen + 2, 10), 40) };
  });

  // Format as an Excel Table (adds filters, banded rows, header styling)
  const range = XLSX.utils.decode_range(ws["!ref"]!);
  ws["!autofilter"] = { ref: ws["!ref"]! };
  const ref = XLSX.utils.encode_range(range);
  (ws as unknown as { "!table": unknown })["!table"] = {
    name: "DataPosyandu",
    displayName: "DataPosyandu",
    ref,
    headerRowCount: 1,
    totalsRowCount: 0,
    style: { name: "TableStyleMedium2", showRowStripes: true },
  };

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, filename, { bookType: "xlsx", compression: true });
}
