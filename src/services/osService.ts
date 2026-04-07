import type { OrdemServico } from '@/types/os';

const KEY = 'gestao_pro_ordens';

function load(): OrdemServico[] {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; }
}

function save(ordens: OrdemServico[]) {
  localStorage.setItem(KEY, JSON.stringify(ordens));
}

export async function fetchOrdens(): Promise<OrdemServico[]> {
  return load().sort((a, b) => b.data.localeCompare(a.data));
}

export async function createOrdem(cod: string, nome: string, tel: string): Promise<OrdemServico> {
  const os: OrdemServico = {
    id: crypto.randomUUID(),
    cod,
    nome,
    tel: tel || null,
    status: 'aberto',
    data: new Date().toISOString(),
    service_date: null,
    company_id: null,
    custo_items: [],
    fat_items: [],
    pgto: '',
  };
  const all = load();
  save([os, ...all]);
  return os;
}

export async function upsertOrdem(os: OrdemServico): Promise<void> {
  const all = load();
  const idx = all.findIndex(o => o.id === os.id);
  if (idx >= 0) {
    all[idx] = os;
  } else {
    all.unshift(os);
  }
  save(all);
}

export async function deleteOrdem(id: string): Promise<void> {
  save(load().filter(o => o.id !== id));
}
