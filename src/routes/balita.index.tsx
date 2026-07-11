import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
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
import { balitaListQuery, type Balita } from "@/lib/queries";
import { hitungUsiaBulan } from "@/lib/gizi";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Search,
  UserPlus,
  Pencil,
  Trash2,
  History,
  Loader2,
} from "lucide-react";

export const Route = createFileRoute("/balita/")({
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(balitaListQuery());
  },
  component: BalitaList,
});

function BalitaList() {
  const { data: balita } = useSuspenseQuery(balitaListQuery());
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<Balita | null>(null);
  const [deleting, setDeleting] = useState<Balita | null>(null);
  const [busy, setBusy] = useState(false);

  const filtered = balita.filter(
    (b) =>
      b.nama_lengkap.toLowerCase().includes(q.toLowerCase()) ||
      b.nik.includes(q),
  );

  async function handleUpdate(form: Omit<Balita, "id" | "created_at" | "updated_at">) {
    if (!editing) return;
    setBusy(true);
    const rt = (form.rt ?? "").padStart(2, "0");
    const rw = (form.rw ?? "").padStart(2, "0");
    const payload = { ...form, rt, rw, alamat_rt: `RT ${rt} / RW ${rw}` };
    const { error } = await supabase
      .from("balita" as never)
      .update(payload as never)
      .eq("id", editing.id);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Data balita diperbarui");
    qc.invalidateQueries({ queryKey: ["balita"] });
    setEditing(null);
  }

  async function handleDelete() {
    if (!deleting) return;
    setBusy(true);
    const { error } = await supabase
      .from("balita" as never)
      .delete()
      .eq("id", deleting.id);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Data balita dihapus");
    qc.invalidateQueries({ queryKey: ["balita"] });
    qc.invalidateQueries({ queryKey: ["pencatatan"] });
    setDeleting(null);
  }

  return (
    <AppShell title="Kelola Balita">
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
          <Link to="/balita/tambah">
            <UserPlus className="mr-2 h-4 w-4" /> Tambah Balita Baru
          </Link>
        </Button>

        <div className="text-xs text-muted-foreground">
          Total {filtered.length} dari {balita.length} balita
        </div>

        {filtered.length === 0 ? (
          <Card className="rounded-2xl">
            <CardContent className="p-6 text-center text-sm text-muted-foreground">
              {balita.length === 0 ? "Belum ada balita terdaftar." : "Tidak ditemukan."}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {filtered.map((b) => (
              <Card key={b.id} className="rounded-2xl">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-primary/10 text-primary font-bold">
                      {b.nama_lengkap.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold">{b.nama_lengkap}</div>
                      <div className="truncate text-xs text-muted-foreground">
                        NIK {b.nik} · {b.jenis_kelamin === "L" ? "Laki-laki" : "Perempuan"} · {hitungUsiaBulan(b.tanggal_lahir)} bln
                      </div>
                      <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                        <span className="rounded bg-primary/10 px-1.5 py-0.5 font-semibold text-primary">RT {b.rt ?? "-"}/RW {b.rw ?? "-"}</span>
                        <span className="truncate">Ibu {b.nama_orangtua}</span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    <Button asChild size="sm" variant="secondary" className="h-10 rounded-lg">
                      <Link to="/riwayat/$id" params={{ id: b.id }}>
                        <History className="mr-1 h-4 w-4" /> Riwayat
                      </Link>
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-10 rounded-lg"
                      onClick={() => setEditing(b)}
                    >
                      <Pencil className="mr-1 h-4 w-4" /> Ubah
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      className="h-10 rounded-lg"
                      onClick={() => setDeleting(b)}
                    >
                      <Trash2 className="mr-1 h-4 w-4" /> Hapus
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <EditDialog
        balita={editing}
        onClose={() => setEditing(null)}
        onSubmit={handleUpdate}
        busy={busy}
      />

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus data balita?</AlertDialogTitle>
            <AlertDialogDescription>
              Data <strong>{deleting?.nama_lengkap}</strong> beserta seluruh riwayat pencatatannya akan dihapus permanen dari database.
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

function EditDialog({
  balita,
  onClose,
  onSubmit,
  busy,
}: {
  balita: Balita | null;
  onClose: () => void;
  onSubmit: (form: Omit<Balita, "id" | "created_at" | "updated_at">) => void;
  busy: boolean;
}) {
  const [form, setForm] = useState<Omit<Balita, "id" | "created_at" | "updated_at"> | null>(null);

  // Sync when open changes
  if (balita && !form) {
    setForm({
      nama_lengkap: balita.nama_lengkap,
      nik: balita.nik,
      tanggal_lahir: balita.tanggal_lahir,
      jenis_kelamin: balita.jenis_kelamin,
      nama_orangtua: balita.nama_orangtua,
      alamat_rt: balita.alamat_rt,
      rt: balita.rt ?? "",
      rw: balita.rw ?? "",
    });
  }
  if (!balita && form) setForm(null);

  const set = (k: keyof NonNullable<typeof form>) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((f) => (f ? { ...f, [k]: e.target.value } : f));

  return (
    <Dialog open={!!balita} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Ubah Data Balita</DialogTitle>
          <DialogDescription>Perbarui informasi identitas balita.</DialogDescription>
        </DialogHeader>
        {form && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (form.nik.length !== 16 || !/^\d+$/.test(form.nik)) {
                toast.error("NIK harus 16 digit angka");
                return;
              }
              onSubmit(form);
            }}
            className="space-y-3"
          >
            <div className="space-y-1.5">
              <Label>Nama Lengkap</Label>
              <Input value={form.nama_lengkap} onChange={set("nama_lengkap")} className="h-11" required />
            </div>
            <div className="space-y-1.5">
              <Label>NIK</Label>
              <Input value={form.nik} onChange={set("nik")} inputMode="numeric" maxLength={16} className="h-11" required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Tanggal Lahir</Label>
                <Input type="date" value={form.tanggal_lahir} onChange={set("tanggal_lahir")} className="h-11" required />
              </div>
              <div className="space-y-1.5">
                <Label>Jenis Kelamin</Label>
                <select
                  value={form.jenis_kelamin}
                  onChange={set("jenis_kelamin")}
                  className="h-11 w-full rounded-md border border-input bg-background px-3"
                >
                  <option value="L">Laki-laki</option>
                  <option value="P">Perempuan</option>
                </select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Nama Orang Tua</Label>
              <Input value={form.nama_orangtua} onChange={set("nama_orangtua")} className="h-11" required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>RT</Label>
                <Input value={form.rt ?? ""} onChange={set("rt")} inputMode="numeric" className="h-11" required />
              </div>
              <div className="space-y-1.5">
                <Label>RW</Label>
                <Input value={form.rw ?? ""} onChange={set("rw")} inputMode="numeric" className="h-11" required />
              </div>
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
