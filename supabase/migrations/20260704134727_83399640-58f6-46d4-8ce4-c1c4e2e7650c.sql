
CREATE TABLE public.balita (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nama_lengkap TEXT NOT NULL,
  nik TEXT NOT NULL UNIQUE,
  tanggal_lahir DATE NOT NULL,
  jenis_kelamin TEXT NOT NULL CHECK (jenis_kelamin IN ('L','P')),
  nama_orangtua TEXT NOT NULL,
  alamat_rt TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.pencatatan (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  balita_id UUID NOT NULL REFERENCES public.balita(id) ON DELETE CASCADE,
  tanggal DATE NOT NULL DEFAULT CURRENT_DATE,
  berat_badan NUMERIC(5,2) NOT NULL,
  tinggi_badan NUMERIC(5,2) NOT NULL,
  status_gizi TEXT NOT NULL,
  catatan TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_pencatatan_balita ON public.pencatatan(balita_id);
CREATE INDEX idx_pencatatan_tanggal ON public.pencatatan(tanggal);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.balita TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pencatatan TO anon, authenticated;
GRANT ALL ON public.balita TO service_role;
GRANT ALL ON public.pencatatan TO service_role;

ALTER TABLE public.balita ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pencatatan ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read balita" ON public.balita FOR SELECT USING (true);
CREATE POLICY "public insert balita" ON public.balita FOR INSERT WITH CHECK (true);
CREATE POLICY "public update balita" ON public.balita FOR UPDATE USING (true);
CREATE POLICY "public delete balita" ON public.balita FOR DELETE USING (true);

CREATE POLICY "public read pencatatan" ON public.pencatatan FOR SELECT USING (true);
CREATE POLICY "public insert pencatatan" ON public.pencatatan FOR INSERT WITH CHECK (true);
CREATE POLICY "public update pencatatan" ON public.pencatatan FOR UPDATE USING (true);
CREATE POLICY "public delete pencatatan" ON public.pencatatan FOR DELETE USING (true);

CREATE OR REPLACE FUNCTION public.update_updated_at_column() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_balita_updated_at BEFORE UPDATE ON public.balita
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
