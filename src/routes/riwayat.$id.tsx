import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { balitaByIdQuery, pencatatanByBalitaQuery } from "@/lib/queries";
import { badgeGizi, hitungUsiaBulan, type StatusGizi } from "@/lib/gizi";
import { exportToCSV } from "@/lib/export";
import { Download, ArrowLeft, Calendar, Scale, Ruler } from "lucide-react";

export const Route = createFileRoute("/riwayat/$id")({
  loader: ({ context, params }) => {
    context.queryClient.ensureQueryData(balitaByIdQuery(params.id));
    context.queryClient.ensureQueryData(pencatatanByBalitaQuery(params.id));
  },
  component: RiwayatDetail,
});

function RiwayatDetail() {
  const { id } = Route.useParams();
  const { data: balita } = useSuspenseQuery(balitaByIdQuery(id));
  const { data: catatan } = useSuspenseQuery(pencatatanByBalitaQuery(id));

  if (!balita) {
    return <AppShell title="Riwayat"><div className="p-4 text-center text-sm text-muted-foreground">Balita tidak ditemukan.</div></AppShell>;
  }

  const eksporRiwayat = () => {
    const rows = catatan.map((p) => ({
      Tanggal: p.tanggal, BeratKg: p.berat_badan, TinggiCm: p.tinggi_badan,
      StatusGizi: p.status_gizi, Catatan: p.catatan ?? "",
    }));
    exportToCSV(`riwayat-${balita.nama_lengkap.replace(/\s+/g, "_")}.csv`, rows);
  };

  return (
    <AppShell title={balita.nama_lengkap}>
      <div className="space-y-3">
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link to="/riwayat"><ArrowLeft className="mr-1 h-4 w-4" /> Kembali</Link>
        </Button>

        <Card className="rounded-2xl bg-primary/5">
          <CardContent className="p-4">
            <div className="text-base font-bold">{balita.nama_lengkap}</div>
            <div className="mt-1 text-xs text-muted-foreground space-y-0.5">
              <div>NIK: {balita.nik}</div>
              <div>{balita.jenis_kelamin === "L" ? "Laki-laki" : "Perempuan"} · {hitungUsiaBulan(balita.tanggal_lahir)} bulan</div>
              <div>Ibu: {balita.nama_orangtua}</div>
              <div>Alamat: {balita.alamat_rt}</div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-2">
          <Button asChild className="h-12 rounded-xl">
            <Link to="/pencatatan"><Calendar className="mr-2 h-4 w-4" /> Tambah Catatan</Link>
          </Button>
          <Button onClick={eksporRiwayat} variant="secondary" className="h-12 rounded-xl">
            <Download className="mr-2 h-4 w-4" /> Ekspor
          </Button>
        </div>

        <div className="pt-2 text-sm font-semibold text-muted-foreground">Riwayat Penimbangan ({catatan.length})</div>

        {catatan.length === 0 ? (
          <Card className="rounded-2xl"><CardContent className="p-6 text-center text-sm text-muted-foreground">
            Belum ada riwayat pencatatan.
          </CardContent></Card>
        ) : (
          <div className="space-y-2">
            {catatan.map((p) => {
              const b = badgeGizi(p.status_gizi as StatusGizi);
              return (
                <Card key={p.id} className="rounded-2xl">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="text-xs font-medium text-muted-foreground">
                        {new Date(p.tanggal).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                      </div>
                      <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${b.className}`}>{b.label}</span>
                    </div>
                    <div className="mt-2 flex gap-4 text-sm">
                      <div className="flex items-center gap-1"><Scale className="h-4 w-4 text-primary" /> <span className="font-semibold">{p.berat_badan}</span> kg</div>
                      <div className="flex items-center gap-1"><Ruler className="h-4 w-4 text-primary" /> <span className="font-semibold">{p.tinggi_badan}</span> cm</div>
                    </div>
                    {p.catatan && <div className="mt-2 rounded-lg bg-muted p-2 text-xs text-muted-foreground">{p.catatan}</div>}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
