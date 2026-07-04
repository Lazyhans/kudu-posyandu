
-- 1. Enum roles
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin','kader');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2. user_roles table
CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "own roles read" ON public.user_roles;
CREATE POLICY "own roles read" ON public.user_roles
  FOR SELECT TO authenticated USING (user_id = auth.uid());

-- 3. has_role function
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

-- 4. kader table
CREATE TABLE IF NOT EXISTS public.kader (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  nama_lengkap text NOT NULL,
  username text NOT NULL UNIQUE,
  posko_rw text NOT NULL,
  no_hp text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.kader TO authenticated;
GRANT ALL ON public.kader TO service_role;
ALTER TABLE public.kader ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin manage kader" ON public.kader;
CREATE POLICY "admin manage kader" ON public.kader
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "kader read self" ON public.kader;
CREATE POLICY "kader read self" ON public.kader
  FOR SELECT TO authenticated USING (user_id = auth.uid());

DROP TRIGGER IF EXISTS update_kader_updated_at ON public.kader;
CREATE TRIGGER update_kader_updated_at BEFORE UPDATE ON public.kader
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5. Tighten balita & pencatatan: only admin+kader can write; public can read (kept as-is for user site)
-- Rewrite policies to require role for writes
DROP POLICY IF EXISTS "public insert balita" ON public.balita;
DROP POLICY IF EXISTS "public update balita" ON public.balita;
DROP POLICY IF EXISTS "public delete balita" ON public.balita;

CREATE POLICY "staff insert balita" ON public.balita FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'kader'));
CREATE POLICY "staff update balita" ON public.balita FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'kader'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'kader'));
CREATE POLICY "staff delete balita" ON public.balita FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'kader'));

DROP POLICY IF EXISTS "public insert pencatatan" ON public.pencatatan;
DROP POLICY IF EXISTS "public update pencatatan" ON public.pencatatan;
DROP POLICY IF EXISTS "public delete pencatatan" ON public.pencatatan;

CREATE POLICY "staff insert pencatatan" ON public.pencatatan FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'kader'));
CREATE POLICY "staff update pencatatan" ON public.pencatatan FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'kader'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'kader'));
CREATE POLICY "staff delete pencatatan" ON public.pencatatan FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'kader'));
