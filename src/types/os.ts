export interface CostItem {
  id: string;
  desc: string;
  qty: number;
  unit: number;
}

export interface BillingItem extends CostItem {
  cost_unit: number;
  billing_manually_edited: boolean;
}

export interface OrdemServico {
  id: string;
  cod: string;
  nome: string;
  tel: string | null;
  status: 'aberto' | 'finalizado';
  data: string;
  service_date: string | null;
  company_id: string | null;
  custo_items: CostItem[];
  fat_items: BillingItem[];
  pgto: string;
}

export const PAYMENT_METHODS = ['Dinheiro', 'PIX', 'Cartão Débito', 'Cartão Crédito', 'Boleto'] as const;

export function calcTotal(items: CostItem[]): number {
  return items.reduce((sum, i) => sum + i.qty * i.unit, 0);
}

export function calcLucro(os: OrdemServico): number {
  return calcTotal(os.fat_items) - calcTotal(os.custo_items);
}

export function syncFatFromCusto(custo: CostItem[], fat: BillingItem[]): BillingItem[] {
  const fatMap = new Map(fat.map(f => [f.id, f]));
  return custo.map(c => {
    const existing = fatMap.get(c.id);
    if (!existing) {
      return {
        id: c.id,
        desc: c.desc,
        qty: c.qty,
        unit: 0,
        cost_unit: c.unit,
        billing_manually_edited: false,
      };
    }
    const manuallyEdited = existing.billing_manually_edited ?? false;
    return {
      ...existing,
      desc: c.desc,
      qty: c.qty,
      cost_unit: c.unit,
      unit: manuallyEdited ? existing.unit : c.unit,
    };
  });
}
