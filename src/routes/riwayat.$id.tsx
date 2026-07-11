import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { balitaByIdQuery, pencatatanByBalitaQuery, type Pencatatan } from "@/lib/queries";
import { badgeGizi, hitungUsiaBulan, hitungStatusGizi, type StatusGizi } from "@/lib/gizi";
import { exportToCSV } from "@/lib/export";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Download, ArrowLeft, Calendar, Scale, Ruler, Pencil, Trash2, Loader2 } from "lucide-react";

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
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Pencatatan | null>(null);
  const [deleting, setDeleting] = useState<Pencatatan | null>(null);
  const [busy, setBusy] = useState(false);

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

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["pencatatan"] });
    qc.invalidateQueries({ queryKey: ["pencatatan", "balita", id] });
  };

  async function handleUpdate(form: { tanggal: string; berat_badan: number; tinggi_badan: number; catatan: string | null }) {
    if (!editing || !balita) return;
    setBusy(true);
    const usia = hitungUsiaBulan(balita.tanggal_lahir);
    const status = hitungStatusGizi(form.berat_badan, form.tinggi_badan, usia, balita.jenis_kelamin);
    const { error } = await supabase
      .from("pencatatan" as never)
      .update({ ...form, status_gizi: status } as never)
      .eq("id", editing.id);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Catatan diperbarui");
    invalidate();
    setEditing(null);
  }

  async function handleDelete() {
    if (!deleting) return;
    setBusy(true);
    const { error } = await supabase.from("pencatatan" as never).delete().eq("id", deleting.id);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Catatan dihapus");
    invalidate();
    setDeleting(null);
  }

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
              <div>Alamat: RT {balita.rt ?? "-"} / RW {balita.rw ?? "-"}</div>
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
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <Button size="sm" variant="outline" className="h-9 rounded-lg" onClick={() => setEditing(p)}>
                        <Pencil className="mr-1 h-4 w-4" /> Ubah
                      </Button>
                      <Button size="sm" variant="destructive" className="h-9 rounded-lg" onClick={() => setDeleting(p)}>
                        <Trash2 className="mr-1 h-4 w-4" /> Hapus
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <EditPencatatanDialog
        pencatatan={editing}
        onClose={() => setEditing(null)}
        onSubmit={handleUpdate}
        busy={busy}
      />

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus catatan penimbangan?</AlertDialogTitle>
            <AlertDialogDescription>
              Catatan tanggal <strong>{deleting && new Date(deleting.tanggal).toLocaleDateString("id-ID")}</strong> akan dihapus permanen dan tidak dapat dikembalikan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); handleDelete(); }}
              disabled={busy}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
}

function EditPencatatanDialog({
  pencatatan,
  onClose,
  onSubmit,
  busy,
}: {
  pencatatan: Pencatatan | null;
  onClose: () => void;
  onSubmit: (f: { tanggal: string; berat_badan: number; tinggi_badan: number; catatan: string | null }) => void;
  busy: boolean;
}) {
  const [form, setForm] = useState<{ tanggal: string; bb: string; tb: string; catatan: string } | null>(null);
  if (pencatatan && !form) {
    setForm({
      tanggal: pencatatan.tanggal,
      bb: String(pencatatan.berat_badan),
      tb: String(pencatatan.tinggi_badan),
      catatan: pencatatan.catatan ?? "",
    });
  }
  if (!pencatatan && form) setForm(null);

  return (
    <Dialog open={!!pencatatan} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Ubah Catatan Penimbangan</DialogTitle>
          <DialogDescription>
            Perbaiki berat, tinggi, atau catatan. Status gizi akan dihitung ulang otomatis.
          </DialogDescription>
        </DialogHeader>
        {form && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const bb = parseFloat(form.bb);
              const tb = parseFloat(form.tb);
              if (!bb || !tb) return toast.error("Berat & tinggi harus diisi");
              onSubmit({
                tanggal: form.tanggal,
                berat_badan: bb,
                tinggi_badan: tb,
                catatan: form.catatan.trim() || null,
              });
            }}
            className="space-y-3"
          >
            <div className="space-y-1.5">
              <Label>Tanggal</Label>
              <Input
                type="date"
                value={form.tanggal}
                onChange={(e) => setForm((f) => f && { ...f, tanggal: e.target.value })}
                className="h-11"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Berat (kg)</Label>
                <Input
                  type="number"
                  step="0.1"
                  inputMode="decimal"
                  value={form.bb}
                  onChange={(e) => setForm((f) => f && { ...f, bb: e.target.value })}
                  className="h-11"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label>Tinggi (cm)</Label>
                <Input
                  type="number"
                  step="0.1"
                  inputMode="decimal"
                  value={form.tb}
                  onChange={(e) => setForm((f) => f && { ...f, tb: e.target.value })}
                  className="h-11"
                  required
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Catatan (opsional)</Label>
              <Textarea
                value={form.catatan}
                onChange={(e) => setForm((f) => f && { ...f, catatan: e.target.value })}
                rows={3}
              />
            </div>
            <DialogFooter className="gap-2 sm:gap-2">
              <Button type="button" variant="outline" onClick={onClose} disabled={busy}>Batal</Button>
              <Button type="submit" disabled={busy}>
                {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Simpan
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
