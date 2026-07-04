import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Search, TrendingUp, ShieldCheck, User, Baby } from "lucide-react";
import { balitaListQuery, pencatatanListQuery } from "@/lib/queries";
import { hitungUsiaBulan, badgeGizi, type StatusGizi } from "@/lib/gizi";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from "recharts";

export const Route = createFileRoute("/")({
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(balitaListQuery());
    context.queryClient.ensureQueryData(pencatatanListQuery());
  },
  component: PublicHome,
});

const STATUS_COLORS: Record<StatusGizi, string> = {
  Normal: "var(--success)",
  "Gizi Kurang": "var(--warning)",
  "Berisiko Stunting": "var(--danger)",
  "Gizi Lebih": "#3b82f6",
};

function PublicHome() {
  const { data: balita } = useSuspenseQuery(balitaListQuery());
  const { data: pencatatan } = useSuspenseQuery(pencatatanListQuery());
  const [q, setQ] = useState("");

  const { chartData, latestByBalita } = useMemo(() => {
    const latestByBalita = new Map<string, (typeof pencatatan)[number]>();
    for (const p of pencatatan) {
      const existing = latestByBalita.get(p.balita_id);
      if (!existing || new Date(p.tanggal) > new Date(existing.tanggal)) {
        latestByBalita.set(p.balita_id, p);
      }
    }
    const statusCount: Record<StatusGizi, number> = {
      Normal: 0,
      "Gizi Kurang": 0,
      "Berisiko Stunting": 0,
      "Gizi Lebih": 0,
    };
    latestByBalita.forEach((p) => {
      const s = p.status_gizi as StatusGizi;
      if (s in statusCount) statusCount[s] += 1;
    });
    const chartData = (Object.keys(statusCount) as StatusGizi[]).map((name) => ({
      name,
      jumlah: statusCount[name],
    }));
    return { chartData, latestByBalita };
  }, [pencatatan]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return [];
    return balita
      .filter(
        (b) =>
          b.nama_lengkap.toLowerCase().includes(term) ||
          b.nik.toLowerCase().includes(term),
      )
      .slice(0, 20);
  }, [balita, q]);

  return (
    <div className="min-h-screen bg-background pb-10">
      <header className="sticky top-0 z-40 border-b bg-primary text-primary-foreground shadow-sm">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
          <div className="min-w-0">
            <div className="text-[10px] uppercase tracking-wider opacity-80">
              KKN PPM XXVIII Universitas Semarang
            </div>
            <h1 className="mt-0.5 truncate text-base font-semibold leading-tight">
              Posyandu Kelurahan Kudu
            </h1>
          </div>
          <Link
            to="/auth"
            className="flex items-center gap-1.5 rounded-full bg-primary-foreground/15 px-3 py-2 text-xs font-semibold hover:bg-primary-foreground/25 transition-colors"
          >
            <ShieldCheck className="h-4 w-4" />
            Login Admin
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-2xl space-y-4 px-4 py-4">
        <div className="rounded-2xl bg-gradient-to-br from-primary to-[color:var(--chart-5)] p-5 text-primary-foreground shadow-md">
          <div className="text-lg font-semibold">Selamat Datang</div>
          <div className="mt-1 text-sm opacity-90">
            Pantau status gizi & tumbuh kembang balita di Kelurahan Kudu secara terbuka.
          </div>
        </div>

        <Card className="rounded-2xl">
          <CardContent className="p-4">
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
              <TrendingUp className="h-4 w-4 text-primary" />
              Grafik Status Gizi Terkini
            </div>
            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 8, right: 8, bottom: 8, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} />
                  <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                  <Bar dataKey="jumlah" radius={[6, 6, 0, 0]}>
                    {chartData.map((d) => (
                      <Cell key={d.name} fill={STATUS_COLORS[d.name as StatusGizi]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2 text-[11px] text-muted-foreground sm:grid-cols-4">
              {(Object.keys(STATUS_COLORS) as StatusGizi[]).map((s) => (
                <div key={s} className="flex items-center gap-1.5">
                  <span
                    className="inline-block h-2.5 w-2.5 rounded-sm"
                    style={{ background: STATUS_COLORS[s] }}
                  />
                  {s}
                </div>
              ))}
            </div>
            <div className="mt-3 text-center text-xs text-muted-foreground">
              Total balita terpantau: <span className="font-semibold text-foreground">{latestByBalita.size}</span> dari {balita.length}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardContent className="p-4">
            <label className="mb-2 flex items-center gap-2 text-sm font-semibold">
              <Search className="h-4 w-4 text-primary" />
              Cari Data Anak
            </label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Ketik nama atau NIK..."
                className="w-full rounded-xl border bg-background py-3 pl-10 pr-3 text-base focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="mt-3 space-y-2">
              {q.trim() === "" && (
                <p className="py-4 text-center text-xs text-muted-foreground">
                  Masukkan nama atau NIK untuk mencari.
                </p>
              )}
              {q.trim() !== "" && filtered.length === 0 && (
                <p className="py-4 text-center text-xs text-muted-foreground">
                  Tidak ada data yang cocok.
                </p>
              )}
              {filtered.map((b) => {
                const latest = latestByBalita.get(b.id);
                const status = (latest?.status_gizi ?? "Normal") as StatusGizi;
                const badge = badgeGizi(status);
                const usia = hitungUsiaBulan(b.tanggal_lahir);
                return (
                  <div
                    key={b.id}
                    className="flex items-center gap-3 rounded-xl border bg-card p-3"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Baby className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold">{b.nama_lengkap}</div>
                      <div className="flex items-center gap-1 truncate text-[11px] text-muted-foreground">
                        <User className="h-3 w-3" /> NIK {b.nik} · {usia} bln · RT {b.alamat_rt}
                      </div>
                    </div>
                    {latest ? (
                      <span
                        className={`shrink-0 rounded-full border px-2 py-1 text-[10px] font-semibold ${badge.className}`}
                      >
                        {badge.label}
                      </span>
                    ) : (
                      <span className="shrink-0 rounded-full border px-2 py-1 text-[10px] font-semibold text-muted-foreground">
                        Belum tercatat
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <p className="pt-2 text-center text-[11px] text-muted-foreground">
          © Posyandu Kelurahan Kudu · KKN PPM XXVIII Universitas Semarang
        </p>
      </main>
    </div>
  );
}
