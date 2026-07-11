import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { balitaListQuery, pencatatanListQuery } from "@/lib/queries";
import { hitungUsiaBulan } from "@/lib/gizi";
import { exportToXLSX } from "@/lib/export";
import { Download, ChevronRight, Search, Eye } from "lucide-react";
import { useMemo, useState } from "react";

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
  const [previewOpen, setPreviewOpen] = useState(false);

  const now = new Date();
  const balitaMap = useMemo(() => new Map(balita.map((b) => [b.id, b])), [balita]);

  const rowsBulanIni = useMemo(() => {
    const bulanIni = pencatatan.filter((p) => {
      const t = new Date(p.tanggal);
      return t.getFullYear() === now.getFullYear() && t.getMonth() === now.getMonth();
    });
    return bulanIni.map((p) => {
      const b = balitaMap.get(p.balita_id);
      return {
        Tanggal: p.tanggal,
        Nama: b?.nama_lengkap ?? "",
        NIK: b?.nik ?? "",
        JenisKelamin: b?.jenis_kelamin === "L" ? "Laki-laki" : "Perempuan",
        UsiaBulan: b ? hitungUsiaBulan(b.tanggal_lahir) : "",
        RT: b?.rt ?? "",
        RW: b?.rw ?? "",
        NamaOrangtua: b?.nama_orangtua ?? "",
        BeratKg: p.berat_badan,
        TinggiCm: p.tinggi_badan,
        StatusGizi: p.status_gizi,
        Catatan: p.catatan ?? "",
      };
    });
  }, [pencatatan, balitaMap, now]);

  const downloadExcel = () => {
    const fname = `posyandu-kelurahan-kudu-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}.xlsx`;
    exportToXLSX(fname, rowsBulanIni, "Posyandu Kelurahan Kudu");
    setPreviewOpen(false);
  };

  const filtered = balita.filter(
    (b) => b.nama_lengkap.toLowerCase().includes(q.toLowerCase()) || b.nik.includes(q),
  );

  const namaBulan = now.toLocaleDateString("id-ID", { month: "long", year: "numeric" });

  return (
    <AppShell title="Riwayat Rekam Medis">
      <div className="space-y-3">
        <Button
          onClick={() => setPreviewOpen(true)}
          className="h-12 w-full rounded-xl"
          disabled={rowsBulanIni.length === 0}
        >
          <Eye className="mr-2 h-4 w-4" /> Pratinjau & Ekspor Data Bulan Ini
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
                    <div className="text-xs text-muted-foreground">
                      {total} catatan · RT {b.rt ?? "-"}/RW {b.rw ?? "-"}
                    </div>
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

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Pratinjau Data — {namaBulan}</DialogTitle>
            <DialogDescription>
              {rowsBulanIni.length} baris siap diekspor. Periksa data di bawah sebelum mengunduh.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-auto rounded-lg border">
            <Table>
              <TableHeader className="sticky top-0 bg-muted">
                <TableRow>
                  <TableHead className="whitespace-nowrap">Tanggal</TableHead>
                  <TableHead className="whitespace-nowrap">Nama</TableHead>
                  <TableHead className="whitespace-nowrap">NIK</TableHead>
                  <TableHead className="whitespace-nowrap">JK</TableHead>
                  <TableHead className="whitespace-nowrap">Usia (bln)</TableHead>
                  <TableHead className="whitespace-nowrap">RT</TableHead>
                  <TableHead className="whitespace-nowrap">RW</TableHead>
                  <TableHead className="whitespace-nowrap">Ortu</TableHead>
                  <TableHead className="whitespace-nowrap text-right">BB (kg)</TableHead>
                  <TableHead className="whitespace-nowrap text-right">TB (cm)</TableHead>
                  <TableHead className="whitespace-nowrap">Status Gizi</TableHead>
                  <TableHead className="whitespace-nowrap">Catatan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rowsBulanIni.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={12} className="py-6 text-center text-sm text-muted-foreground">
                      Belum ada data untuk bulan ini.
                    </TableCell>
                  </TableRow>
                ) : (
                  rowsBulanIni.map((r, i) => (
                    <TableRow key={i}>
                      <TableCell className="whitespace-nowrap text-xs">{r.Tanggal}</TableCell>
                      <TableCell className="whitespace-nowrap text-xs font-medium">{r.Nama}</TableCell>
                      <TableCell className="whitespace-nowrap font-mono text-[11px]">{r.NIK}</TableCell>
                      <TableCell className="whitespace-nowrap text-xs">{r.JenisKelamin}</TableCell>
                      <TableCell className="whitespace-nowrap text-xs text-right">{r.UsiaBulan}</TableCell>
                      <TableCell className="whitespace-nowrap text-xs">{r.RT}</TableCell>
                      <TableCell className="whitespace-nowrap text-xs">{r.RW}</TableCell>
                      <TableCell className="whitespace-nowrap text-xs">{r.NamaOrangtua}</TableCell>
                      <TableCell className="whitespace-nowrap text-xs text-right">{r.BeratKg}</TableCell>
                      <TableCell className="whitespace-nowrap text-xs text-right">{r.TinggiCm}</TableCell>
                      <TableCell className="whitespace-nowrap text-xs">{r.StatusGizi}</TableCell>
                      <TableCell className="max-w-[200px] truncate text-xs text-muted-foreground">{r.Catatan}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="outline" onClick={() => setPreviewOpen(false)}>Batal</Button>
            <Button onClick={downloadExcel} disabled={rowsBulanIni.length === 0}>
              <Download className="mr-2 h-4 w-4" /> Unduh Excel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
