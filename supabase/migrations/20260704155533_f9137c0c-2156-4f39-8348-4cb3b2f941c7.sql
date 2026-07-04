
-- Inline role checks in policies so we can lock down has_role entirely.
-- balita
DROP POLICY IF EXISTS "staff read balita" ON public.balita;
DROP POLICY IF EXISTS "staff insert balita" ON public.balita;
DROP POLICY IF EXISTS "staff update balita" ON public.balita;
DROP POLICY IF EXISTS "staff delete balita" ON public.balita;

CREATE POLICY "staff read balita" ON public.balita FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role IN ('admin'::app_role,'kader'::app_role)));
CREATE POLICY "staff insert balita" ON public.balita FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role IN ('admin'::app_role,'kader'::app_role)));
CREATE POLICY "staff update balita" ON public.balita FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role IN ('admin'::app_role,'kader'::app_role)))
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role IN ('admin'::app_role,'kader'::app_role)));
CREATE POLICY "staff delete balita" ON public.balita FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role IN ('admin'::app_role,'kader'::app_role)));

-- pencatatan
DROP POLICY IF EXISTS "staff read pencatatan" ON public.pencatatan;
DROP POLICY IF EXISTS "staff insert pencatatan" ON public.pencatatan;
DROP POLICY IF EXISTS "staff update pencatatan" ON public.pencatatan;
DROP POLICY IF EXISTS "staff delete pencatatan" ON public.pencatatan;

CREATE POLICY "staff read pencatatan" ON public.pencatatan FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role IN ('admin'::app_role,'kader'::app_role)));
CREATE POLICY "staff insert pencatatan" ON public.pencatatan FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role IN ('admin'::app_role,'kader'::app_role)));
CREATE POLICY "staff update pencatatan" ON public.pencatatan FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role IN ('admin'::app_role,'kader'::app_role)))
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role IN ('admin'::app_role,'kader'::app_role)));
CREATE POLICY "staff delete pencatatan" ON public.pencatatan FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role IN ('admin'::app_role,'kader'::app_role)));

-- kader: uses has_role too
DROP POLICY IF EXISTS "admin manage kader" ON public.kader;
CREATE POLICY "admin manage kader" ON public.kader FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'::app_role))
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'::app_role));

-- Now revoke EXECUTE on has_role entirely from client roles; server-side admin uses service_role which bypasses.
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated;

-- Hide get_public_stats from direct API calls; only service_role (server functions) may call it.
REVOKE EXECUTE ON FUNCTION public.get_public_stats() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_stats() TO service_role;
