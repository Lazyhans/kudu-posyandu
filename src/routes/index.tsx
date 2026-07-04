import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserPlus, ClipboardPlus, Users, Scale, TrendingUp } from "lucide-react";
import { balitaListQuery, pencatatanListQuery } from "@/lib/queries";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

export const Route = createFileRoute("/")({
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(balitaListQuery());
    context.queryClient.ensureQueryData(pencatatanListQuery());
  },
  component: Dashboard,
});

function Dashboard() {
  const { data: balita } = useSuspenseQuery(balitaListQuery());
  const { data: pencatatan } = useSuspenseQuery(pencatatanListQuery());

  const now = new Date();
  const bulanIni = pencatatan.filter((p) => {
    const t = new Date(p.tanggal);
    return t.getFullYear() === now.getFullYear() && t.getMonth() === now.getMonth();
  });

  // Ambil catatan terbaru per balita untuk agregasi status gizi terkini
  const latestByBalita = new Map<string, typeof pencatatan[number]>();
  for (const p of pencatatan) {
    const existing = latestByBalita.get(p.balita_id);
    if (!existing || new Date(p.tanggal) > new Date(existing.tanggal)) {
      latestByBalita.set(p.balita_id, p);
    }
  }
  const statusCount: Record<string, number> = {
    Normal: 0, "Gizi Kurang": 0, "Berisiko Stunting": 0, "Gizi Lebih": 0,
  };
  latestByBalita.forEach((p) => {
    statusCount[p.status_gizi] = (statusCount[p.status_gizi] ?? 0) + 1;
  });
  const chartData = Object.entries(statusCount).map(([name, jumlah]) => ({ name, jumlah }));

  return (
    <AppShell title="Beranda">
      <div className="space-y-4">
        <div className="rounded-2xl bg-gradient-to-br from-primary to-[color:var(--chart-5)] p-5 text-primary-foreground shadow-md">
          <div className="text-xs font-medium uppercase tracking-wider opacity-90">
            KKN PPM XXVIII Universitas Semarang
          </div>
          <div className="mt-1 text-lg font-semibold">Kelurahan Kudu · RW 06</div>
          <div className="mt-2 text-sm opacity-90">
            Digitalisasi Administrasi Posyandu untuk pencatatan tumbuh kembang balita.
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <StatCard icon={<Users className="h-5 w-5" />} label="Total Balita" value={balita.length} />
          <StatCard icon={<Scale className="h-5 w-5" />} label="Ditimbang Bulan Ini" value={new Set(bulanIni.map((p) => p.balita_id)).size} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Button asChild size="lg" className="h-16 rounded-xl text-sm font-semibold">
            <Link to="/balita/tambah">
              <UserPlus className="mr-2 h-5 w-5" /> Tambah Balita
            </Link>
          </Button>
          <Button asChild size="lg" variant="secondary" className="h-16 rounded-xl text-sm font-semibold">
            <Link to="/pencatatan">
              <ClipboardPlus className="mr-2 h-5 w-5" /> Catat Bulanan
            </Link>
          </Button>
        </div>

        <Card className="rounded-2xl">
          <CardContent className="p-4">
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
              <TrendingUp className="h-4 w-4 text-primary" /> Tren Status Gizi Terkini
            </div>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 8, right: 8, bottom: 8, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} />
                  <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                  <Bar dataKey="jumlah" fill="var(--color-primary)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            {balita.length === 0 && (
              <p className="mt-2 text-center text-xs text-muted-foreground">
                Belum ada data. Tambahkan balita untuk mulai memantau.
              </p>
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
