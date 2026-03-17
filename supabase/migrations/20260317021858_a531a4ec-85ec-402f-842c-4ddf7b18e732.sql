
CREATE TABLE public.ordens_servico (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cod TEXT NOT NULL,
  nome TEXT NOT NULL,
  tel TEXT,
  status TEXT NOT NULL DEFAULT 'aberto',
  data TIMESTAMPTZ NOT NULL DEFAULT now(),
  custo_items JSONB NOT NULL DEFAULT '[]'::jsonb,
  fat_items JSONB NOT NULL DEFAULT '[]'::jsonb,
  pgto TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.ordens_servico ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all select" ON public.ordens_servico FOR SELECT USING (true);
CREATE POLICY "Allow all insert" ON public.ordens_servico FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update" ON public.ordens_servico FOR UPDATE USING (true);
CREATE POLICY "Allow all delete" ON public.ordens_servico FOR DELETE USING (true);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_ordens_servico_updated_at
  BEFORE UPDATE ON public.ordens_servico
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
