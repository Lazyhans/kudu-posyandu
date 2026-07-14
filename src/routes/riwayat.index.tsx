import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  balitaListQuery, pencatatanListQuery,
  ibuHamilListQuery, pencatatanIbuHamilListQuery,
  lansiaListQuery, pencatatanLansiaListQuery,
  hitungUsiaTahun, sortByRtRwUsia,
} from "@/lib/queries";
import { hitungUsiaBulan } from "@/lib/gizi";
import { exportToXLSX } from "@/lib/export";
import { Download, ChevronRight, Search, Eye, Baby, HeartPulse, Users2 } from "lucide-react";
import { useMemo, useState } from "react";

export const Route = createFileRoute("/riwayat/")({
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(balitaListQuery());
    context.queryClient.ensureQueryData(pencatatanListQuery());
    context.queryClient.ensureQueryData(ibuHamilListQuery());
    context.queryClient.ensureQueryData(pencatatanIbuHamilListQuery());
    context.queryClient.ensureQueryData(lansiaListQuery());
    context.queryClient.ensureQueryData(pencatatanLansiaListQuery());
  },
  component: RiwayatIndex,
});

type Tab = "anak" | "ibu-hamil" | "lansia";

function RiwayatIndex() {
  const { data: balita } = useSuspenseQuery(balitaListQuery());
  const { data: pencatatan } = useSuspenseQuery(pencatatanListQuery());
  const { data: ibuHamil } = useSuspenseQuery(ibuHamilListQuery());
  const { data: pencatatanIH } = useSuspenseQuery(pencatatanIbuHamilListQuery());
  const { data: lansia } = useSuspenseQuery(lansiaListQuery());
  const { data: pencatatanL } = useSuspenseQuery(pencatatanLansiaListQuery());

  const [tab, setTab] = useState<Tab>("anak");
  const [q, setQ] = useState("");
  const [preview, setPreview] = useState<Tab | null>(null);

  const now = new Date();
  const namaBulan = now.toLocaleDateString("id-ID", { month: "long", year: "numeric" });
  const isBulanIni = (t: string) => {
    const d = new Date(t);
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  };

  const balitaMap = useMemo(() => new Map(balita.map((b) => [b.id, b])), [balita]);
  const ibuMap = useMemo(() => new Map(ibuHamil.map((b) => [b.id, b])), [ibuHamil]);
  const lansiaMap = useMemo(() => new Map(lansia.map((b) => [b.id, b])), [lansia]);

  const rowsAnak = useMemo(() => {
    const rows = pencatatan.filter((p) => isBulanIni(p.tanggal)).map((p) => {
      const b = balitaMap.get(p.balita_id);
      return {
        RW: b?.rw ?? "", RT: b?.rt ?? "",
        Tanggal: p.tanggal, Nama: b?.nama_lengkap ?? "", NIK: b?.nik ?? "",
        JenisKelamin: b?.jenis_kelamin === "L" ? "Laki-laki" : "Perempuan",
        UsiaBulan: b ? hitungUsiaBulan(b.tanggal_lahir) : "",
        NamaOrangtua: b?.nama_orangtua ?? "",
        BeratKg: p.berat_badan, TinggiCm: p.tinggi_badan,
        StatusGizi: p.status_gizi, Catatan: p.catatan ?? "",
      };
    });
    return rows.sort((a, b) =>
      String(a.RW).localeCompare(String(b.RW)) ||
      String(a.RT).localeCompare(String(b.RT)) ||
      (Number(a.UsiaBulan || 0) - Number(b.UsiaBulan || 0))
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pencatatan, balitaMap]);

  const rowsIbu = useMemo(() => {
    const rows = pencatatanIH.filter((p) => isBulanIni(p.tanggal)).map((p) => {
      const b = ibuMap.get(p.ibu_hamil_id);
      return {
        RW: b?.rw ?? "", RT: b?.rt ?? "",
        Tanggal: p.tanggal, Nama: b?.nama_lengkap ?? "", NIK: b?.nik ?? "",
        UsiaTahun: b ? hitungUsiaTahun(b.tanggal_lahir) : "",
        Alamat: b?.alamat ?? "",
        BeratKg: p.berat_badan, LingkarPerutCm: p.lingkar_perut ?? "",
        LingkarLenganCm: p.lingkar_lengan ?? "", Tensi: p.tensi ?? "",
        GulaMgdL: p.gula ?? "", Catatan: p.catatan ?? "",
      };
    });
    return rows.sort((a, b) =>
      String(a.RW).localeCompare(String(b.RW)) ||
      String(a.RT).localeCompare(String(b.RT)) ||
      (Number(a.UsiaTahun || 0) - Number(b.UsiaTahun || 0))
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pencatatanIH, ibuMap]);

  const rowsLansia = useMemo(() => {
    const rows = pencatatanL.filter((p) => isBulanIni(p.tanggal)).map((p) => {
      const b = lansiaMap.get(p.lansia_id);
      return {
        RW: b?.rw ?? "", RT: b?.rt ?? "",
        Tanggal: p.tanggal, Nama: b?.nama_lengkap ?? "", NIK: b?.nik ?? "",
        JenisKelamin: b?.jenis_kelamin === "L" ? "Laki-laki" : b?.jenis_kelamin === "P" ? "Perempuan" : "",
        UsiaTahun: b ? hitungUsiaTahun(b.tanggal_lahir) : "",
        Alamat: b?.alamat ?? "",
        BeratKg: p.berat_badan, LingkarBadanCm: p.lingkar_badan ?? "",
        Tensi: p.tensi ?? "", GulaMgdL: p.gula ?? "", Catatan: p.catatan ?? "",
      };
    });
    return rows.sort((a, b) =>
      String(a.RW).localeCompare(String(b.RW)) ||
      String(a.RT).localeCompare(String(b.RT)) ||
      (Number(b.UsiaTahun || 0) - Number(a.UsiaTahun || 0))
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pencatatanL, lansiaMap]);

  const currentRows = preview === "anak" ? rowsAnak : preview === "ibu-hamil" ? rowsIbu : preview === "lansia" ? rowsLansia : [];
  const currentHeaders = currentRows.length > 0 ? Object.keys(currentRows[0]) : [];

  function downloadExcel() {
    if (!preview || currentRows.length === 0) return;
    const label = preview === "anak" ? "anak" : preview === "ibu-hamil" ? "ibu-hamil" : "lansia";
    const fname = `posyandu-kudu-${label}-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}.xlsx`;
    exportToXLSX(fname, currentRows, `Posyandu ${label}`);
    setPreview(null);
  }

  return (
    <AppShell title="Riwayat Pencatatan">
      <div className="space-y-3">
        <div className="grid grid-cols-3 gap-1 rounded-xl bg-muted p-1">
          <TabBtn active={tab === "anak"} onClick={() => setTab("anak")} icon={<Baby className="h-4 w-4" />} label="Anak" />
          <TabBtn active={tab === "ibu-hamil"} onClick={() => setTab("ibu-hamil")} icon={<HeartPulse className="h-4 w-4" />} label="Ibu Hamil" />
          <TabBtn active={tab === "lansia"} onClick={() => setTab("lansia")} icon={<Users2 className="h-4 w-4" />} label="Lansia" />
        </div>

        <Button
          onClick={() => setPreview(tab)}
          className="h-12 w-full rounded-xl"
          disabled={(tab === "anak" ? rowsAnak : tab === "ibu-hamil" ? rowsIbu : rowsLansia).length === 0}
        >
          <Eye className="mr-2 h-4 w-4" /> Pratinjau & Ekspor Bulan Ini
        </Button>

        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari..." className="h-12 rounded-xl pl-10" />
        </div>

        {tab === "anak" && <ListAnak balita={sortByRtRwUsia(balita)} pencatatan={pencatatan} q={q} />}
        {tab === "ibu-hamil" && <ListIbu ibu={sortByRtRwUsia(ibuHamil)} pencatatan={pencatatanIH} q={q} />}
        {tab === "lansia" && <ListLansia lansia={sortByRtRwUsia(lansia)} pencatatan={pencatatanL} q={q} />}
      </div>

      <Dialog open={!!preview} onOpenChange={(o) => !o && setPreview(null)}>
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle>Pratinjau {preview === "anak" ? "Anak" : preview === "ibu-hamil" ? "Ibu Hamil" : "Lansia"} — {namaBulan}</DialogTitle>
            <DialogDescription>
              {currentRows.length} baris diurutkan berdasarkan RW, RT, dan usia. Periksa data sebelum mengunduh.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-auto rounded-lg border">
            <Table>
              <TableHeader className="sticky top-0 bg-muted">
                <TableRow>
                  {currentHeaders.map((h) => <TableHead key={h} className="whitespace-nowrap text-xs">{h}</TableHead>)}
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentRows.length === 0 ? (
                  <TableRow><TableCell colSpan={currentHeaders.length || 1} className="py-6 text-center text-sm text-muted-foreground">
                    Belum ada data untuk bulan ini.
                  </TableCell></TableRow>
                ) : currentRows.map((r, i) => (
                  <TableRow key={i}>
                    {currentHeaders.map((h) => (
                      <TableCell key={h} className="whitespace-nowrap text-xs">
                        {String((r as Record<string, unknown>)[h] ?? "")}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="outline" onClick={() => setPreview(null)}>Batal</Button>
            <Button onClick={downloadExcel} disabled={currentRows.length === 0}>
              <Download className="mr-2 h-4 w-4" /> Unduh Excel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}

function TabBtn({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-xs font-semibold transition-colors ${
        active ? "bg-background text-primary shadow-sm" : "text-muted-foreground"
      }`}
    >
      {icon} {label}
    </button>
  );
}

function ListAnak({ balita, pencatatan, q }: { balita: ReturnType<typeof sortByRtRwUsia<import("@/lib/queries").Balita>>; pencatatan: import("@/lib/queries").Pencatatan[]; q: string }) {
  const filtered = balita.filter((b) => b.nama_lengkap.toLowerCase().includes(q.toLowerCase()) || b.nik.includes(q));
  if (balita.length === 0) return <EmptyCard label="Belum ada balita terdaftar." />;
  return (
    <div className="space-y-2">
      {filtered.map((b) => {
        const total = pencatatan.filter((p) => p.balita_id === b.id).length;
        return (
          <Link key={b.id} to="/riwayat/$id" params={{ id: b.id }}>
            <Card className="rounded-2xl active:bg-accent"><CardContent className="flex items-center gap-3 p-4">
              <Avatar>{b.nama_lengkap.charAt(0).toUpperCase()}</Avatar>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold">{b.nama_lengkap}</div>
                <div className="text-xs text-muted-foreground">{total} catatan · RT {b.rt ?? "-"}/RW {b.rw ?? "-"}</div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </CardContent></Card>
          </Link>
        );
      })}
    </div>
  );
}

function ListIbu({ ibu, pencatatan, q }: { ibu: import("@/lib/queries").IbuHamil[]; pencatatan: import("@/lib/queries").PencatatanIbuHamil[]; q: string }) {
  const filtered = ibu.filter((b) => b.nama_lengkap.toLowerCase().includes(q.toLowerCase()) || b.nik.includes(q));
  if (ibu.length === 0) return <EmptyCard label="Belum ada data ibu hamil." />;
  return (
    <div className="space-y-2">
      {filtered.map((b) => {
        const total = pencatatan.filter((p) => p.ibu_hamil_id === b.id).length;
        return (
          <Link key={b.id} to="/riwayat/ibu-hamil/$id" params={{ id: b.id }}>
            <Card className="rounded-2xl active:bg-accent"><CardContent className="flex items-center gap-3 p-4">
              <Avatar color="pink">{b.nama_lengkap.charAt(0).toUpperCase()}</Avatar>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold">{b.nama_lengkap}</div>
                <div className="text-xs text-muted-foreground">{total} catatan · RT {b.rt ?? "-"}/RW {b.rw ?? "-"}</div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </CardContent></Card>
          </Link>
        );
      })}
    </div>
  );
}

function ListLansia({ lansia, pencatatan, q }: { lansia: import("@/lib/queries").Lansia[]; pencatatan: import("@/lib/queries").PencatatanLansia[]; q: string }) {
  const filtered = lansia.filter((b) => b.nama_lengkap.toLowerCase().includes(q.toLowerCase()) || b.nik.includes(q));
  if (lansia.length === 0) return <EmptyCard label="Belum ada data lansia." />;
  return (
    <div className="space-y-2">
      {filtered.map((b) => {
        const total = pencatatan.filter((p) => p.lansia_id === b.id).length;
        return (
          <Link key={b.id} to="/riwayat/lansia/$id" params={{ id: b.id }}>
            <Card className="rounded-2xl active:bg-accent"><CardContent className="flex items-center gap-3 p-4">
              <Avatar color="amber">{b.nama_lengkap.charAt(0).toUpperCase()}</Avatar>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold">{b.nama_lengkap}</div>
                <div className="text-xs text-muted-foreground">{total} catatan · RT {b.rt ?? "-"}/RW {b.rw ?? "-"}</div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </CardContent></Card>
          </Link>
        );
      })}
    </div>
  );
}

function Avatar({ children, color = "primary" }: { children: React.ReactNode; color?: "primary" | "pink" | "amber" }) {
  const cls = color === "pink" ? "bg-pink-500/10 text-pink-600"
    : color === "amber" ? "bg-amber-500/10 text-amber-600"
    : "bg-primary/10 text-primary";
  return <div className={`grid h-12 w-12 shrink-0 place-items-center rounded-full font-bold ${cls}`}>{children}</div>;
}

function EmptyCard({ label }: { label: string }) {
  return <Card className="rounded-2xl"><CardContent className="p-6 text-center text-sm text-muted-foreground">{label}</CardContent></Card>;
}
