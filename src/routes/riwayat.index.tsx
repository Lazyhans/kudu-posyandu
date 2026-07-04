import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { balitaListQuery, pencatatanListQuery } from "@/lib/queries";
import { hitungUsiaBulan } from "@/lib/gizi";
import { exportToXLSX } from "@/lib/export";
import { Download, ChevronRight, Search } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/riwayat/")({
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(balitaListQuery());
    context.queryClient.ensureQueryData(pencatatanListQuery());
  },
  component: RiwayatIndex,
});

function RiwayatIndex() {
  const { data: balita } = useSuspenseQuery(balitaListQuery());
  const { data: pencatatan } = useSuspenseQuery(pencatatanListQuery());
  const [q, setQ] = useState("");

  const exportBulanIni = () => {
    const now = new Date();
    const bulanIni = pencatatan.filter((p) => {
      const t = new Date(p.tanggal);
      return t.getFullYear() === now.getFullYear() && t.getMonth() === now.getMonth();
    });
    const balitaMap = new Map(balita.map((b) => [b.id, b]));
    const rows = bulanIni.map((p) => {
      const b = balitaMap.get(p.balita_id);
      return {
        Tanggal: p.tanggal,
        Nama: b?.nama_lengkap ?? "",
        NIK: b?.nik ?? "",
        JenisKelamin: b?.jenis_kelamin === "L" ? "Laki-laki" : "Perempuan",
        UsiaBulan: b ? hitungUsiaBulan(b.tanggal_lahir) : "",
        Alamat: b?.alamat_rt ?? "",
        NamaOrangtua: b?.nama_orangtua ?? "",
        BeratKg: p.berat_badan,
        TinggiCm: p.tinggi_badan,
        StatusGizi: p.status_gizi,
        Catatan: p.catatan ?? "",
      };
    });
    const fname = `posyandu-kelurahan-kudu-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}.xlsx`;
    exportToXLSX(fname, rows, "Posyandu Kelurahan Kudu");
  };

  const filtered = balita.filter(
    (b) => b.nama_lengkap.toLowerCase().includes(q.toLowerCase()) || b.nik.includes(q),
  );

  return (
    <AppShell title="Riwayat Rekam Medis">
      <div className="space-y-3">
        <Button onClick={exportBulanIni} className="h-12 w-full rounded-xl">
          <Download className="mr-2 h-4 w-4" /> Ekspor Data Bulan Ini (Excel)
        </Button>

        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari balita..." className="h-12 rounded-xl pl-10" />
        </div>

        {filtered.map((b) => {
          const total = pencatatan.filter((p) => p.balita_id === b.id).length;
          return (
            <Link key={b.id} to="/riwayat/$id" params={{ id: b.id }}>
              <Card className="rounded-2xl active:bg-accent">
                <CardContent className="flex items-center gap-3 p-4">
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-primary/10 text-primary font-bold">
                    {b.nama_lengkap.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold">{b.nama_lengkap}</div>
                    <div className="text-xs text-muted-foreground">{total} catatan · {b.alamat_rt}</div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </CardContent>
              </Card>
            </Link>
          );
        })}

        {balita.length === 0 && (
          <Card className="rounded-2xl"><CardContent className="p-6 text-center text-sm text-muted-foreground">
            Belum ada balita terdaftar.
          </CardContent></Card>
        )}
      </div>
    </AppShell>
  );
}
