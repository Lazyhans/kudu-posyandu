
-- ================== IBU HAMIL ==================
CREATE TABLE public.ibu_hamil (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nama_lengkap TEXT NOT NULL,
  nik TEXT NOT NULL UNIQUE,
  tanggal_lahir DATE NOT NULL,
  alamat TEXT,
  rt TEXT,
  rw TEXT,
  no_hp TEXT,
  hpht DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ibu_hamil TO authenticated;
GRANT ALL ON public.ibu_hamil TO service_role;

ALTER TABLE public.ibu_hamil ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin all ibu_hamil" ON public.ibu_hamil FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "kader scope ibu_hamil" ON public.ibu_hamil FOR ALL
  USING (
    has_role(auth.uid(), 'kader'::app_role) AND EXISTS (
      SELECT 1 FROM kader k
      WHERE k.user_id = auth.uid()
        AND (COALESCE(NULLIF(k.posko_rw, ''), '') = '' OR k.posko_rw = ibu_hamil.rw)
        AND (COALESCE(NULLIF(k.posko_rt, ''), '') = '' OR k.posko_rt = ibu_hamil.rt)
    )
  )
  WITH CHECK (
    has_role(auth.uid(), 'kader'::app_role) AND EXISTS (
      SELECT 1 FROM kader k
      WHERE k.user_id = auth.uid()
        AND (COALESCE(NULLIF(k.posko_rw, ''), '') = '' OR k.posko_rw = ibu_hamil.rw)
        AND (COALESCE(NULLIF(k.posko_rt, ''), '') = '' OR k.posko_rt = ibu_hamil.rt)
    )
  );

CREATE TRIGGER trg_ibu_hamil_updated BEFORE UPDATE ON public.ibu_hamil
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ================== PENCATATAN IBU HAMIL ==================
CREATE TABLE public.pencatatan_ibu_hamil (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ibu_hamil_id UUID NOT NULL REFERENCES public.ibu_hamil(id) ON DELETE CASCADE,
  tanggal DATE NOT NULL DEFAULT CURRENT_DATE,
  berat_badan NUMERIC(5,2) NOT NULL,
  lingkar_perut NUMERIC(5,2),
  lingkar_lengan NUMERIC(5,2),
  tensi TEXT,
  gula NUMERIC(6,2),
  catatan TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.pencatatan_ibu_hamil TO authenticated;
GRANT ALL ON public.pencatatan_ibu_hamil TO service_role;

ALTER TABLE public.pencatatan_ibu_hamil ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin all pih" ON public.pencatatan_ibu_hamil FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "kader scope pih" ON public.pencatatan_ibu_hamil FOR ALL
  USING (
    has_role(auth.uid(), 'kader'::app_role) AND EXISTS (
      SELECT 1 FROM kader k JOIN ibu_hamil i ON i.id = pencatatan_ibu_hamil.ibu_hamil_id
      WHERE k.user_id = auth.uid()
        AND (COALESCE(NULLIF(k.posko_rw, ''), '') = '' OR k.posko_rw = i.rw)
        AND (COALESCE(NULLIF(k.posko_rt, ''), '') = '' OR k.posko_rt = i.rt)
    )
  )
  WITH CHECK (
    has_role(auth.uid(), 'kader'::app_role) AND EXISTS (
      SELECT 1 FROM kader k JOIN ibu_hamil i ON i.id = pencatatan_ibu_hamil.ibu_hamil_id
      WHERE k.user_id = auth.uid()
        AND (COALESCE(NULLIF(k.posko_rw, ''), '') = '' OR k.posko_rw = i.rw)
        AND (COALESCE(NULLIF(k.posko_rt, ''), '') = '' OR k.posko_rt = i.rt)
    )
  );

-- ================== LANSIA ==================
CREATE TABLE public.lansia (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nama_lengkap TEXT NOT NULL,
  nik TEXT NOT NULL UNIQUE,
  tanggal_lahir DATE NOT NULL,
  jenis_kelamin TEXT,
  alamat TEXT,
  rt TEXT,
  rw TEXT,
  no_hp TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.lansia TO authenticated;
GRANT ALL ON public.lansia TO service_role;

ALTER TABLE public.lansia ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin all lansia" ON public.lansia FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "kader scope lansia" ON public.lansia FOR ALL
  USING (
    has_role(auth.uid(), 'kader'::app_role) AND EXISTS (
      SELECT 1 FROM kader k
      WHERE k.user_id = auth.uid()
        AND (COALESCE(NULLIF(k.posko_rw, ''), '') = '' OR k.posko_rw = lansia.rw)
        AND (COALESCE(NULLIF(k.posko_rt, ''), '') = '' OR k.posko_rt = lansia.rt)
    )
  )
  WITH CHECK (
    has_role(auth.uid(), 'kader'::app_role) AND EXISTS (
      SELECT 1 FROM kader k
      WHERE k.user_id = auth.uid()
        AND (COALESCE(NULLIF(k.posko_rw, ''), '') = '' OR k.posko_rw = lansia.rw)
        AND (COALESCE(NULLIF(k.posko_rt, ''), '') = '' OR k.posko_rt = lansia.rt)
    )
  );

CREATE TRIGGER trg_lansia_updated BEFORE UPDATE ON public.lansia
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ================== PENCATATAN LANSIA ==================
CREATE TABLE public.pencatatan_lansia (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lansia_id UUID NOT NULL REFERENCES public.lansia(id) ON DELETE CASCADE,
  tanggal DATE NOT NULL DEFAULT CURRENT_DATE,
  berat_badan NUMERIC(5,2) NOT NULL,
  lingkar_badan NUMERIC(5,2),
  tensi TEXT,
  gula NUMERIC(6,2),
  catatan TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.pencatatan_lansia TO authenticated;
GRANT ALL ON public.pencatatan_lansia TO service_role;

ALTER TABLE public.pencatatan_lansia ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin all pl" ON public.pencatatan_lansia FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "kader scope pl" ON public.pencatatan_lansia FOR ALL
  USING (
    has_role(auth.uid(), 'kader'::app_role) AND EXISTS (
      SELECT 1 FROM kader k JOIN lansia l ON l.id = pencatatan_lansia.lansia_id
      WHERE k.user_id = auth.uid()
        AND (COALESCE(NULLIF(k.posko_rw, ''), '') = '' OR k.posko_rw = l.rw)
        AND (COALESCE(NULLIF(k.posko_rt, ''), '') = '' OR k.posko_rt = l.rt)
    )
  )
  WITH CHECK (
    has_role(auth.uid(), 'kader'::app_role) AND EXISTS (
      SELECT 1 FROM kader k JOIN lansia l ON l.id = pencatatan_lansia.lansia_id
      WHERE k.user_id = auth.uid()
        AND (COALESCE(NULLIF(k.posko_rw, ''), '') = '' OR k.posko_rw = l.rw)
        AND (COALESCE(NULLIF(k.posko_rt, ''), '') = '' OR k.posko_rt = l.rt)
    )
  );
