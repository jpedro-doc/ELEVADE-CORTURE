import { supabase } from '@/integrations/supabase/client';
import type { OrdemServico, CostItem, BillingItem } from '@/types/os';
import type { Json } from '@/integrations/supabase/types';

function parseItems(json: Json): CostItem[] {
  if (Array.isArray(json)) return json as unknown as CostItem[];
  return [];
}

function parseBillingItems(json: Json): BillingItem[] {
  if (Array.isArray(json)) {
    return (json as unknown as BillingItem[]).map(item => ({
      ...item,
      cost_unit: item.cost_unit ?? item.unit,
      billing_manually_edited: item.billing_manually_edited ?? false,
    }));
  }
  return [];
}

function rowToOS(row: any): OrdemServico {
  return {
    id: row.id,
    cod: row.cod,
    nome: row.nome,
    tel: row.tel,
    status: row.status as 'aberto' | 'finalizado',
    data: row.data,
    service_date: null,
    company_id: null,
    custo_items: parseItems(row.custo_items),
    fat_items: parseBillingItems(row.fat_items),
    pgto: row.pgto,
  };
}

export async function fetchOrdens(): Promise<OrdemServico[]> {
  const { data, error } = await supabase
    .from('ordens_servico')
    .select('*')
    .order('data', { ascending: false });
  if (error) throw error;
  return (data || []).map(rowToOS);
}

export async function upsertOrdem(os: OrdemServico): Promise<void> {
  const { error } = await supabase.from('ordens_servico').upsert({
    id: os.id,
    cod: os.cod,
    nome: os.nome,
    tel: os.tel,
    status: os.status,
    data: os.data,
    custo_items: os.custo_items as unknown as Json,
    fat_items: os.fat_items as unknown as Json,
    pgto: os.pgto,
  });
  if (error) throw error;
}

export async function createOrdem(
  cod: string,
  nome: string,
  tel: string,
): Promise<OrdemServico> {
  const { data, error } = await supabase
    .from('ordens_servico')
    .insert({
      cod,
      nome,
      tel: tel || null,
      status: 'aberto',
      custo_items: [] as unknown as Json,
      fat_items: [] as unknown as Json,
      pgto: '',
    })
    .select()
    .single();
  if (error) throw error;
  return rowToOS(data);
}

export async function deleteOrdem(id: string): Promise<void> {
  const { error } = await supabase.from('ordens_servico').delete().eq('id', id);
  if (error) throw error;
}
