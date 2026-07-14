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

export const Route = createFileRoute("/lansia/tambah")({
  component: TambahLansia,
});

function TambahLansia() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [form, setForm] = useState({
    nama_lengkap: "", nik: "", tanggal_lahir: "", jenis_kelamin: "L",
    alamat: "", rt: "", rw: "", no_hp: "",
  });
  const [loading, setLoading] = useState(false);
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm({ ...form, [k]: e.target.value });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nama_lengkap || !form.nik || !form.tanggal_lahir || !form.rt || !form.rw) {
      toast.error("Nama, NIK, tanggal lahir, RT, dan RW wajib diisi"); return;
    }
    if (form.nik.length !== 16 || !/^\d+$/.test(form.nik)) { toast.error("NIK harus 16 digit angka"); return; }
    setLoading(true);
    const { error } = await supabase.from("lansia" as never).insert({
      nama_lengkap: form.nama_lengkap, nik: form.nik, tanggal_lahir: form.tanggal_lahir,
      jenis_kelamin: form.jenis_kelamin,
      alamat: form.alamat || null, rt: form.rt.padStart(2, "0"), rw: form.rw.padStart(2, "0"),
      no_hp: form.no_hp || null,
    } as never);
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Data lansia ditambahkan");
    qc.invalidateQueries({ queryKey: ["lansia"] });
    navigate({ to: "/lansia" });
  };

  return (
    <AppShell title="Tambah Lansia">
      <Card className="rounded-2xl"><CardContent className="p-4">
        <form onSubmit={submit} className="space-y-4">
          <Field label="Nama Lengkap"><Input value={form.nama_lengkap} onChange={set("nama_lengkap")} className="h-12" /></Field>
          <Field label="NIK (16 digit)"><Input value={form.nik} onChange={set("nik")} inputMode="numeric" maxLength={16} className="h-12" /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Tanggal Lahir"><Input type="date" value={form.tanggal_lahir} onChange={set("tanggal_lahir")} className="h-12" /></Field>
            <Field label="Jenis Kelamin">
              <select value={form.jenis_kelamin} onChange={set("jenis_kelamin")}
                className="h-12 w-full rounded-md border border-input bg-background px-3">
                <option value="L">Laki-laki</option><option value="P">Perempuan</option>
              </select>
            </Field>
          </div>
          <Field label="Alamat"><Input value={form.alamat} onChange={set("alamat")} className="h-12" /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="RT"><Input value={form.rt} onChange={set("rt")} inputMode="numeric" className="h-12" /></Field>
            <Field label="RW"><Input value={form.rw} onChange={set("rw")} inputMode="numeric" className="h-12" /></Field>
          </div>
          <Field label="No. HP (opsional)"><Input value={form.no_hp} onChange={set("no_hp")} inputMode="tel" className="h-12" /></Field>
          <Button type="submit" disabled={loading} className="h-12 w-full rounded-xl text-base font-semibold">
            {loading ? "Menyimpan..." : "Simpan Data Lansia"}
          </Button>
        </form>
      </CardContent></Card>
    </AppShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label className="text-sm font-medium">{label}</Label>{children}</div>;
}
