-- Limpa schema anterior
DROP TABLE IF EXISTS public.ordens_servico CASCADE;
DROP TABLE IF EXISTS public.companies CASCADE;
DROP FUNCTION IF EXISTS public.update_updated_at_column CASCADE;

-- ─── Tabela de produtos ────────────────────────────────────────────────────

CREATE TABLE public.produtos (
  id            UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome          TEXT        NOT NULL,
  preco_custo   NUMERIC(12,2) NOT NULL,
  meta_venda    NUMERIC(12,2),
  preco_venda   NUMERIC(12,2),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── Tabela de configurações (meta mensal, etc.) ───────────────────────────

CREATE TABLE public.configuracoes (
  chave  TEXT PRIMARY KEY,
  valor  TEXT NOT NULL
);

-- Insere meta mensal padrão (0 = não definida)
INSERT INTO public.configuracoes (chave, valor) VALUES ('meta_mensal', '0')
  ON CONFLICT (chave) DO NOTHING;

-- ─── Trigger de updated_at ─────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER trg_produtos_updated_at
  BEFORE UPDATE ON public.produtos
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ─── RLS ───────────────────────────────────────────────────────────────────

ALTER TABLE public.produtos       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.configuracoes  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_all_produtos"      ON public.produtos      FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_configuracoes" ON public.configuracoes FOR ALL USING (true) WITH CHECK (true);
