
-- 1. Add RT/RW columns to balita
ALTER TABLE public.balita
  ADD COLUMN IF NOT EXISTS rt text,
  ADD COLUMN IF NOT EXISTS rw text;

-- Backfill rt/rw from existing alamat_rt where possible (best-effort parser: "RT 03 / RW 04")
UPDATE public.balita
SET
  rt = COALESCE(rt, NULLIF(regexp_replace(alamat_rt, '.*RT\s*0*([0-9]+).*', '\1', 'i'), alamat_rt)),
  rw = COALESCE(rw, NULLIF(regexp_replace(alamat_rt, '.*RW\s*0*([0-9]+).*', '\1', 'i'), alamat_rt))
WHERE rt IS NULL OR rw IS NULL;

-- 2. Add posko_rt to kader (posko_rw already exists)
ALTER TABLE public.kader
  ADD COLUMN IF NOT EXISTS posko_rt text;

-- 3. Recreate RLS policies with RT/RW scoping for kader
DROP POLICY IF EXISTS "staff read balita" ON public.balita;
DROP POLICY IF EXISTS "staff insert balita" ON public.balita;
DROP POLICY IF EXISTS "staff update balita" ON public.balita;
DROP POLICY IF EXISTS "staff delete balita" ON public.balita;

CREATE POLICY "admin all balita" ON public.balita FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "kader scope balita" ON public.balita FOR ALL TO authenticated
  USING (
    public.has_role(auth.uid(), 'kader') AND EXISTS (
      SELECT 1 FROM public.kader k
      WHERE k.user_id = auth.uid()
        AND (COALESCE(NULLIF(k.posko_rw, ''), '') = '' OR k.posko_rw = balita.rw)
        AND (COALESCE(NULLIF(k.posko_rt, ''), '') = '' OR k.posko_rt = balita.rt)
    )
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'kader') AND EXISTS (
      SELECT 1 FROM public.kader k
      WHERE k.user_id = auth.uid()
        AND (COALESCE(NULLIF(k.posko_rw, ''), '') = '' OR k.posko_rw = balita.rw)
        AND (COALESCE(NULLIF(k.posko_rt, ''), '') = '' OR k.posko_rt = balita.rt)
    )
  );

DROP POLICY IF EXISTS "staff read pencatatan" ON public.pencatatan;
DROP POLICY IF EXISTS "staff insert pencatatan" ON public.pencatatan;
DROP POLICY IF EXISTS "staff update pencatatan" ON public.pencatatan;
DROP POLICY IF EXISTS "staff delete pencatatan" ON public.pencatatan;

CREATE POLICY "admin all pencatatan" ON public.pencatatan FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "kader scope pencatatan" ON public.pencatatan FOR ALL TO authenticated
  USING (
    public.has_role(auth.uid(), 'kader') AND EXISTS (
      SELECT 1 FROM public.kader k
      JOIN public.balita b ON b.id = pencatatan.balita_id
      WHERE k.user_id = auth.uid()
        AND (COALESCE(NULLIF(k.posko_rw, ''), '') = '' OR k.posko_rw = b.rw)
        AND (COALESCE(NULLIF(k.posko_rt, ''), '') = '' OR k.posko_rt = b.rt)
    )
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'kader') AND EXISTS (
      SELECT 1 FROM public.kader k
      JOIN public.balita b ON b.id = pencatatan.balita_id
      WHERE k.user_id = auth.uid()
        AND (COALESCE(NULLIF(k.posko_rw, ''), '') = '' OR k.posko_rw = b.rw)
        AND (COALESCE(NULLIF(k.posko_rt, ''), '') = '' OR k.posko_rt = b.rt)
    )
  );
