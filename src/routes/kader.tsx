import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  UserPlus,
  ClipboardPlus,
  Users,
  Scale,
  TrendingUp,
  Activity,
  Home,
  Settings,
} from "lucide-react";
import { balitaListQuery, pencatatanListQuery } from "@/lib/queries";
import { badgeGizi, type StatusGizi } from "@/lib/gizi";
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

export const Route = createFileRoute("/kader")({
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(balitaListQuery());
    context.queryClient.ensureQueryData(pencatatanListQuery());
  },
  component: KaderDashboard,
});

const STATUS_COLORS: Record<StatusGizi, string> = {
  Normal: "var(--success)",
  "Gizi Kurang": "var(--warning)",
  "Berisiko Stunting": "var(--danger)",
  "Gizi Lebih": "#3b82f6",
};

function KaderDashboard() {
  const { data: balita } = useSuspenseQuery(balitaListQuery());
  const { data: pencatatan } = useSuspenseQuery(pencatatanListQuery());

  const now = new Date();
  const bulanIni = pencatatan.filter((p) => {
    const t = new Date(p.tanggal);
    return t.getFullYear() === now.getFullYear() && t.getMonth() === now.getMonth();
  });

  const latestByBalita = new Map<string, (typeof pencatatan)[number]>();
  for (const p of pencatatan) {
    const ex = latestByBalita.get(p.balita_id);
    if (!ex || new Date(p.tanggal) > new Date(ex.tanggal)) latestByBalita.set(p.balita_id, p);
  }
  const statusCount: Record<StatusGizi, number> = {
    Normal: 0, "Gizi Kurang": 0, "Berisiko Stunting": 0, "Gizi Lebih": 0,
  };
  latestByBalita.forEach((p) => {
    const s = p.status_gizi as StatusGizi;
    if (s in statusCount) statusCount[s] += 1;
  });
  const chartData = (Object.keys(statusCount) as StatusGizi[]).map((name) => ({
    name, jumlah: statusCount[name],
  }));

  const recent = [...pencatatan].slice(0, 5);
  const balitaMap = new Map(balita.map((b) => [b.id, b]));

  return (
    <AppShell title="Dashboard Kader" requireRole="kader">
      <div className="space-y-4">
        <div className="rounded-2xl bg-gradient-to-br from-primary to-[color:var(--chart-5)] p-5 text-primary-foreground shadow-md">
          <div className="text-xs font-medium uppercase tracking-wider opacity-90">
            KKN PPM XXVIII Universitas Semarang
          </div>
          <div className="mt-1 text-lg font-semibold">Panel Kader Posyandu</div>
          <div className="mt-2 text-sm opacity-90">
            Catat hasil posyandu & kelola data balita Kelurahan Kudu.
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <StatCard icon={<Users className="h-5 w-5" />} label="Total Balita" value={balita.length} />
          <StatCard icon={<Scale className="h-5 w-5" />} label="Ditimbang Bulan Ini" value={new Set(bulanIni.map((p) => p.balita_id)).size} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Button asChild size="lg" className="h-16 rounded-xl text-sm font-semibold">
            <Link to="/balita"><Users className="mr-2 h-5 w-5" /> Kelola Balita</Link>
          </Button>
          <Button asChild size="lg" variant="secondary" className="h-16 rounded-xl text-sm font-semibold">
            <Link to="/pencatatan"><ClipboardPlus className="mr-2 h-5 w-5" /> Catat Balita</Link>
          </Button>
          <Button asChild size="lg" className="h-16 rounded-xl text-sm font-semibold bg-pink-600 hover:bg-pink-700">
            <Link to="/ibu-hamil"><UserPlus className="mr-2 h-5 w-5" /> Kelola Ibu Hamil</Link>
          </Button>
          <Button asChild size="lg" variant="secondary" className="h-16 rounded-xl text-sm font-semibold">
            <Link to="/pencatatan/ibu-hamil"><ClipboardPlus className="mr-2 h-5 w-5" /> Catat Ibu Hamil</Link>
          </Button>
          <Button asChild size="lg" className="h-16 rounded-xl text-sm font-semibold bg-amber-600 hover:bg-amber-700">
            <Link to="/lansia"><UserPlus className="mr-2 h-5 w-5" /> Kelola Lansia</Link>
          </Button>
          <Button asChild size="lg" variant="secondary" className="h-16 rounded-xl text-sm font-semibold">
            <Link to="/pencatatan/lansia"><ClipboardPlus className="mr-2 h-5 w-5" /> Catat Lansia</Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="h-16 rounded-xl text-sm font-semibold">
            <Link to="/profil"><Settings className="mr-2 h-5 w-5" /> Profil</Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="h-16 rounded-xl text-sm font-semibold">
            <Link to="/"><Home className="mr-2 h-5 w-5" /> Halaman Publik</Link>
          </Button>
        </div>


        <Card className="rounded-2xl">
          <CardContent className="p-4">
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
              <TrendingUp className="h-4 w-4 text-primary" /> Distribusi Status Gizi Anak
            </div>
            <div className="text-xs text-muted-foreground mb-2">
              Berdasarkan data penimbangan balita terbaru per kategori status gizi.
            </div>
            <div className="h-56">
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
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardContent className="p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
              <Activity className="h-4 w-4 text-primary" /> Pencatatan Terbaru
            </div>
            {recent.length === 0 ? (
              <p className="py-4 text-center text-xs text-muted-foreground">Belum ada pencatatan.</p>
            ) : (
              <div className="space-y-2">
                {recent.map((p) => {
                  const b = balitaMap.get(p.balita_id);
                  const badge = badgeGizi(p.status_gizi as StatusGizi);
                  return (
                    <Link key={p.id} to="/riwayat/$id" params={{ id: p.balita_id }} className="block">
                      <div className="flex items-center justify-between rounded-xl border bg-card p-3">
                        <div className="min-w-0">
                          <div className="truncate text-sm font-medium">{b?.nama_lengkap ?? "—"}</div>
                          <div className="text-[11px] text-muted-foreground">
                            {new Date(p.tanggal).toLocaleDateString("id-ID")} · {p.berat_badan} kg · {p.tinggi_badan} cm
                          </div>
                        </div>
                        <span className={`shrink-0 rounded-full border px-2 py-1 text-[10px] font-semibold ${badge.className}`}>
                          {badge.label}
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <Card className="rounded-2xl">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
          <span className="text-primary">{icon}</span> {label}
        </div>
        <div className="mt-1 text-3xl font-bold text-foreground">{value}</div>
      </CardContent>
    </Card>
  );
}
