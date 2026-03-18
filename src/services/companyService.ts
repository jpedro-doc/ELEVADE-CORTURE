import { supabase } from '@/integrations/supabase/client';
import type { Company } from '@/types/company';

export async function fetchCompanies(): Promise<Company[]> {
  const { data, error } = await supabase
    .from('companies')
    .select('*')
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data || []) as Company[];
}

export async function createCompany(name: string, color?: string): Promise<Company> {
  const { data, error } = await supabase
    .from('companies')
    .insert({ name, color: color || null })
    .select()
    .single();
  if (error) throw error;
  return data as Company;
}

export async function deleteCompany(id: string): Promise<void> {
  const { error } = await supabase.from('companies').delete().eq('id', id);
  if (error) throw error;
}
