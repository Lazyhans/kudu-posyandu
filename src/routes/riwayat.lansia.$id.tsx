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
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { lansiaByIdQuery, pencatatanLansiaByIdQuery, hitungUsiaTahun, type PencatatanLansia } from "@/lib/queries";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, Calendar, Pencil, Trash2, Loader2 } from "lucide-react";

export const Route = createFileRoute("/riwayat/lansia/$id")({
  loader: ({ context, params }) => {
    context.queryClient.ensureQueryData(lansiaByIdQuery(params.id));
    context.queryClient.ensureQueryData(pencatatanLansiaByIdQuery(params.id));
  },
  component: RiwayatLansia,
});

function RiwayatLansia() {
  const { id } = Route.useParams();
  const { data: l } = useSuspenseQuery(lansiaByIdQuery(id));
  const { data: catatan } = useSuspenseQuery(pencatatanLansiaByIdQuery(id));
  const qc = useQueryClient();
  const [editing, setEditing] = useState<PencatatanLansia | null>(null);
  const [deleting, setDeleting] = useState<PencatatanLansia | null>(null);
  const [busy, setBusy] = useState(false);

  if (!l) return <AppShell title="Riwayat"><div className="p-4 text-center text-sm text-muted-foreground">Data tidak ditemukan.</div></AppShell>;

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["pencatatan_lansia"] });
    qc.invalidateQueries({ queryKey: ["pencatatan_lansia", "row", id] });
  };

  async function handleUpdate(f: Partial<PencatatanLansia>) {
    if (!editing) return;
    setBusy(true);
    const { error } = await supabase.from("pencatatan_lansia" as never).update(f as never).eq("id", editing.id);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Catatan diperbarui"); invalidate(); setEditing(null);
  }
  async function handleDelete() {
    if (!deleting) return;
    setBusy(true);
    const { error } = await supabase.from("pencatatan_lansia" as never).delete().eq("id", deleting.id);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Catatan dihapus"); invalidate(); setDeleting(null);
  }

  return (
    <AppShell title={l.nama_lengkap}>
      <div className="space-y-3">
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link to="/riwayat"><ArrowLeft className="mr-1 h-4 w-4" /> Kembali</Link>
        </Button>

        <Card className="rounded-2xl bg-amber-500/5"><CardContent className="p-4">
          <div className="text-base font-bold">{l.nama_lengkap}</div>
          <div className="mt-1 text-xs text-muted-foreground space-y-0.5">
            <div>NIK: {l.nik}</div>
            <div>{l.jenis_kelamin === "L" ? "Laki-laki" : l.jenis_kelamin === "P" ? "Perempuan" : "-"} · {hitungUsiaTahun(l.tanggal_lahir)} tahun</div>
            <div>Alamat: {l.alamat ?? "-"} · RT {l.rt ?? "-"} / RW {l.rw ?? "-"}</div>
            {l.no_hp && <div>HP: {l.no_hp}</div>}
          </div>
        </CardContent></Card>

        <Button asChild className="h-12 w-full rounded-xl">
          <Link to="/pencatatan/lansia"><Calendar className="mr-2 h-4 w-4" /> Tambah Catatan</Link>
        </Button>

        <div className="pt-2 text-sm font-semibold text-muted-foreground">Riwayat Pencatatan ({catatan.length})</div>

        {catatan.length === 0 ? (
          <Card className="rounded-2xl"><CardContent className="p-6 text-center text-sm text-muted-foreground">Belum ada catatan.</CardContent></Card>
        ) : (
          <div className="space-y-2">
            {catatan.map((p) => (
              <Card key={p.id} className="rounded-2xl"><CardContent className="p-4">
                <div className="text-xs font-medium text-muted-foreground">
                  {new Date(p.tanggal).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                  <div>BB: <span className="font-semibold">{p.berat_badan}</span> kg</div>
                  <div>Lingkar Badan: <span className="font-semibold">{p.lingkar_badan ?? "-"}</span> cm</div>
                  <div>Tensi: <span className="font-semibold">{p.tensi ?? "-"}</span></div>
                  <div>Gula: <span className="font-semibold">{p.gula ?? "-"}</span> mg/dL</div>
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
              </CardContent></Card>
            ))}
          </div>
        )}
      </div>

      <EditDialog data={editing} onClose={() => setEditing(null)} onSubmit={handleUpdate} busy={busy} />

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus catatan?</AlertDialogTitle>
            <AlertDialogDescription>
              Catatan <strong>{deleting && new Date(deleting.tanggal).toLocaleDateString("id-ID")}</strong> akan dihapus permanen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={(e) => { e.preventDefault(); handleDelete(); }} disabled={busy}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />} Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
}

function EditDialog({ data, onClose, onSubmit, busy }: {
  data: PencatatanLansia | null; onClose: () => void;
  onSubmit: (f: Partial<PencatatanLansia>) => void; busy: boolean;
}) {
  const [form, setForm] = useState<{ tanggal: string; bb: string; lb: string; tensi: string; gula: string; catatan: string } | null>(null);
  if (data && !form) setForm({
    tanggal: data.tanggal, bb: String(data.berat_badan),
    lb: data.lingkar_badan != null ? String(data.lingkar_badan) : "",
    tensi: data.tensi ?? "", gula: data.gula != null ? String(data.gula) : "",
    catatan: data.catatan ?? "",
  });
  if (!data && form) setForm(null);

  return (
    <Dialog open={!!data} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Ubah Catatan</DialogTitle><DialogDescription>Perbaiki data catatan lansia.</DialogDescription></DialogHeader>
        {form && (
          <form onSubmit={(e) => { e.preventDefault();
            if (!form.bb) return toast.error("Berat badan wajib diisi");
            onSubmit({
              tanggal: form.tanggal, berat_badan: parseFloat(form.bb),
              lingkar_badan: form.lb ? parseFloat(form.lb) : null,
              tensi: form.tensi || null,
              gula: form.gula ? parseFloat(form.gula) : null,
              catatan: form.catatan.trim() || null,
            });
          }} className="space-y-3">
            <div className="space-y-1.5"><Label>Tanggal</Label>
              <Input type="date" value={form.tanggal} onChange={(e) => setForm((f) => f && { ...f, tanggal: e.target.value })} className="h-11" required /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Berat (kg)</Label>
                <Input type="number" step="0.1" value={form.bb} onChange={(e) => setForm((f) => f && { ...f, bb: e.target.value })} className="h-11" required /></div>
              <div className="space-y-1.5"><Label>Lingkar Badan</Label>
                <Input type="number" step="0.1" value={form.lb} onChange={(e) => setForm((f) => f && { ...f, lb: e.target.value })} className="h-11" /></div>
              <div className="space-y-1.5"><Label>Tensi</Label>
                <Input value={form.tensi} onChange={(e) => setForm((f) => f && { ...f, tensi: e.target.value })} className="h-11" /></div>
              <div className="space-y-1.5"><Label>Gula (mg/dL)</Label>
                <Input type="number" step="0.1" value={form.gula} onChange={(e) => setForm((f) => f && { ...f, gula: e.target.value })} className="h-11" /></div>
            </div>
            <div className="space-y-1.5"><Label>Catatan</Label>
              <Textarea value={form.catatan} onChange={(e) => setForm((f) => f && { ...f, catatan: e.target.value })} rows={3} /></div>
            <DialogFooter className="gap-2 sm:gap-2">
              <Button type="button" variant="outline" onClick={onClose} disabled={busy}>Batal</Button>
              <Button type="submit" disabled={busy}>{busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Simpan</Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
