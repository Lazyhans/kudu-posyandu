import { supabase } from "@/integrations/supabase/client";
import { queryOptions } from "@tanstack/react-query";

export type Balita = {
  id: string;
  nama_lengkap: string;
  nik: string;
  tanggal_lahir: string;
  jenis_kelamin: "L" | "P";
  nama_orangtua: string;
  alamat_rt: string;
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
