import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import {
  UserPlus,
  ClipboardPlus,
  Users,
  Scale,
  TrendingUp,
  Activity,
  Home,
  UserCog,
  Pencil,
  Trash2,
  MapPin,
  Loader2,
} from "lucide-react";
import {
  listKader,
  createKader,
  updateKader,
  deleteKader,
} from "@/lib/admin.functions";
import { toast } from "sonner";
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

export const Route = createFileRoute("/admin")({
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(balitaListQuery());
    context.queryClient.ensureQueryData(pencatatanListQuery());
  },
  component: AdminDashboard,
});

const STATUS_COLORS: Record<StatusGizi, string> = {
  Normal: "var(--success)",
  "Gizi Kurang": "var(--warning)",
  "Berisiko Stunting": "var(--danger)",
  "Gizi Lebih": "#3b82f6",
};

function AdminDashboard() {
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
    <AppShell title="Dashboard Admin" requireRole="admin">
      <div className="space-y-4">
        <div className="rounded-2xl bg-gradient-to-br from-primary to-[color:var(--chart-5)] p-5 text-primary-foreground shadow-md">
          <div className="text-xs font-medium uppercase tracking-wider opacity-90">
            KKN PPM XXVIII Universitas Semarang
          </div>
          <div className="mt-1 text-lg font-semibold">Panel Admin Posyandu</div>
          <div className="mt-2 text-sm opacity-90">
            Kelola data balita & pencatatan tumbuh kembang Kelurahan Kudu.
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
            <Link to="/ibu-hamil"><Users className="mr-2 h-5 w-5" /> Kelola Ibu Hamil</Link>
          </Button>
          <Button asChild size="lg" variant="secondary" className="h-16 rounded-xl text-sm font-semibold">
            <Link to="/pencatatan/ibu-hamil"><ClipboardPlus className="mr-2 h-5 w-5" /> Catat Ibu Hamil</Link>
          </Button>
          <Button asChild size="lg" className="h-16 rounded-xl text-sm font-semibold bg-amber-600 hover:bg-amber-700">
            <Link to="/lansia"><Users className="mr-2 h-5 w-5" /> Kelola Lansia</Link>
          </Button>
          <Button asChild size="lg" variant="secondary" className="h-16 rounded-xl text-sm font-semibold">
            <Link to="/pencatatan/lansia"><ClipboardPlus className="mr-2 h-5 w-5" /> Catat Lansia</Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="h-16 rounded-xl text-sm font-semibold col-span-2">
            <Link to="/"><Home className="mr-2 h-5 w-5" /> Halaman Publik</Link>
          </Button>
        </div>


        <Card className="rounded-2xl">
          <CardContent className="p-4">
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
              <TrendingUp className="h-4 w-4 text-primary" /> Distribusi Status Gizi
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

        <KaderManagement />
      </div>
    </AppShell>
  );
}

type KaderRow = {
  id: string;
  user_id: string;
  nama_lengkap: string;
  username: string;
  posko_rt: string | null;
  posko_rw: string;
  no_hp: string | null;
};

function KaderManagement() {
  const qc = useQueryClient();
  const list = useServerFn(listKader);
  const create = useServerFn(createKader);
  const update = useServerFn(updateKader);
  const remove = useServerFn(deleteKader);

  const { data: kader = [], isLoading } = useQuery({
    queryKey: ["kader"],
    queryFn: () => list({}),
  });

  const [openCreate, setOpenCreate] = useState(false);
  const [editing, setEditing] = useState<KaderRow | null>(null);
  const [deleting, setDeleting] = useState<KaderRow | null>(null);
  const [busy, setBusy] = useState(false);

  const invalidate = () => qc.invalidateQueries({ queryKey: ["kader"] });

  return (
    <Card className="rounded-2xl">
      <CardContent className="p-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <UserCog className="h-4 w-4 text-primary" /> Kelola Kader Posyandu
          </div>
          <Button size="sm" className="h-9 rounded-lg" onClick={() => setOpenCreate(true)}>
            <UserPlus className="mr-1.5 h-4 w-4" /> Tambah
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : kader.length === 0 ? (
          <p className="py-4 text-center text-xs text-muted-foreground">
            Belum ada kader terdaftar.
          </p>
        ) : (
          <div className="space-y-2">
            {kader.map((k) => (
              <div key={k.id} className="rounded-xl border bg-card p-3">
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary/10 text-primary font-bold">
                    {k.nama_lengkap.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold">{k.nama_lengkap}</div>
                    <div className="truncate text-[11px] text-muted-foreground">
                      @{k.username}
                      {k.no_hp ? ` · ${k.no_hp}` : ""}
                    </div>
                    <div className="mt-0.5 flex items-center gap-1 text-[11px] text-primary">
                      <MapPin className="h-3 w-3" /> Posko RT {k.posko_rt ?? "-"} / RW {k.posko_rw}
                    </div>
                  </div>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-9 rounded-lg"
                    onClick={() => setEditing(k)}
                  >
                    <Pencil className="mr-1 h-4 w-4" /> Ubah
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    className="h-9 rounded-lg"
                    onClick={() => setDeleting(k)}
                  >
                    <Trash2 className="mr-1 h-4 w-4" /> Hapus
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        <KaderCreateDialog
          open={openCreate}
          onClose={() => setOpenCreate(false)}
          busy={busy}
          onSubmit={async (form) => {
            setBusy(true);
            try {
              await create({ data: form });
              toast.success("Kader ditambahkan");
              invalidate();
              setOpenCreate(false);
            } catch (e) {
              toast.error((e as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        />

        <KaderEditDialog
          kader={editing}
          onClose={() => setEditing(null)}
          busy={busy}
          onSubmit={async (form) => {
            if (!editing) return;
            setBusy(true);
            try {
              await update({ data: { id: editing.id, ...form } });
              toast.success("Data kader diperbarui");
              invalidate();
              setEditing(null);
            } catch (e) {
              toast.error((e as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        />

        <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Hapus kader?</AlertDialogTitle>
              <AlertDialogDescription>
                Akun <strong>{deleting?.nama_lengkap}</strong> (@{deleting?.username}) akan
                dihapus permanen dan tidak dapat login lagi.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={busy}>Batal</AlertDialogCancel>
              <AlertDialogAction
                disabled={busy}
                onClick={async (e) => {
                  e.preventDefault();
                  if (!deleting) return;
                  setBusy(true);
                  try {
                    await remove({ data: { id: deleting.id } });
                    toast.success("Kader dihapus");
                    invalidate();
                    setDeleting(null);
                  } catch (err) {
                    toast.error((err as Error).message);
                  } finally {
                    setBusy(false);
                  }
                }}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                Hapus
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}

type CreateForm = {
  nama_lengkap: string;
  username: string;
  password: string;
  posko_rt: string;
  posko_rw: string;
  no_hp: string;
};

function KaderCreateDialog({
  open,
  onClose,
  onSubmit,
  busy,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (f: CreateForm) => void;
  busy: boolean;
}) {
  const [form, setForm] = useState<CreateForm>({
    nama_lengkap: "",
    username: "",
    password: "",
    posko_rt: "",
    posko_rw: "",
    no_hp: "",
  });
  const set = (k: keyof CreateForm) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) {
          onClose();
          setForm({ nama_lengkap: "", username: "", password: "", posko_rt: "", posko_rw: "", no_hp: "" });
        }
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Tambah Kader Baru</DialogTitle>
          <DialogDescription>
            Kader dapat login untuk mencatat hasil posyandu di posko yang ditugaskan.
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit(form);
          }}
          className="space-y-3"
        >
          <div className="space-y-1.5">
            <Label>Nama Lengkap</Label>
            <Input value={form.nama_lengkap} onChange={set("nama_lengkap")} className="h-11" required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Username</Label>
              <Input value={form.username} onChange={set("username")} className="h-11" placeholder="mis. kader01" required />
            </div>
            <div className="space-y-1.5">
              <Label>Password</Label>
              <Input type="password" value={form.password} onChange={set("password")} className="h-11" placeholder="min. 8 karakter" required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Posko RT</Label>
              <Input value={form.posko_rt} onChange={set("posko_rt")} className="h-11" placeholder="mis. 03" required />
            </div>
            <div className="space-y-1.5">
              <Label>Posko RW</Label>
              <Input value={form.posko_rw} onChange={set("posko_rw")} className="h-11" placeholder="mis. 04" required />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>No. HP (opsional)</Label>
            <Input value={form.no_hp} onChange={set("no_hp")} className="h-11" inputMode="tel" />
          </div>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={busy}>Batal</Button>
            <Button type="submit" disabled={busy}>
              {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Simpan
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

type EditForm = { nama_lengkap: string; posko_rt: string; posko_rw: string; no_hp: string; password: string };

function KaderEditDialog({
  kader,
  onClose,
  onSubmit,
  busy,
}: {
  kader: KaderRow | null;
  onClose: () => void;
  onSubmit: (f: EditForm) => void;
  busy: boolean;
}) {
  const [form, setForm] = useState<EditForm | null>(null);
  if (kader && !form) {
    setForm({
      nama_lengkap: kader.nama_lengkap,
      posko_rt: kader.posko_rt ?? "",
      posko_rw: kader.posko_rw,
      no_hp: kader.no_hp ?? "",
      password: "",
    });
  }
  if (!kader && form) setForm(null);
  const set = (k: keyof EditForm) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => (f ? { ...f, [k]: e.target.value } : f));

  return (
    <Dialog open={!!kader} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Ubah Data Kader</DialogTitle>
          <DialogDescription>Perbarui data kader atau reset password.</DialogDescription>
        </DialogHeader>
        {form && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              onSubmit(form);
            }}
            className="space-y-3"
          >
            <div className="space-y-1.5">
              <Label>Nama Lengkap</Label>
              <Input value={form.nama_lengkap} onChange={set("nama_lengkap")} className="h-11" required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Posko RT</Label>
                <Input value={form.posko_rt} onChange={set("posko_rt")} className="h-11" required />
              </div>
              <div className="space-y-1.5">
                <Label>Posko RW</Label>
                <Input value={form.posko_rw} onChange={set("posko_rw")} className="h-11" required />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>No. HP</Label>
              <Input value={form.no_hp} onChange={set("no_hp")} className="h-11" inputMode="tel" />
            </div>
            <div className="space-y-1.5">
              <Label>Password Baru (opsional)</Label>
              <Input type="password" value={form.password} onChange={set("password")} className="h-11" placeholder="Kosongkan jika tidak diubah" />
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
