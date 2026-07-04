// Kalkulator status gizi sederhana berdasarkan BB/TB (weight-for-height)
// Referensi ringkas: rasio BB(kg) / TB(m)^2 sebagai indikator praktis lapangan.
// Ini adalah pendekatan sederhana untuk kader, bukan pengganti standar WHO Z-score.

export type StatusGizi = "Normal" | "Gizi Kurang" | "Berisiko Stunting" | "Gizi Lebih";

export function hitungStatusGizi(beratKg: number, tinggiCm: number): StatusGizi {
  if (!beratKg || !tinggiCm || beratKg <= 0 || tinggiCm <= 0) return "Normal";
  const tinggiM = tinggiCm / 100;
  const bmi = beratKg / (tinggiM * tinggiM);
  // Ambang praktis untuk balita
  if (tinggiCm < 80 && beratKg < 8) return "Berisiko Stunting";
  if (bmi < 13) return "Berisiko Stunting";
  if (bmi < 14.5) return "Gizi Kurang";
  if (bmi > 19) return "Gizi Lebih";
  return "Normal";
}

export function badgeGizi(status: StatusGizi): { label: string; className: string } {
  switch (status) {
    case "Normal":
      return { label: "Normal", className: "bg-[color:var(--success)]/15 text-[color:var(--success)] border-[color:var(--success)]/30" };
    case "Gizi Kurang":
      return { label: "Gizi Kurang", className: "bg-[color:var(--warning)]/15 text-[color:var(--warning)] border-[color:var(--warning)]/30" };
    case "Berisiko Stunting":
      return { label: "Berisiko Stunting", className: "bg-[color:var(--danger)]/15 text-[color:var(--danger)] border-[color:var(--danger)]/30" };
    case "Gizi Lebih":
      return { label: "Gizi Lebih", className: "bg-blue-500/15 text-blue-600 border-blue-500/30" };
  }
}

export function hitungUsiaBulan(tanggalLahir: string): number {
  const lahir = new Date(tanggalLahir);
  const now = new Date();
  return (now.getFullYear() - lahir.getFullYear()) * 12 + (now.getMonth() - lahir.getMonth());
}
