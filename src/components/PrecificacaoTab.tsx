import React, { useState, useMemo, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  Cell, ReferenceLine,
} from 'recharts';
import { Trash2, Plus, TrendingUp, Target, DollarSign, BarChart2 } from 'lucide-react';
import {
  fetchProdutos, createProduto, updateProduto, deleteProduto,
  fetchMetaMensal, saveMetaMensal,
  type Produto,
} from '@/services/produtoService';

/* ─── Helpers ────────────────────────────────────────────────────────────── */

const fmt  = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 });
const fmtK = (v: number) => v >= 1000 ? `R$ ${(v / 1000).toFixed(1)}k` : `R$ ${v.toFixed(0)}`;
const pct  = (v: number) => `${v.toFixed(1)}%`;

function calc(p: Produto, metaMensal: number) {
  // lucro planejado usa metaVenda; lucro real usa precoVenda
  const vendido        = p.precoVenda ?? 0;
  const planejado      = p.metaVenda ?? 0;

  const lucroReal      = vendido > 0    ? vendido   - p.precoCusto : null;
  const lucroPlanejado = planejado > 0  ? planejado - p.precoCusto : null;

  const margemReal      = lucroReal      !== null && vendido > 0   ? (lucroReal / vendido) * 100       : null;
  const margemPlanejada = lucroPlanejado !== null && planejado > 0 ? (lucroPlanejado / planejado) * 100 : null;

  const markupReal      = lucroReal      !== null && p.precoCusto > 0 ? (lucroReal / p.precoCusto) * 100      : null;
  const markupPlanejado = lucroPlanejado !== null && p.precoCusto > 0 ? (lucroPlanejado / p.precoCusto) * 100 : null;

  // unidades para meta: usa venda real se disponível, senão meta de venda
  const precoRef  = vendido > 0 ? vendido : planejado;
  const unidades  = precoRef > 0 ? Math.ceil(metaMensal / precoRef) : null;
  const lucroMeta = (lucroReal ?? lucroPlanejado) !== null && unidades !== null
    ? (lucroReal ?? lucroPlanejado)! * unidades
    : null;

  return { lucroReal, lucroPlanejado, margemReal, margemPlanejada, markupReal, markupPlanejado, unidades, lucroMeta };
}

/* ─── Shared Styles ──────────────────────────────────────────────────────── */

const BORDER        = '1px solid #2a2a2a';
const BORDER_STRONG = '1px solid #3a3a3a';

const labelCls = 'block text-[10px] tracking-[0.2em] uppercase text-[#666] mb-2 font-medium';

const inputCls = [
  'w-full bg-[#0c0c0c] border border-[#2a2a2a] px-4 py-3',
  'text-sm text-[#e8e8e8] font-medium tracking-wide',
  'placeholder:text-[#2a2a2a] focus:border-[#666] focus:outline-none transition-colors',
].join(' ');

const axisStyle = { fill: '#555', fontSize: 10, fontFamily: 'Poppins', fontWeight: 500, letterSpacing: 1 };

const tooltipBox = {
  backgroundColor: '#0a0a0a',
  border: '1px solid #2a2a2a',
  borderRadius: 0,
  fontFamily: 'Poppins',
  fontSize: 11,
  color: '#e0e0e0',
  padding: '12px 16px',
};

/* ─── Tooltip ────────────────────────────────────────────────────────────── */

const CustomTooltip = ({ active, payload, label: lbl, currency = true }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={tooltipBox}>
      <p className="text-[10px] tracking-[0.2em] uppercase text-[#555] mb-2 font-medium">{lbl}</p>
      {payload.map((e: any) => (
        <div key={e.dataKey} className="flex justify-between gap-8 mb-1">
          <span className="text-[#555] tracking-[0.15em] uppercase text-[10px] font-medium">{e.dataKey}</span>
          <span className="text-[#d0d0d0] font-medium">{currency ? fmt(e.value) : e.value}</span>
        </div>
      ))}
    </div>
  );
};

/* ─── KPI Card ───────────────────────────────────────────────────────────── */

const KpiCard: React.FC<{ label: string; value: string; sub?: string; icon?: React.ReactNode }> = ({ label: l, value, sub, icon }) => (
  <div style={{ border: BORDER }} className="p-6 bg-[#070707]">
    <div className="flex items-start justify-between mb-4">
      <p className="text-[9px] tracking-[0.28em] uppercase text-[#444] font-medium">{l}</p>
      {icon && <span className="text-[#252525]">{icon}</span>}
    </div>
    <p style={{ fontFamily: 'Poppins, sans-serif', fontSize: '1.7rem', fontWeight: 200, letterSpacing: '0.04em', lineHeight: 1 }}
      className="text-[#e0e0e0] mb-2">{value}</p>
    {sub && <p className="text-[10px] text-[#3a3a3a] font-medium tracking-[0.12em] mt-2 uppercase">{sub}</p>}
  </div>
);

/* ─── Section Header ─────────────────────────────────────────────────────── */

const SectionHeader: React.FC<{ title: string; subtitle?: string }> = ({ title, subtitle }) => (
  <div style={{ borderBottom: BORDER_STRONG }} className="mb-8 pb-4">
    <h3 style={{ fontFamily: 'Poppins, sans-serif', fontSize: '1.1rem', fontWeight: 200, letterSpacing: '0.2em' }}
      className="text-[#c0c0c0] uppercase">{title}</h3>
    {subtitle && <p className="text-[10px] text-[#3a3a3a] tracking-[0.18em] mt-2 font-medium uppercase">{subtitle}</p>}
  </div>
);

/* ─── Legend Row ─────────────────────────────────────────────────────────── */

const Legend: React.FC<{ items: [string, string][] }> = ({ items }) => (
  <div className="flex gap-8 mt-4 pl-1">
    {items.map(([c, l]) => (
      <div key={l} className="flex items-center gap-2">
        <div style={{ backgroundColor: c, width: 24, height: 2 }} />
        <span className="text-[10px] tracking-[0.18em] uppercase text-[#555] font-medium">{l}</span>
      </div>
    ))}
  </div>
);

/* ─── Main ───────────────────────────────────────────────────────────────── */

const PrecificacaoTab: React.FC = () => {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [metaMensal, setMetaMensal] = useState<number>(0);
  const [metaInput, setMetaInput] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [dbError, setDbError] = useState('');

  const [nome, setNome]             = useState('');
  const [precoCusto, setPrecoCusto] = useState('');
  const [metaVendaInput, setMetaVendaInput] = useState('');
  const [precoVenda, setPrecoVenda] = useState('');
  const [error, setError]           = useState('');
  const [editVenda, setEditVenda]   = useState<Record<string, string>>({});

  // Carrega dados do Supabase
  useEffect(() => {
    Promise.all([fetchProdutos(), fetchMetaMensal()])
      .then(([prods, meta]) => {
        setProdutos(prods);
        setMetaMensal(meta);
        if (meta > 0) setMetaInput(String(meta));
      })
      .catch(err => setDbError(String(err?.message ?? err)))
      .finally(() => setLoading(false));
  }, []);

  const salvarMeta = async () => {
    const v = parseFloat(metaInput.replace(',', '.'));
    if (!v || v <= 0) return;
    await saveMetaMensal(v);
    setMetaMensal(v);
  };

  const handleAdd = async () => {
    const custo = parseFloat(precoCusto.replace(',', '.'));
    const metaV = metaVendaInput ? parseFloat(metaVendaInput.replace(',', '.')) : null;
    const venda = precoVenda ? parseFloat(precoVenda.replace(',', '.')) : null;
    if (!nome.trim())                    { setError('Nome obrigatório.'); return; }
    if (!custo || custo <= 0)            { setError('Custo inválido.'); return; }
    if (metaV !== null && metaV < custo) { setError('Meta de venda não pode ser menor que o custo.'); return; }
    if (venda !== null && venda <= 0)    { setError('Preço de venda inválido.'); return; }
    if (venda !== null && venda < custo) { setError('Venda não pode ser menor que o custo.'); return; }
    setError('');
    const novo = await createProduto({ nome: nome.trim(), precoCusto: custo, metaVenda: metaV, precoVenda: venda });
    setProdutos(prev => [novo, ...prev]);
    setNome(''); setPrecoCusto(''); setMetaVendaInput(''); setPrecoVenda('');
  };

  const salvarVenda = async (id: string) => {
    const raw = editVenda[id];
    if (!raw) return;
    const v = parseFloat(raw.replace(',', '.'));
    if (!v || v <= 0) return;
    const produto = produtos.find(p => p.id === id);
    if (!produto || v < produto.precoCusto) return;
    await updateProduto(id, { precoVenda: v });
    setProdutos(prev => prev.map(p => p.id === id ? { ...p, precoVenda: v } : p));
    setEditVenda(prev => { const n = { ...prev }; delete n[id]; return n; });
  };

  const remove = async (id: string) => {
    await deleteProduto(id);
    setProdutos(prev => prev.filter(p => p.id !== id));
  };

  /* ── Derived ── */
  const rows = useMemo(() => produtos.map(p => ({ ...p, ...calc(p, metaMensal) })), [produtos, metaMensal]);

  const rowsComPreco    = useMemo(() => rows.filter(r => r.precoVenda !== null || r.metaVenda !== null), [rows]);

  const totalLucroMeta  = useMemo(() => rowsComPreco.reduce((s, r) => s + (r.lucroMeta ?? 0), 0), [rowsComPreco]);
  const margemMedia     = useMemo(() => {
    const validos = rowsComPreco.filter(r => r.margemReal !== null || r.margemPlanejada !== null);
    return validos.length ? validos.reduce((s, r) => s + (r.margemReal ?? r.margemPlanejada ?? 0), 0) / validos.length : 0;
  }, [rowsComPreco]);
  const melhorProduto   = useMemo(() => {
    const validos = rowsComPreco.filter(r => r.margemReal !== null || r.margemPlanejada !== null);
    return validos.length ? validos.reduce((a, b) => (a.margemReal ?? a.margemPlanejada ?? 0) > (b.margemReal ?? b.margemPlanejada ?? 0) ? a : b) : null;
  }, [rowsComPreco]);

  const shorten = (n: string) => n.length > 14 ? n.slice(0,14)+'…' : n;

  const barPrecosData   = useMemo(() => [...rowsComPreco].reverse().map(p => ({
    nome: shorten(p.nome),
    Custo: p.precoCusto,
    ...(p.metaVenda ? { 'Meta Venda': p.metaVenda } : {}),
    ...(p.precoVenda ? { 'Venda Real': p.precoVenda } : {}),
  })), [rowsComPreco]);

  const barMetasData    = useMemo(() => [...rowsComPreco].reverse().map(p => {
    const precoRef = p.precoVenda ?? p.metaVenda ?? 0;
    return { nome: shorten(p.nome), 'Faturamento Necessário': parseFloat(((p.unidades ?? 0) * precoRef).toFixed(2)), 'Lucro Projetado': parseFloat((p.lucroMeta ?? 0).toFixed(2)) };
  }), [rowsComPreco]);

  const unidadesData    = useMemo(() => [...rowsComPreco].reverse().map(p => ({ nome: shorten(p.nome), Unidades: p.unidades ?? 0 })), [rowsComPreco]);

  const margemData      = useMemo(() => [...rowsComPreco].reverse().map(p => ({
    nome: shorten(p.nome),
    ...(p.margemPlanejada !== null ? { 'Margem Planejada': parseFloat(p.margemPlanejada.toFixed(1)) } : {}),
    ...(p.margemReal !== null      ? { 'Margem Real': parseFloat(p.margemReal.toFixed(1)) } : {}),
  })), [rowsComPreco]);

  const grays = ['#e8e8e8', '#aaa', '#666', '#3a3a3a', '#222'];

  if (loading) return (
    <div className="max-w-6xl mx-auto py-24 text-center">
      <p className="text-[10px] tracking-[0.3em] uppercase text-[#333] font-medium">Carregando...</p>
    </div>
  );

  if (dbError) return (
    <div className="max-w-6xl mx-auto py-24 text-center space-y-3">
      <p className="text-[10px] tracking-[0.3em] uppercase text-[#666] font-medium">Erro de conexão com o banco</p>
      <p className="font-mono text-xs text-[#444] max-w-lg mx-auto break-words">{dbError}</p>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto pb-24">

      {/* ════ META MENSAL ════ */}
      <section style={{ borderBottom: BORDER_STRONG }} className="mb-14 pb-10">
        <div className="flex items-end justify-between mb-6">
          <div>
            <p className="text-[10px] tracking-[0.22em] uppercase text-[#555] font-medium mb-1">Meta Mensal da Loja</p>
            <p style={{ fontFamily: 'Poppins, sans-serif', fontSize: '1.1rem', fontWeight: 400, letterSpacing: '0.04em' }}
              className="text-[#444] italic">
              {metaMensal > 0 ? `Objetivo: ${fmt(metaMensal)} / mês` : 'Defina o faturamento alvo para o mês'}
            </p>
          </div>
          {metaMensal > 0 && (
            <span style={{ border: BORDER }} className="text-[10px] tracking-[0.2em] uppercase text-[#555] px-3 py-1.5 font-medium">
              Meta ativa
            </span>
          )}
        </div>
        <div className="flex gap-4 items-end max-w-md">
          <div className="flex-1">
            <label className={labelCls}>Faturamento Alvo — R$ / mês</label>
            <input
              className={inputCls}
              type="number" min="0" step="0.01"
              value={metaInput}
              onChange={e => setMetaInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && salvarMeta()}
              placeholder="Ex: 15000.00"
            />
          </div>
          <button
            onClick={salvarMeta}
            style={{ border: BORDER_STRONG }}
            className="bg-[#0c0c0c] px-6 py-3 text-[11px] tracking-[0.2em] uppercase text-[#aaa] hover:border-[#666] hover:text-[#e8e8e8] transition-all font-medium whitespace-nowrap"
          >
            Salvar Meta
          </button>
        </div>
      </section>

      {/* ════ FORM PRODUTO ════ */}
      <section style={{ borderBottom: BORDER_STRONG }} className="mb-14 pb-14">
        <div className="flex items-end justify-between mb-8">
          <h2 style={{ fontFamily: 'Poppins, sans-serif', fontSize: '0.65rem', fontWeight: 500, letterSpacing: '0.32em' }}
            className="text-[#555] uppercase">
            Cadastro de Produto
          </h2>
          <span className="text-[10px] tracking-[0.22em] uppercase text-[#444] font-medium">
            {produtos.length} {produtos.length === 1 ? 'produto' : 'produtos'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
          <div className="lg:col-span-2">
            <label className={labelCls}>Nome do Produto</label>
            <input className={inputCls} value={nome}
              onChange={e => setNome(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
              placeholder="Ex: Vestido Noir" />
          </div>
          <div>
            <label className={labelCls}>Custo — R$</label>
            <input className={inputCls} type="number" min="0" step="0.01"
              value={precoCusto} onChange={e => setPrecoCusto(e.target.value)} placeholder="0.00" />
          </div>
          <div>
            <label className={labelCls}>Meta de Venda — R$ <span className="text-[#333] normal-case tracking-normal">(opcional)</span></label>
            <input className={inputCls} type="number" min="0" step="0.01"
              value={metaVendaInput} onChange={e => setMetaVendaInput(e.target.value)} placeholder="Preço alvo" />
          </div>
          <div className="lg:col-span-2">
            <label className={labelCls}>Venda Real — R$ <span className="text-[#333] normal-case tracking-normal">(opcional)</span></label>
            <input className={inputCls} type="number" min="0" step="0.01"
              value={precoVenda} onChange={e => setPrecoVenda(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAdd()} placeholder="Por quanto foi vendido" />
          </div>
        </div>

        <button
          onClick={handleAdd}
          style={{ border: BORDER_STRONG }}
          className="flex items-center gap-3 bg-[#0c0c0c] px-8 py-3 text-[11px] tracking-[0.22em] uppercase text-[#aaa] hover:border-[#666] hover:text-[#e8e8e8] hover:bg-[#111] transition-all font-medium"
        >
          <Plus size={13} strokeWidth={2} />
          Adicionar Produto
        </button>

        {error && (
          <p style={{ borderLeft: '2px solid #3a3a3a' }} className="text-[11px] tracking-[0.1em] text-[#666] pl-4 py-1 font-medium mt-4">
            {error}
          </p>
        )}
      </section>

      {/* ════ EMPTY ════ */}
      {produtos.length === 0 && (
        <div style={{ border: BORDER }} className="py-24 text-center">
          <p style={{ fontFamily: 'Poppins, sans-serif', fontSize: '1.5rem', fontWeight: 400, letterSpacing: '0.1em' }}
            className="text-[#2a2a2a] italic">
            Nenhum produto cadastrado
          </p>
          <p className="text-[10px] tracking-[0.22em] uppercase text-[#2a2a2a] mt-3 font-medium">
            Adicione produtos para visualizar as análises
          </p>
        </div>
      )}

      {produtos.length > 0 && (
        <>
          {/* ════ KPIs ════ */}
          <section className="mb-14">
            <SectionHeader title="Métricas da Loja" subtitle={metaMensal > 0 ? `Meta mensal: ${fmt(metaMensal)}` : 'Defina a meta mensal para ver projeções'} />
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <KpiCard label="Meta Mensal" value={metaMensal > 0 ? fmtK(metaMensal) : '—'} sub="faturamento alvo / mês" icon={<Target size={18} />} />
              <KpiCard label="Lucro Projetado" value={fmtK(totalLucroMeta)} sub="se a meta for atingida" icon={<TrendingUp size={18} />} />
              <KpiCard label="Margem Média" value={pct(margemMedia)} sub="média entre produtos" icon={<BarChart2 size={18} />} />
              <KpiCard label="Melhor Produto" value={melhorProduto ? pct(melhorProduto.margemReal ?? melhorProduto.margemPlanejada ?? 0) : '—'} sub={melhorProduto?.nome ?? ''} icon={<DollarSign size={18} />} />
            </div>
          </section>

          {/* ════ UNIDADES PARA BATER A META ════ */}
          {metaMensal > 0 && (
            <section style={{ borderBottom: BORDER }} className="mb-14 pb-14">
              <SectionHeader
                title="Unidades para Bater a Meta Mensal"
                subtitle={`Quantas vendas de cada produto são necessárias para atingir ${fmt(metaMensal)}/mês`}
              />
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={unidadesData} barCategoryGap="45%"
                  margin={{ top: 4, right: 0, left: -10, bottom: 0 }}>
                  <XAxis dataKey="nome" tick={axisStyle} axisLine={{ stroke: '#2a2a2a' }} tickLine={false} />
                  <YAxis allowDecimals={false} tick={axisStyle} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip currency={false} />} />
                  <Bar dataKey="Unidades" radius={0}>
                    {unidadesData.map((_, i) => (
                      <Cell key={i} fill={grays[i % grays.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </section>
          )}

          {/* ════ FATURAMENTO vs LUCRO ════ */}
          {metaMensal > 0 && (
            <section style={{ borderBottom: BORDER }} className="mb-14 pb-14">
              <SectionHeader
                title="Faturamento & Lucro Projetados"
                subtitle="Faturamento necessário vs. lucro projetado por produto ao atingir a meta"
              />
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={barMetasData} barCategoryGap="35%" barGap={4}
                  margin={{ top: 4, right: 0, left: -10, bottom: 0 }}>
                  <XAxis dataKey="nome" tick={axisStyle} axisLine={{ stroke: '#2a2a2a' }} tickLine={false} />
                  <YAxis tick={axisStyle} axisLine={false} tickLine={false} tickFormatter={fmtK} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="Faturamento Necessário" fill="#2a2a2a" />
                  <Bar dataKey="Lucro Projetado" fill="#e0e0e0" />
                </BarChart>
              </ResponsiveContainer>
              <Legend items={[['#2a2a2a', 'Faturamento Necessário'], ['#e0e0e0', 'Lucro Projetado']]} />
            </section>
          )}

          {/* ════ PREÇOS ════ */}
          <section style={{ borderBottom: BORDER }} className="mb-14 pb-14">
            <SectionHeader title="Comparativo de Preços" subtitle="Custo, venda e lucro unitário por produto" />
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={barPrecosData} barCategoryGap="35%" barGap={3}
                margin={{ top: 4, right: 0, left: -10, bottom: 0 }}>
                <XAxis dataKey="nome" tick={axisStyle} axisLine={{ stroke: '#2a2a2a' }} tickLine={false} />
                <YAxis tick={axisStyle} axisLine={false} tickLine={false} tickFormatter={fmtK} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="Custo" fill="#252525" />
                <Bar dataKey="Venda" fill="#888" />
                <Bar dataKey="Lucro" fill="#e8e8e8" />
              </BarChart>
            </ResponsiveContainer>
            <Legend items={[['#252525', 'Custo'], ['#888', 'Venda'], ['#e8e8e8', 'Lucro / un']]} />
          </section>

          {/* ════ MARGENS ════ */}
          <section style={{ borderBottom: BORDER }} className="mb-14 pb-14">
            <SectionHeader title="Margem & Markup" subtitle="Indicadores de rentabilidade percentual por produto" />
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={margemData} barCategoryGap="40%" barGap={4}
                margin={{ top: 4, right: 0, left: -10, bottom: 0 }}>
                <XAxis dataKey="nome" tick={axisStyle} axisLine={{ stroke: '#2a2a2a' }} tickLine={false} />
                <YAxis tick={axisStyle} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
                <ReferenceLine y={20} stroke="#2a2a2a" strokeDasharray="4 4" />
                <Tooltip content={<CustomTooltip currency={false} />} />
                <Bar dataKey="Margem" fill="#aaa" />
                <Bar dataKey="Markup" fill="#333" />
              </BarChart>
            </ResponsiveContainer>
            <p className="text-[10px] tracking-[0.18em] text-[#333] mt-3 font-medium">
              — linha de referência: 20% de margem mínima recomendada
            </p>
          </section>

          {/* ════ TABLE ════ */}
          <section>
            <SectionHeader title="Análise Detalhada" subtitle="Todos os indicadores por produto" />
            <div className="overflow-x-auto">
              <table className="w-full min-w-[780px] border-collapse">
                <thead>
                  <tr style={{ borderBottom: BORDER_STRONG }}>
                    {['Produto', 'Custo', 'Meta Venda', 'Venda Real', 'Lucro / un', 'Margem', 'Markup', 'Un. p/ Meta', 'Lucro s/ Meta', ''].map(h => (
                      <th key={h} className="text-left text-[9px] tracking-[0.22em] uppercase text-[#444] font-medium pb-3 pr-5">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map(p => {
                    const semVenda = p.precoVenda === null;
                    const editing = editVenda[p.id] !== undefined;
                    return (
                    <tr key={p.id} style={{ borderBottom: BORDER }} className="group hover:bg-[#0d0d0d] transition-colors">
                      <td className="py-4 pr-5">
                        <span style={{ fontFamily: 'Poppins, sans-serif', fontSize: '0.82rem', fontWeight: 300, letterSpacing: '0.14em' }}
                          className="text-[#c8c8c8] uppercase">{p.nome}</span>
                      </td>
                      <td className="py-4 pr-5 font-mono text-sm text-[#555] font-medium">{fmt(p.precoCusto)}</td>

                      {/* Meta de Venda */}
                      <td className="py-4 pr-5 font-mono text-sm text-[#666] font-medium">
                        {p.metaVenda !== null ? fmt(p.metaVenda) : <span className="text-[#2a2a2a]">—</span>}
                      </td>

                      {/* Venda Real — inline edit */}
                      <td className="py-3 pr-5">
                        {semVenda || editing ? (
                          <div className="flex items-center gap-2">
                            <input
                              style={{ border: '1px solid #3a3a3a' }}
                              className="bg-[#0c0c0c] px-2 py-1.5 w-28 text-sm font-mono text-[#e8e8e8] font-medium focus:border-[#666] focus:outline-none"
                              type="number" min="0" step="0.01"
                              placeholder="0.00"
                              autoFocus={editing}
                              value={editVenda[p.id] ?? ''}
                              onChange={e => setEditVenda(prev => ({ ...prev, [p.id]: e.target.value }))}
                              onKeyDown={e => {
                                if (e.key === 'Enter') salvarVenda(p.id);
                                if (e.key === 'Escape') setEditVenda(prev => { const n = { ...prev }; delete n[p.id]; return n; });
                              }}
                            />
                            <button onClick={() => salvarVenda(p.id)}
                              className="text-[10px] tracking-[0.15em] uppercase text-[#555] hover:text-[#aaa] transition-colors font-medium">
                              ok
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setEditVenda(prev => ({ ...prev, [p.id]: String(p.precoVenda) }))}
                            className="font-mono text-sm text-[#aaa] font-medium hover:text-[#e8e8e8] transition-colors text-left"
                          >
                            {fmt(p.precoVenda!)}
                          </button>
                        )}
                      </td>

                      <td className="py-4 pr-5 font-mono text-sm text-[#e0e0e0] font-medium">
                        {p.lucroReal !== null
                          ? fmt(p.lucroReal)
                          : p.lucroPlanejado !== null
                            ? <span className="text-[#666]">{fmt(p.lucroPlanejado)}</span>
                            : <span className="text-[#2a2a2a]">—</span>}
                      </td>
                      <td className="py-4 pr-5 font-mono text-sm text-[#888] font-medium">
                        {p.margemReal !== null
                          ? pct(p.margemReal)
                          : p.margemPlanejada !== null
                            ? <span className="text-[#555]">{pct(p.margemPlanejada)}</span>
                            : <span className="text-[#2a2a2a]">—</span>}
                      </td>
                      <td className="py-4 pr-5 font-mono text-sm text-[#666] font-medium">
                        {p.markupReal !== null
                          ? pct(p.markupReal)
                          : p.markupPlanejado !== null
                            ? <span className="text-[#444]">{pct(p.markupPlanejado)}</span>
                            : <span className="text-[#2a2a2a]">—</span>}
                      </td>
                      <td className="py-4 pr-5 font-mono text-sm text-[#e8e8e8] font-bold tracking-tight">
                        {metaMensal > 0 && p.unidades !== null ? p.unidades : <span className="text-[#2a2a2a]">—</span>}
                      </td>
                      <td className="py-4 pr-5 font-mono text-sm text-[#aaa] font-medium">
                        {metaMensal > 0 && p.lucroMeta !== null ? fmt(p.lucroMeta) : <span className="text-[#2a2a2a]">—</span>}
                      </td>
                      <td className="py-4">
                        <button onClick={() => remove(p.id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-[#333] hover:text-[#888] p-1">
                          <Trash2 size={13} strokeWidth={2} />
                        </button>
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
};

export default PrecificacaoTab;
