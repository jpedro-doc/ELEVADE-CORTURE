import { supabase } from '@/integrations/supabase/client';

export interface Venda {
  id: string;
  produto_id: string | null;
  produto_nome: string;
  quantidade: number;
  preco_venda: number;
  preco_custo: number;
  created_at: string;
}

function rowToVenda(row: any): Venda {
  return {
    id:           row.id,
    produto_id:   row.produto_id ?? null,
    produto_nome: row.produto_nome,
    quantidade:   Number(row.quantidade),
    preco_venda:  Number(row.preco_venda),
    preco_custo:  Number(row.preco_custo),
    created_at:   row.created_at,
  };
}

export async function fetchVendas(): Promise<Venda[]> {
  const { data, error } = await supabase
    .from('vendas')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200);
  if (error) throw error;
  return (data || []).map(rowToVenda);
}

export async function createVenda(v: Omit<Venda, 'id' | 'created_at'>): Promise<Venda> {
  const { data, error } = await supabase
    .from('vendas')
    .insert({
      produto_id:   v.produto_id,
      produto_nome: v.produto_nome,
      quantidade:   v.quantidade,
      preco_venda:  v.preco_venda,
      preco_custo:  v.preco_custo,
    })
    .select()
    .single();
  if (error) throw error;
  return rowToVenda(data);
}

export async function deleteVenda(id: string): Promise<void> {
  const { error } = await supabase.from('vendas').delete().eq('id', id);
  if (error) throw error;
}
