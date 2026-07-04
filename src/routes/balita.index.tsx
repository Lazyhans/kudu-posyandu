import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { balitaListQuery } from "@/lib/queries";
import { hitungUsiaBulan } from "@/lib/gizi";
import { Search, UserPlus, ChevronRight } from "lucide-react";

export const Route = createFileRoute("/balita/")({
  loader: ({ context }) => { context.queryClient.ensureQueryData(balitaListQuery()); },
  component: BalitaList,
});

function BalitaList() {
  const { data: balita } = useSuspenseQuery(balitaListQuery());
  const [q, setQ] = useState("");
  const filtered = balita.filter(
    (b) =>
      b.nama_lengkap.toLowerCase().includes(q.toLowerCase()) ||
      b.nik.includes(q),
  );

  return (
    <AppShell title="Daftar Balita">
      <div className="space-y-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cari Nama atau NIK..."
            className="h-12 rounded-xl pl-10 text-base"
          />
        </div>

        <Button asChild className="h-12 w-full rounded-xl">
          <Link to="/balita/tambah"><UserPlus className="mr-2 h-4 w-4" /> Tambah Balita Baru</Link>
        </Button>

        {filtered.length === 0 ? (
          <Card className="rounded-2xl"><CardContent className="p-6 text-center text-sm text-muted-foreground">
            {balita.length === 0 ? "Belum ada balita terdaftar." : "Tidak ditemukan."}
          </CardContent></Card>
        ) : (
          <div className="space-y-2">
            {filtered.map((b) => (
              <Link key={b.id} to="/riwayat/$id" params={{ id: b.id }}>
                <Card className="rounded-2xl transition-colors active:bg-accent">
                  <CardContent className="flex items-center gap-3 p-4">
                    <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-primary/10 text-primary font-bold">
                      {b.nama_lengkap.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold">{b.nama_lengkap}</div>
                      <div className="truncate text-xs text-muted-foreground">
                        NIK {b.nik} · {b.jenis_kelamin === "L" ? "Laki-laki" : "Perempuan"} · {hitungUsiaBulan(b.tanggal_lahir)} bln
                      </div>
                      <div className="truncate text-xs text-muted-foreground">{b.alamat_rt} · Ibu {b.nama_orangtua}</div>
                    </div>
                    <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
