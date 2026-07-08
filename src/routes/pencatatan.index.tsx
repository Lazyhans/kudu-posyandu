import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { balitaListQuery } from "@/lib/queries";
import { hitungStatusGizi, badgeGizi, hitungUsiaBulan, detailZScore } from "@/lib/gizi";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Activity } from "lucide-react";

export const Route = createFileRoute("/pencatatan/")({
  loader: ({ context }) => { context.queryClient.ensureQueryData(balitaListQuery()); },
  component: Pencatatan,
});

function Pencatatan() {
  const { data: balita } = useSuspenseQuery(balitaListQuery());
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [balitaId, setBalitaId] = useState("");
  const [tanggal, setTanggal] = useState(() => new Date().toISOString().slice(0, 10));
  const [bb, setBb] = useState("");
  const [tb, setTb] = useState("");
  const [catatan, setCatatan] = useState("");
  const [loading, setLoading] = useState(false);

  const selected = balita.find((b) => b.id === balitaId);
  const usiaBln = selected ? hitungUsiaBulan(selected.tanggal_lahir) : undefined;
  const jk = selected?.jenis_kelamin as "L" | "P" | undefined;
  const status = useMemo(
    () => hitungStatusGizi(parseFloat(bb), parseFloat(tb), usiaBln, jk),
    [bb, tb, usiaBln, jk],
  );
  const badge = badgeGizi(status);
  const showBadge = bb && tb && parseFloat(bb) > 0 && parseFloat(tb) > 0;
  const zDetail = showBadge && selected && usiaBln !== undefined && jk
    ? detailZScore(parseFloat(bb), parseFloat(tb), usiaBln, jk)
    : null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!balitaId) return toast.error("Pilih balita terlebih dahulu");
    if (!bb || !tb) return toast.error("Isi berat & tinggi badan");
    setLoading(true);
    const { error } = await supabase.from("pencatatan" as never).insert({
      balita_id: balitaId,
      tanggal,
      berat_badan: parseFloat(bb),
      tinggi_badan: parseFloat(tb),
      status_gizi: status,
      catatan: catatan || null,
    } as never);
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Pencatatan tersimpan");
    qc.invalidateQueries({ queryKey: ["pencatatan"] });
    navigate({ to: "/riwayat/$id", params: { id: balitaId } });
  };



  return (
    <AppShell title="Catat Bulanan">
      <Card className="rounded-2xl">
        <CardContent className="p-4">
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Pilih Balita</Label>
              <select value={balitaId} onChange={(e) => setBalitaId(e.target.value)}
                className="h-12 w-full rounded-md border border-input bg-background px-3">
                <option value="">-- Pilih --</option>
                {balita.map((b) => (
                  <option key={b.id} value={b.id}>{b.nama_lengkap} ({b.nik})</option>
                ))}
              </select>
              {selected && (
                <div className="text-xs text-muted-foreground">
                  {selected.jenis_kelamin === "L" ? "Laki-laki" : "Perempuan"} · {hitungUsiaBulan(selected.tanggal_lahir)} bulan · {selected.alamat_rt}
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>Tanggal Penimbangan</Label>
              <Input type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)} className="h-12" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Berat (kg)</Label>
                <Input type="number" step="0.1" inputMode="decimal" value={bb}
                  onChange={(e) => setBb(e.target.value)} className="h-12 text-lg" placeholder="0.0" />
              </div>
              <div className="space-y-1.5">
                <Label>Tinggi (cm)</Label>
                <Input type="number" step="0.1" inputMode="decimal" value={tb}
                  onChange={(e) => setTb(e.target.value)} className="h-12 text-lg" placeholder="0.0" />
              </div>
            </div>

            {showBadge && (
              <div className="space-y-2">
                <div className={`flex items-center justify-between rounded-xl border-2 px-4 py-3 ${badge.className}`}>
                  <div className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    <span className="text-xs font-medium uppercase tracking-wider">Status Gizi</span>
                  </div>
                  <span className="text-base font-bold">{badge.label}</span>
                </div>
                {zDetail && (
                  <div className="rounded-lg bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
                    <div className="mb-1 font-medium">Standar Kemenkes (PMK 2/2020 · WHO)</div>
                    <div className="flex justify-between">
                      <span>Z-Score BB/U (berat/umur)</span>
                      <span className="font-mono">{zDetail.zBB > 0 ? "+" : ""}{zDetail.zBB} SD</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Z-Score TB/U (tinggi/umur)</span>
                      <span className="font-mono">{zDetail.zTB > 0 ? "+" : ""}{zDetail.zTB} SD</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-1.5">
              <Label>Catatan (opsional)</Label>
              <Textarea value={catatan} onChange={(e) => setCatatan(e.target.value)} rows={3} placeholder="Keluhan, imunisasi, vitamin..." />
            </div>

            <Button type="submit" disabled={loading} className="h-12 w-full rounded-xl text-base font-semibold">
              {loading ? "Menyimpan..." : "Simpan Pencatatan"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </AppShell>
  );
}
