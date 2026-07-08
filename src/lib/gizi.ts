// Kalkulator status gizi balita mengacu pada standar Kemenkes RI
// (Permenkes No. 2 Tahun 2020 tentang Standar Antropometri Anak) yang
// menggunakan WHO Child Growth Standards. Kategori dihitung dari nilai
// Z-score dua indikator utama:
//   - BB/U  (Berat Badan menurut Umur)  → underweight
//   - TB/U  (Tinggi Badan menurut Umur) → stunting
//
// Ambang batas kategori (PMK 2/2020):
//   BB/U : < -3 SD sangat kurang · -3..-2 kurang · -2..+1 normal · > +1 risiko lebih
//   TB/U : < -3 SD sangat pendek · -3..-2 pendek · -2..+3 normal · > +3 tinggi
//
// Untuk kompatibilitas skema DB (status_gizi bertipe teks), hasil dipetakan ke
// empat kategori aplikasi. Prioritas: Berisiko Stunting > Gizi Kurang >
// Gizi Lebih > Normal.
//
// Catatan: tabel median & SD di bawah adalah ringkasan referensi WHO/Kemenkes
// pada interval 6 bulan (0–60 bulan) dengan interpolasi linier. Untuk laporan
// resmi tetap gunakan aplikasi ePPGBM Kemenkes.

export type StatusGizi = "Normal" | "Gizi Kurang" | "Berisiko Stunting" | "Gizi Lebih";
export type JenisKelamin = "L" | "P";

// [usiaBulan, median, SD]
type Row = [number, number, number];

// BB/U (kg) — WHO Child Growth Standards
const BB_U_L: Row[] = [
  [0, 3.3, 0.4], [6, 7.9, 0.9], [12, 9.6, 1.1], [18, 10.9, 1.2],
  [24, 12.2, 1.4], [30, 13.3, 1.5], [36, 14.3, 1.6], [42, 15.3, 1.7],
  [48, 16.3, 1.9], [54, 17.3, 2.0], [60, 18.3, 2.1],
];
const BB_U_P: Row[] = [
  [0, 3.2, 0.4], [6, 7.3, 0.9], [12, 8.9, 1.1], [18, 10.2, 1.2],
  [24, 11.5, 1.4], [30, 12.7, 1.5], [36, 13.9, 1.6], [42, 15.0, 1.8],
  [48, 16.1, 1.9], [54, 17.2, 2.1], [60, 18.2, 2.2],
];

// TB/U (cm) — WHO Child Growth Standards
const TB_U_L: Row[] = [
  [0, 49.9, 1.9], [6, 67.6, 2.3], [12, 75.7, 2.7], [18, 82.3, 2.9],
  [24, 87.8, 3.2], [30, 91.9, 3.4], [36, 96.1, 3.6], [42, 99.9, 3.8],
  [48, 103.3, 4.0], [54, 106.7, 4.2], [60, 110.0, 4.4],
];
const TB_U_P: Row[] = [
  [0, 49.1, 1.9], [6, 65.7, 2.3], [12, 74.0, 2.7], [18, 80.7, 2.9],
  [24, 86.4, 3.2], [30, 90.7, 3.4], [36, 95.1, 3.7], [42, 98.9, 3.9],
  [48, 102.7, 4.1], [54, 106.2, 4.3], [60, 109.4, 4.5],
];

function interpolate(table: Row[], usia: number): { median: number; sd: number } {
  const u = Math.max(0, Math.min(60, usia));
  for (let i = 0; i < table.length - 1; i++) {
    const [u1, m1, s1] = table[i];
    const [u2, m2, s2] = table[i + 1];
    if (u >= u1 && u <= u2) {
      const t = (u - u1) / (u2 - u1);
      return { median: m1 + (m2 - m1) * t, sd: s1 + (s2 - s1) * t };
    }
  }
  const last = table[table.length - 1];
  return { median: last[1], sd: last[2] };
}

function zScore(nilai: number, ref: { median: number; sd: number }): number {
  if (!ref.sd) return 0;
  return (nilai - ref.median) / ref.sd;
}

/**
 * Menghitung status gizi berdasarkan BB/U & TB/U (standar Kemenkes/WHO).
 * usiaBulan & jenisKelamin opsional agar kompatibel dengan pemanggilan lama;
 * bila tidak diberikan, jatuh kembali ke perkiraan berbasis IMT sederhana.
 */
export function hitungStatusGizi(
  beratKg: number,
  tinggiCm: number,
  usiaBulan?: number,
  jenisKelamin?: JenisKelamin,
): StatusGizi {
  if (!beratKg || !tinggiCm || beratKg <= 0 || tinggiCm <= 0) return "Normal";

  // Fallback jika usia/jenis kelamin tidak tersedia
  if (usiaBulan === undefined || usiaBulan === null || !jenisKelamin) {
    const bmi = beratKg / Math.pow(tinggiCm / 100, 2);
    if (tinggiCm < 80 && beratKg < 8) return "Berisiko Stunting";
    if (bmi < 13) return "Berisiko Stunting";
    if (bmi < 14.5) return "Gizi Kurang";
    if (bmi > 19) return "Gizi Lebih";
    return "Normal";
  }

  const bbTable = jenisKelamin === "L" ? BB_U_L : BB_U_P;
  const tbTable = jenisKelamin === "L" ? TB_U_L : TB_U_P;

  const zBB = zScore(beratKg, interpolate(bbTable, usiaBulan));
  const zTB = zScore(tinggiCm, interpolate(tbTable, usiaBulan));

  // Prioritas: stunting > gizi kurang > gizi lebih > normal
  if (zTB < -2) return "Berisiko Stunting";
  if (zBB < -2) return "Gizi Kurang";
  if (zBB > 1) return "Gizi Lebih";
  return "Normal";
}

/** Detail Z-score untuk ditampilkan (opsional di UI). */
export function detailZScore(
  beratKg: number,
  tinggiCm: number,
  usiaBulan: number,
  jenisKelamin: JenisKelamin,
) {
  const zBB = zScore(beratKg, interpolate(jenisKelamin === "L" ? BB_U_L : BB_U_P, usiaBulan));
  const zTB = zScore(tinggiCm, interpolate(jenisKelamin === "L" ? TB_U_L : TB_U_P, usiaBulan));
  return { zBB: Number(zBB.toFixed(2)), zTB: Number(zTB.toFixed(2)) };
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
