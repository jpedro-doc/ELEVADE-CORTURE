import { supabase } from '@/integrations/supabase/client';

export interface Produto {
  id: string;
  nome: string;
  precoCusto: number;
  metaVenda: number | null;
  precoVenda: number | null;
  emEstoque: boolean;
}

function rowToProduto(row: any): Produto {
  return {
    id:         row.id,
    nome:       row.nome,
    precoCusto: Number(row.preco_custo),
    metaVenda:  row.meta_venda  != null ? Number(row.meta_venda)  : null,
    precoVenda: row.preco_venda != null ? Number(row.preco_venda) : null,
    emEstoque:  row.em_estoque  ?? true,
  };
}

export async function fetchProdutos(): Promise<Produto[]> {
  const { data, error } = await supabase
    .from('produtos')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(rowToProduto);
}

export async function createProduto(p: Omit<Produto, 'id'>): Promise<Produto> {
  const { data, error } = await supabase
    .from('produtos')
    .insert({
      nome:        p.nome,
      preco_custo: p.precoCusto,
      meta_venda:  p.metaVenda,
      preco_venda: p.precoVenda,
      em_estoque:  p.emEstoque ?? true,
    })
    .select()
    .single();
  if (error) throw error;
  return rowToProduto(data);
}

export async function updateProduto(id: string, fields: Partial<Omit<Produto, 'id'>>): Promise<void> {
  const patch: any = {};
  if (fields.nome       !== undefined) patch.nome        = fields.nome;
  if (fields.precoCusto !== undefined) patch.preco_custo = fields.precoCusto;
  if (fields.metaVenda  !== undefined) patch.meta_venda  = fields.metaVenda;
  if (fields.precoVenda !== undefined) patch.preco_venda = fields.precoVenda;
  if (fields.emEstoque  !== undefined) patch.em_estoque  = fields.emEstoque;
  const { error } = await supabase.from('produtos').update(patch).eq('id', id);
  if (error) throw error;
}

export async function deleteProduto(id: string): Promise<void> {
  const { error } = await supabase.from('produtos').delete().eq('id', id);
  if (error) throw error;
}

export async function fetchMetaMensal(): Promise<number> {
  const { data, error } = await supabase
    .from('configuracoes')
    .select('valor')
    .eq('chave', 'meta_mensal')
    .single();
  if (error) return 0;
  return parseFloat(data.valor) || 0;
}

export async function saveMetaMensal(valor: number): Promise<void> {
  const { error } = await supabase
    .from('configuracoes')
    .upsert({ chave: 'meta_mensal', valor: String(valor) });
  if (error) throw error;
}
