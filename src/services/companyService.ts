import type { Company } from '@/types/company';

const KEY = 'gestao_pro_companies';

function load(): Company[] {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; }
}

function save(companies: Company[]) {
  localStorage.setItem(KEY, JSON.stringify(companies));
}

export async function fetchCompanies(): Promise<Company[]> {
  return load();
}

export async function createCompany(name: string, color?: string): Promise<Company> {
  const company: Company = {
    id: crypto.randomUUID(),
    name,
    color: color || null,
    logo_url: null,
  };
  save([...load(), company]);
  return company;
}

export async function deleteCompany(id: string): Promise<void> {
  save(load().filter(c => c.id !== id));
}
