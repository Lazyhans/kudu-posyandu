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
