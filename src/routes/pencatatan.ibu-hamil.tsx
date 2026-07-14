import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import {
  Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem,
} from "@/components/ui/command";
import { ibuHamilListQuery, hitungUsiaTahun } from "@/lib/queries";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ChevronsUpDown, Check } from "lucide-react";

export const Route = createFileRoute("/pencatatan/ibu-hamil")({
  loader: ({ context }) => { context.queryClient.ensureQueryData(ibuHamilListQuery()); },
  component: CatatIbuHamil,
});

function CatatIbuHamil() {
  const { data } = useSuspenseQuery(ibuHamilListQuery());
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [id, setId] = useState("");
  const [tanggal, setTanggal] = useState(() => new Date().toISOString().slice(0, 10));
  const [bb, setBb] = useState(""); const [lp, setLp] = useState("");
  const [ll, setLl] = useState(""); const [tensi, setTensi] = useState("");
  const [gula, setGula] = useState(""); const [catatan, setCatatan] = useState("");
  const [loading, setLoading] = useState(false);
  const selected = data.find((b) => b.id === id);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return toast.error("Pilih ibu hamil terlebih dahulu");
    if (!bb) return toast.error("Isi berat badan");
    setLoading(true);
    const { error } = await supabase.from("pencatatan_ibu_hamil" as never).insert({
      ibu_hamil_id: id, tanggal,
      berat_badan: parseFloat(bb),
      lingkar_perut: lp ? parseFloat(lp) : null,
      lingkar_lengan: ll ? parseFloat(ll) : null,
      tensi: tensi || null,
      gula: gula ? parseFloat(gula) : null,
      catatan: catatan || null,
    } as never);
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Pencatatan tersimpan");
    qc.invalidateQueries({ queryKey: ["pencatatan_ibu_hamil"] });
    navigate({ to: "/riwayat/ibu-hamil/$id", params: { id } });
  };

  return (
    <AppShell title="Catat Bulanan Ibu Hamil">
      <Card className="rounded-2xl"><CardContent className="p-4">
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Pilih Ibu Hamil</Label>
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" role="combobox" className="h-12 w-full justify-between rounded-xl px-3">
                  <span className="truncate">{selected ? `${selected.nama_lengkap} (${selected.nik})` : "Cari nama ibu hamil..."}</span>
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0" align="start">
                <Command>
                  <CommandInput placeholder="Ketik nama atau NIK..." />
                  <CommandList>
                    <CommandEmpty>Tidak ditemukan.</CommandEmpty>
                    <CommandGroup>
                      {data.map((b) => (
                        <CommandItem key={b.id} value={`${b.nama_lengkap} ${b.nik}`}
                          onSelect={() => { setId(b.id); setOpen(false); }}>
                          <span className="flex-1 truncate">{b.nama_lengkap} ({b.nik})</span>
                          {id === b.id && <Check className="ml-2 h-4 w-4" />}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            {selected && (
              <div className="text-xs text-muted-foreground">
                {hitungUsiaTahun(selected.tanggal_lahir)} tahun · RT {selected.rt}/RW {selected.rw}
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>Tanggal</Label>
            <Input type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)} className="h-12" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label>Berat Badan (kg)</Label>
              <Input type="number" step="0.1" inputMode="decimal" value={bb} onChange={(e) => setBb(e.target.value)} className="h-12 text-lg" placeholder="0.0" /></div>
            <div className="space-y-1.5"><Label>Lingkar Perut (cm)</Label>
              <Input type="number" step="0.1" inputMode="decimal" value={lp} onChange={(e) => setLp(e.target.value)} className="h-12 text-lg" placeholder="0.0" /></div>
            <div className="space-y-1.5"><Label>Lingkar Lengan (cm)</Label>
              <Input type="number" step="0.1" inputMode="decimal" value={ll} onChange={(e) => setLl(e.target.value)} className="h-12 text-lg" placeholder="0.0" /></div>
            <div className="space-y-1.5"><Label>Tensi (mmHg)</Label>
              <Input value={tensi} onChange={(e) => setTensi(e.target.value)} className="h-12 text-lg" placeholder="120/80" /></div>
            <div className="space-y-1.5 col-span-2"><Label>Gula Darah (mg/dL)</Label>
              <Input type="number" step="0.1" inputMode="decimal" value={gula} onChange={(e) => setGula(e.target.value)} className="h-12 text-lg" placeholder="0" /></div>
          </div>
          <div className="space-y-1.5">
            <Label>Catatan (opsional)</Label>
            <Textarea value={catatan} onChange={(e) => setCatatan(e.target.value)} rows={3} placeholder="Keluhan, konsumsi TTD, dll." />
          </div>
          <Button type="submit" disabled={loading} className="h-12 w-full rounded-xl text-base font-semibold">
            {loading ? "Menyimpan..." : "Simpan Pencatatan"}
          </Button>
        </form>
      </CardContent></Card>
    </AppShell>
  );
}
