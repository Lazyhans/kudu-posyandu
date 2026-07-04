
-- Restrict balita/pencatatan reads to staff only
DROP POLICY IF EXISTS "public read balita" ON public.balita;
DROP POLICY IF EXISTS "public read pencatatan" ON public.pencatatan;

CREATE POLICY "staff read balita" ON public.balita
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'kader'::app_role));

CREATE POLICY "staff read pencatatan" ON public.pencatatan
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'kader'::app_role));

REVOKE SELECT ON public.balita FROM anon;
REVOKE SELECT ON public.pencatatan FROM anon;

-- Lock down has_role: only authenticated users need to call it (RLS policies)
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;

-- Public aggregate stats function (no PII), safe for anonymous callers
CREATE OR REPLACE FUNCTION public.get_public_stats()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH latest AS (
    SELECT DISTINCT ON (balita_id) balita_id, status_gizi
    FROM public.pencatatan
    ORDER BY balita_id, tanggal DESC
  ), counts AS (
    SELECT
      COUNT(*) FILTER (WHERE status_gizi = 'Normal')::int AS normal,
      COUNT(*) FILTER (WHERE status_gizi = 'Gizi Kurang')::int AS gizi_kurang,
      COUNT(*) FILTER (WHERE status_gizi = 'Berisiko Stunting')::int AS berisiko_stunting,
      COUNT(*) FILTER (WHERE status_gizi = 'Gizi Lebih')::int AS gizi_lebih,
      COUNT(*)::int AS tercatat
    FROM latest
  )
  SELECT jsonb_build_object(
    'normal', counts.normal,
    'gizi_kurang', counts.gizi_kurang,
    'berisiko_stunting', counts.berisiko_stunting,
    'gizi_lebih', counts.gizi_lebih,
    'tercatat', counts.tercatat,
    'total_balita', (SELECT COUNT(*)::int FROM public.balita)
  ) FROM counts;
$$;

REVOKE EXECUTE ON FUNCTION public.get_public_stats() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_stats() TO anon, authenticated, service_role;
