import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export const Route = createFileRoute("/balita/tambah")({
  component: TambahBalita,
});

function TambahBalita() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [form, setForm] = useState({
    nama_lengkap: "", nik: "", tanggal_lahir: "", jenis_kelamin: "L",
    nama_orangtua: "", alamat_rt: "",
  });
  const [loading, setLoading] = useState(false);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm({ ...form, [k]: e.target.value });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nama_lengkap || !form.nik || !form.tanggal_lahir || !form.nama_orangtua || !form.alamat_rt) {
      toast.error("Semua isian wajib diisi");
      return;
    }
    if (form.nik.length !== 16 || !/^\d+$/.test(form.nik)) {
      toast.error("NIK harus 16 digit angka");
      return;
    }
    setLoading(true);
    const { error } = await supabase.from("balita" as never).insert(form as never);
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Balita berhasil ditambahkan");
    qc.invalidateQueries({ queryKey: ["balita"] });
    navigate({ to: "/balita" });
  };

  return (
    <AppShell title="Tambah Balita">
      <Card className="rounded-2xl">
        <CardContent className="p-4">
          <form onSubmit={submit} className="space-y-4">
            <Field label="Nama Lengkap">
              <Input value={form.nama_lengkap} onChange={set("nama_lengkap")} className="h-12" placeholder="Nama lengkap balita" />
            </Field>
            <Field label="NIK Anak (16 digit)">
              <Input value={form.nik} onChange={set("nik")} inputMode="numeric" maxLength={16} className="h-12" placeholder="16 digit NIK" />
            </Field>
            <Field label="Tanggal Lahir">
              <Input type="date" value={form.tanggal_lahir} onChange={set("tanggal_lahir")} className="h-12" />
            </Field>
            <Field label="Jenis Kelamin">
              <select value={form.jenis_kelamin} onChange={set("jenis_kelamin")}
                className="h-12 w-full rounded-md border border-input bg-background px-3">
                <option value="L">Laki-laki</option>
                <option value="P">Perempuan</option>
              </select>
            </Field>
            <Field label="Nama Ibu / Orang Tua">
              <Input value={form.nama_orangtua} onChange={set("nama_orangtua")} className="h-12" placeholder="Nama ibu/orang tua" />
            </Field>
            <Field label="Alamat RT / RW">
              <Input value={form.alamat_rt} onChange={set("alamat_rt")} className="h-12" placeholder="Contoh: RT 03 / RW 04" />
            </Field>
            <Button type="submit" disabled={loading} className="h-12 w-full rounded-xl text-base font-semibold">
              {loading ? "Menyimpan..." : "Simpan Data Balita"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </AppShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium">{label}</Label>
      {children}
    </div>
  );
}
