export interface CostItem {
  id: string;
  desc: string;
  qty: number;
  unit: number;
}

export interface OrdemServico {
  id: string;
  cod: string;
  nome: string;
  tel: string | null;
  status: 'aberto' | 'finalizado';
  data: string;
  custo_items: CostItem[];
  fat_items: CostItem[];
  pgto: string;
}

export const PAYMENT_METHODS = ['Dinheiro', 'PIX', 'Cartão Débito', 'Cartão Crédito', 'Boleto'] as const;

export function calcTotal(items: CostItem[]): number {
  return items.reduce((sum, i) => sum + i.qty * i.unit, 0);
}

export function calcLucro(os: OrdemServico): number {
  return calcTotal(os.fat_items) - calcTotal(os.custo_items);
}
