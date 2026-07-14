import { supabase } from "@/integrations/supabase/client";
import { queryOptions } from "@tanstack/react-query";

export type UserRole = "admin" | "kader" | null;

export const currentRoleQuery = () =>
  queryOptions({
    queryKey: ["auth", "role"],
    staleTime: 60_000,
    queryFn: async (): Promise<UserRole> => {
      const { data: sess } = await supabase.auth.getSession();
      const uid = sess.session?.user.id;
      if (!uid) return null;
      const { data, error } = await supabase
        .from("user_roles" as never)
        .select("role")
        .eq("user_id", uid);
      if (error) return null;
      const rows = (data ?? []) as unknown as Array<{ role: "admin" | "kader" }>;
      if (rows.some((r) => r.role === "admin")) return "admin";
      if (rows.some((r) => r.role === "kader")) return "kader";
      return null;
    },
  });


export type Balita = {
  id: string;
  nama_lengkap: string;
  nik: string;
  tanggal_lahir: string;
  jenis_kelamin: "L" | "P";
  nama_orangtua: string;
  alamat_rt: string;
  rt: string | null;
  rw: string | null;
  created_at: string;
  updated_at: string;
};

export type Pencatatan = {
  id: string;
  balita_id: string;
  tanggal: string;
  berat_badan: number;
  tinggi_badan: number;
  status_gizi: string;
  catatan: string | null;
  created_at: string;
};

export const balitaListQuery = () =>
  queryOptions({
    queryKey: ["balita"],
    queryFn: async (): Promise<Balita[]> => {
      const { data, error } = await supabase
        .from("balita" as never)
        .select("*")
        .order("nama_lengkap", { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as Balita[];
    },
  });

export const balitaByIdQuery = (id: string) =>
  queryOptions({
    queryKey: ["balita", id],
    queryFn: async (): Promise<Balita | null> => {
      const { data, error } = await supabase
        .from("balita" as never)
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as Balita | null;
    },
  });

export const pencatatanListQuery = () =>
  queryOptions({
    queryKey: ["pencatatan"],
    queryFn: async (): Promise<Pencatatan[]> => {
      const { data, error } = await supabase
        .from("pencatatan" as never)
        .select("*")
        .order("tanggal", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Pencatatan[];
    },
  });

export const pencatatanByBalitaQuery = (balitaId: string) =>
  queryOptions({
    queryKey: ["pencatatan", "balita", balitaId],
    queryFn: async (): Promise<Pencatatan[]> => {
      const { data, error } = await supabase
        .from("pencatatan" as never)
        .select("*")
        .eq("balita_id", balitaId)
        .order("tanggal", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Pencatatan[];
    },
  });

// ============ IBU HAMIL ============
export type IbuHamil = {
  id: string;
  nama_lengkap: string;
  nik: string;
  tanggal_lahir: string;
  alamat: string | null;
  rt: string | null;
  rw: string | null;
  no_hp: string | null;
  hpht: string | null;
  created_at: string;
  updated_at: string;
};

export type PencatatanIbuHamil = {
  id: string;
  ibu_hamil_id: string;
  tanggal: string;
  berat_badan: number;
  lingkar_perut: number | null;
  lingkar_lengan: number | null;
  tensi: string | null;
  gula: number | null;
  catatan: string | null;
  created_at: string;
};

export const ibuHamilListQuery = () =>
  queryOptions({
    queryKey: ["ibu_hamil"],
    queryFn: async (): Promise<IbuHamil[]> => {
      const { data, error } = await supabase
        .from("ibu_hamil" as never)
        .select("*")
        .order("nama_lengkap", { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as IbuHamil[];
    },
  });

export const ibuHamilByIdQuery = (id: string) =>
  queryOptions({
    queryKey: ["ibu_hamil", id],
    queryFn: async (): Promise<IbuHamil | null> => {
      const { data, error } = await supabase
        .from("ibu_hamil" as never)
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as IbuHamil | null;
    },
  });

export const pencatatanIbuHamilListQuery = () =>
  queryOptions({
    queryKey: ["pencatatan_ibu_hamil"],
    queryFn: async (): Promise<PencatatanIbuHamil[]> => {
      const { data, error } = await supabase
        .from("pencatatan_ibu_hamil" as never)
        .select("*")
        .order("tanggal", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as PencatatanIbuHamil[];
    },
  });

export const pencatatanIbuHamilByIdQuery = (ibuHamilId: string) =>
  queryOptions({
    queryKey: ["pencatatan_ibu_hamil", "row", ibuHamilId],
    queryFn: async (): Promise<PencatatanIbuHamil[]> => {
      const { data, error } = await supabase
        .from("pencatatan_ibu_hamil" as never)
        .select("*")
        .eq("ibu_hamil_id", ibuHamilId)
        .order("tanggal", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as PencatatanIbuHamil[];
    },
  });

// ============ LANSIA ============
export type Lansia = {
  id: string;
  nama_lengkap: string;
  nik: string;
  tanggal_lahir: string;
  jenis_kelamin: string | null;
  alamat: string | null;
  rt: string | null;
  rw: string | null;
  no_hp: string | null;
  created_at: string;
  updated_at: string;
};

export type PencatatanLansia = {
  id: string;
  lansia_id: string;
  tanggal: string;
  berat_badan: number;
  lingkar_badan: number | null;
  tensi: string | null;
  gula: number | null;
  catatan: string | null;
  created_at: string;
};

export const lansiaListQuery = () =>
  queryOptions({
    queryKey: ["lansia"],
    queryFn: async (): Promise<Lansia[]> => {
      const { data, error } = await supabase
        .from("lansia" as never)
        .select("*")
        .order("nama_lengkap", { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as Lansia[];
    },
  });

export const lansiaByIdQuery = (id: string) =>
  queryOptions({
    queryKey: ["lansia", id],
    queryFn: async (): Promise<Lansia | null> => {
      const { data, error } = await supabase
        .from("lansia" as never)
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as Lansia | null;
    },
  });

export const pencatatanLansiaListQuery = () =>
  queryOptions({
    queryKey: ["pencatatan_lansia"],
    queryFn: async (): Promise<PencatatanLansia[]> => {
      const { data, error } = await supabase
        .from("pencatatan_lansia" as never)
        .select("*")
        .order("tanggal", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as PencatatanLansia[];
    },
  });

export const pencatatanLansiaByIdQuery = (lansiaId: string) =>
  queryOptions({
    queryKey: ["pencatatan_lansia", "row", lansiaId],
    queryFn: async (): Promise<PencatatanLansia[]> => {
      const { data, error } = await supabase
        .from("pencatatan_lansia" as never)
        .select("*")
        .eq("lansia_id", lansiaId)
        .order("tanggal", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as PencatatanLansia[];
    },
  });

export function hitungUsiaTahun(tanggalLahir: string): number {
  const lahir = new Date(tanggalLahir);
  const now = new Date();
  let usia = now.getFullYear() - lahir.getFullYear();
  const m = now.getMonth() - lahir.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < lahir.getDate())) usia -= 1;
  return usia;
}

export function sortByRtRwUsia<T extends { rt: string | null; rw: string | null; tanggal_lahir: string }>(
  rows: T[],
): T[] {
  return [...rows].sort((a, b) => {
    const rw = (a.rw ?? "").localeCompare(b.rw ?? "");
    if (rw !== 0) return rw;
    const rt = (a.rt ?? "").localeCompare(b.rt ?? "");
    if (rt !== 0) return rt;
    return new Date(a.tanggal_lahir).getTime() - new Date(b.tanggal_lahir).getTime();
  });
}

