import { createServerFn } from "@tanstack/react-start";

export type PublicStats = {
  normal: number;
  gizi_kurang: number;
  berisiko_stunting: number;
  gizi_lebih: number;
  tercatat: number;
  total_balita: number;
};

// Public aggregate stats — no PII. Uses service_role via a SECURITY DEFINER RPC
// so anonymous visitors can render the chart without direct table access.
export const getPublicStats = createServerFn({ method: "GET" }).handler(
  async (): Promise<PublicStats> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin.rpc("get_public_stats" as never);
    if (error) throw error;
    const d = (data ?? {}) as Partial<PublicStats>;
    return {
      normal: d.normal ?? 0,
      gizi_kurang: d.gizi_kurang ?? 0,
      berisiko_stunting: d.berisiko_stunting ?? 0,
      gizi_lebih: d.gizi_lebih ?? 0,
      tercatat: d.tercatat ?? 0,
      total_balita: d.total_balita ?? 0,
    };
  },
);
