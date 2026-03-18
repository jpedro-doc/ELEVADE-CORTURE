import React, { useMemo, useState } from 'react';
import { useOS } from '@/contexts/OSContext';
import { useCompany } from '@/contexts/CompanyContext';
import { calcTotal, calcLucro } from '@/types/os';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const DashboardTab: React.FC = () => {
  const { ordens } = useOS();
  const { selectedCod } = useCompany();
  const [mesFilter, setMesFilter] = useState('');

  const filteredOrdens = useMemo(() => {
    if (!selectedCod) return ordens;
    return ordens.filter(o => o.cod === selectedCod);
  }, [ordens, selectedCod]);

  const stats = useMemo(() => {
    const totalFat = filteredOrdens.reduce((s, o) => s + calcTotal(o.fat_items), 0);
    const totalCusto = filteredOrdens.reduce((s, o) => s + calcTotal(o.custo_items), 0);
    return {
      faturamento: totalFat,
      custo: totalCusto,
      lucro: totalFat - totalCusto,
      count: filteredOrdens.length,
    };
  }, [filteredOrdens]);

  const chartData = useMemo(() => {
    const now = new Date();
    const months: { label: string; key: string; custo: number; faturamento: number; lucro: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
      const monthOrdens = filteredOrdens.filter(o => o.data.startsWith(key));
      const custo = monthOrdens.reduce((s, o) => s + calcTotal(o.custo_items), 0);
      const faturamento = monthOrdens.reduce((s, o) => s + calcTotal(o.fat_items), 0);
      months.push({ label, key, custo, faturamento, lucro: faturamento - custo });
    }
    return months;
  }, [filteredOrdens]);

  const mesOptions = useMemo(() => {
    const set = new Set<string>();
    filteredOrdens.forEach(o => { const d = o.data.substring(0, 7); set.add(d); });
    return Array.from(set).sort().reverse();
  }, [filteredOrdens]);

  const tableData = useMemo(() => {
    return filteredOrdens
      .filter(o => !mesFilter || o.data.startsWith(mesFilter))
      .map(o => ({
        data: new Date(o.data).toLocaleDateString('pt-BR'),
        cod: o.cod,
        nome: o.nome,
        custo: calcTotal(o.custo_items),
        faturado: calcTotal(o.fat_items),
        lucro: calcLucro(o),
      }));
  }, [filteredOrdens, mesFilter]);

  const tableTotals = useMemo(() => {
    return tableData.reduce((acc, r) => ({
      custo: acc.custo + r.custo,
      faturado: acc.faturado + r.faturado,
      lucro: acc.lucro + r.lucro,
    }), { custo: 0, faturado: 0, lucro: 0 });
  }, [tableData]);

  const statCards = [
    { label: 'Faturamento Total', value: stats.faturamento, color: 'text-primary', bg: 'bg-primary/10' },
    { label: 'Custo Total', value: stats.custo, color: 'text-secondary', bg: 'bg-secondary/10' },
    { label: 'Lucro Total', value: stats.lucro, color: 'text-success', bg: 'bg-success/10' },
    { label: 'OS Registradas', value: stats.count, color: 'text-info', bg: 'bg-info/10', isCount: true },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {statCards.map(c => (
          <div key={c.label} className={`${c.bg} border border-border rounded-lg p-4`}>
            <p className="text-xs text-muted-foreground mb-1">{c.label}</p>
            <p className={`font-mono text-xl font-bold ${c.color}`}>
              {c.isCount ? c.value : `R$ ${c.value.toFixed(2)}`}
            </p>
          </div>
        ))}
      </div>

      <div className="bg-card border border-border rounded-lg p-4">
        <h3 className="font-display font-bold text-sm mb-4">Últimos 6 Meses</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 15%)" />
            <XAxis dataKey="label" tick={{ fill: '#a1a1aa', fontSize: 12 }} />
            <YAxis tick={{ fill: '#a1a1aa', fontSize: 12 }} />
            <Tooltip
              contentStyle={{ backgroundColor: '#171717', border: '1px solid #262626', borderRadius: 6 }}
              labelStyle={{ color: '#fff' }}
            />
            <Bar dataKey="custo" name="Custo" fill="#ff6b35" radius={[2, 2, 0, 0]} />
            <Bar dataKey="faturamento" name="Faturamento" fill="#e8ff00" radius={[2, 2, 0, 0]} />
            <Bar dataKey="lucro" name="Lucro" fill="#00e676" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-card border border-border rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-bold text-sm">Histórico</h3>
          <select
            value={mesFilter}
            onChange={e => setMesFilter(e.target.value)}
            className="bg-muted border border-border rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="">Todos os meses</option>
            {mesOptions.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-muted-foreground border-b border-border">
                <th className="text-left pb-2">Data</th>
                <th className="text-left pb-2">Empresa</th>
                <th className="text-left pb-2">Nome</th>
                <th className="text-right pb-2">Custo</th>
                <th className="text-right pb-2">Faturado</th>
                <th className="text-right pb-2">Lucro</th>
              </tr>
            </thead>
            <tbody>
              {tableData.map((r, i) => (
                <tr key={i} className="border-b border-border/50">
                  <td className="py-1.5 text-muted-foreground">{r.data}</td>
                  <td className="py-1.5 font-mono text-primary">{r.cod}</td>
                  <td className="py-1.5">{r.nome}</td>
                  <td className="py-1.5 text-right font-mono text-secondary">R$ {r.custo.toFixed(2)}</td>
                  <td className="py-1.5 text-right font-mono text-primary">R$ {r.faturado.toFixed(2)}</td>
                  <td className={`py-1.5 text-right font-mono ${r.lucro >= 0 ? 'text-success' : 'text-destructive'}`}>
                    R$ {r.lucro.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-border font-semibold">
                <td colSpan={3} className="py-2 text-muted-foreground">Totais do período</td>
                <td className="py-2 text-right font-mono text-secondary">R$ {tableTotals.custo.toFixed(2)}</td>
                <td className="py-2 text-right font-mono text-primary">R$ {tableTotals.faturado.toFixed(2)}</td>
                <td className={`py-2 text-right font-mono ${tableTotals.lucro >= 0 ? 'text-success' : 'text-destructive'}`}>
                  R$ {tableTotals.lucro.toFixed(2)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DashboardTab;
