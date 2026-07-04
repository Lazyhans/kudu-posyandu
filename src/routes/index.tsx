import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { queryOptions } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, ShieldCheck } from "lucide-react";
import { getPublicStats, type PublicStats } from "@/lib/public-stats.functions";
import { type StatusGizi } from "@/lib/gizi";
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

const publicStatsQuery = () =>
  queryOptions({
    queryKey: ["public-stats"],
    staleTime: 60_000,
    queryFn: () => getPublicStats(),
  });

export const Route = createFileRoute("/")({
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(publicStatsQuery());
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
  const { data: stats } = useSuspenseQuery(publicStatsQuery());

  const chartData = useMemo(() => {
    const s = stats as PublicStats;
    const map: Record<StatusGizi, number> = {
      Normal: s.normal,
      "Gizi Kurang": s.gizi_kurang,
      "Berisiko Stunting": s.berisiko_stunting,
      "Gizi Lebih": s.gizi_lebih,
    };
    return (Object.keys(map) as StatusGizi[]).map((name) => ({
      name,
      jumlah: map[name],
    }));
  }, [stats]);

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
            Pantau ringkasan status gizi balita di Kelurahan Kudu. Data rinci
            hanya dapat diakses oleh admin & kader posyandu.
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
              Total balita terpantau:{" "}
              <span className="font-semibold text-foreground">{stats.tercatat}</span>{" "}
              dari {stats.total_balita}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardContent className="p-4 text-center text-sm text-muted-foreground">
            Data pribadi balita bersifat rahasia dan hanya dapat diakses oleh
            admin & kader posyandu melalui login.
          </CardContent>
        </Card>

        <p className="pt-2 text-center text-[11px] text-muted-foreground">
          © Posyandu Kelurahan Kudu · KKN PPM XXVIII Universitas Semarang
        </p>
      </main>
    </div>
  );
}
