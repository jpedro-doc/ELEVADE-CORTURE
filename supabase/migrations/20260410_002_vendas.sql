-- ─── Tabela de vendas ─────────────────────────────────────────────────────

CREATE TABLE public.vendas (
  id           UUID          NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  produto_id   UUID          REFERENCES public.produtos(id) ON DELETE SET NULL,
  produto_nome TEXT          NOT NULL,
  quantidade   INTEGER       NOT NULL DEFAULT 1,
  preco_venda  NUMERIC(12,2) NOT NULL,
  preco_custo  NUMERIC(12,2) NOT NULL,
  created_at   TIMESTAMPTZ   NOT NULL DEFAULT now()
);

-- ─── RLS ───────────────────────────────────────────────────────────────────

ALTER TABLE public.vendas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_all_vendas" ON public.vendas FOR ALL USING (true) WITH CHECK (true);
