import React, { useState, useMemo, useEffect } from 'react';
import { Trash2, Plus, TrendingUp, Target, DollarSign, BarChart2, Pencil, Check, X } from 'lucide-react';
import {
  createProduto, deleteProduto, updateProduto,
  fetchMetaMensal, saveMetaMensal,
  type Produto,
} from '@/services/produtoService';
import { fetchVendas } from '@/services/vendasService';

/* ─── Helpers ────────────────────────────────────────────────────────────── */

const fmt  = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 });
const fmtK = (v: number) => v >= 1000 ? `R$ ${(v / 1000).toFixed(1)}k` : `R$ ${v.toFixed(0)}`;
const pct  = (v: number) => `${v.toFixed(1)}%`;

function calc(p: Produto, metaMensal: number) {
  const vendido   = p.precoVenda ?? 0;
  const planejado = p.metaVenda ?? 0;

  const lucroReal      = vendido > 0   ? vendido   - p.precoCusto : null;
  const lucroPlanejado = planejado > 0 ? planejado - p.precoCusto : null;

  const margemReal      = lucroReal      !== null && vendido > 0   ? (lucroReal / vendido) * 100       : null;
  const margemPlanejada = lucroPlanejado !== null && planejado > 0 ? (lucroPlanejado / planejado) * 100 : null;

  const markupReal      = lucroReal      !== null && p.precoCusto > 0 ? (lucroReal / p.precoCusto) * 100      : null;
  const markupPlanejado = lucroPlanejado !== null && p.precoCusto > 0 ? (lucroPlanejado / p.precoCusto) * 100 : null;

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

const editInputCls = 'bg-[#111] border border-[#3a3a3a] px-3 py-1.5 text-sm text-[#e8e8e8] focus:border-[#666] focus:outline-none';

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

/* ─── Main ───────────────────────────────────────────────────────────────── */

interface Props {
  produtos: Produto[];
  setProdutos: React.Dispatch<React.SetStateAction<Produto[]>>;
  loadingProdutos: boolean;
}

const PrecificacaoTab: React.FC<Props> = ({ produtos, setProdutos, loadingProdutos }) => {
  const [metaMensal, setMetaMensal] = useState<number>(0);
  const [metaInput, setMetaInput] = useState<string>('');
  const [lucroRealMes, setLucroRealMes] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [dbError, setDbError] = useState('');

  const [nome, setNome]             = useState('');
  const [precoCusto, setPrecoCusto] = useState('');
  const [metaVendaInput, setMetaVendaInput] = useState('');
  const [error, setError]           = useState('');

  const [editId, setEditId] = useState<string | null>(null);
  const [editNome, setEditNome] = useState('');
  const [editCusto, setEditCusto] = useState('');
  const [editMetaVenda, setEditMetaVenda] = useState('');
  const [editError, setEditError] = useState('');

  useEffect(() => {
    const inicioMes = new Date();
    inicioMes.setDate(1);
    inicioMes.setHours(0, 0, 0, 0);

    Promise.all([fetchMetaMensal(), fetchVendas()])
      .then(([meta, vendas]) => {
        setMetaMensal(meta);
        if (meta > 0) setMetaInput(String(meta));
        const lucro = vendas
          .filter(v => new Date(v.created_at) >= inicioMes)
          .reduce((s, v) => s + (v.preco_venda - v.preco_custo) * v.quantidade, 0);
        setLucroRealMes(lucro);
      })
      .catch(err => setDbError(String(err?.message ?? err)))
      .finally(() => setLoading(false));
  }, []);

  const salvarMeta = async () => {
    const v = parseFloat(metaInput.replace(',', '.'));
    if (!v || v <= 0) return;
    try {
      await saveMetaMensal(v);
      setMetaMensal(v);
    } catch {
      setDbError('Erro ao salvar meta mensal. Verifique a conexão.');
    }
  };

  const handleAdd = async () => {
    const custo = parseFloat(precoCusto.replace(',', '.'));
    const metaV = metaVendaInput ? parseFloat(metaVendaInput.replace(',', '.')) : null;
    if (!nome.trim())                    { setError('Nome obrigatório.'); return; }
    if (!custo || custo <= 0)            { setError('Custo inválido.'); return; }
    if (metaV !== null && metaV < custo) { setError('Meta de venda não pode ser menor que o custo.'); return; }
    setError('');
    try {
      const novo = await createProduto({ nome: nome.trim(), precoCusto: custo, metaVenda: metaV, precoVenda: null });
      setProdutos(prev => [novo, ...prev]);
      setNome(''); setPrecoCusto(''); setMetaVendaInput('');
    } catch {
      setError('Erro ao salvar produto. Verifique a conexão.');
    }
  };

  const remove = async (id: string) => {
    try {
      await deleteProduto(id);
      setProdutos(prev => prev.filter(p => p.id !== id));
    } catch {
      setError('Erro ao remover produto. Verifique a conexão.');
    }
  };

  const startEdit = (p: Produto) => {
    setEditId(p.id);
    setEditNome(p.nome);
    setEditCusto(String(p.precoCusto));
    setEditMetaVenda(p.metaVenda !== null ? String(p.metaVenda) : '');
    setEditError('');
  };

  const cancelEdit = () => { setEditId(null); setEditError(''); };

  const saveEdit = async () => {
    if (!editId) return;
    const custo = parseFloat(editCusto.replace(',', '.'));
    const metaV = editMetaVenda ? parseFloat(editMetaVenda.replace(',', '.')) : null;
    if (!editNome.trim())                { setEditError('Nome obrigatório.'); return; }
    if (!custo || custo <= 0)            { setEditError('Custo inválido.'); return; }
    if (metaV !== null && metaV < custo) { setEditError('Meta de venda não pode ser menor que o custo.'); return; }
    try {
      await updateProduto(editId!, { nome: editNome.trim(), precoCusto: custo, metaVenda: metaV });
      setProdutos(prev => prev.map(p => p.id === editId ? { ...p, nome: editNome.trim(), precoCusto: custo, metaVenda: metaV } : p));
      setEditId(null);
      setEditError('');
    } catch {
      setEditError('Erro ao salvar. Verifique a conexão.');
    }
  };

  /* ── Derived ── */
  const rows = useMemo(() => produtos.map(p => ({ ...p, ...calc(p, metaMensal) })), [produtos, metaMensal]);

  const rowsComPreco = useMemo(() => rows.filter(r => r.precoVenda !== null || r.metaVenda !== null), [rows]);

  const margemMedia = useMemo(() => {
    const validos = rowsComPreco.filter(r => r.margemReal !== null || r.margemPlanejada !== null);
    return validos.length ? validos.reduce((s, r) => s + (r.margemReal ?? r.margemPlanejada ?? 0), 0) / validos.length : 0;
  }, [rowsComPreco]);

  const totalLucroMeta = useMemo(() => metaMensal * (margemMedia / 100), [metaMensal, margemMedia]);

  const melhorProduto = useMemo(() => {
    const validos = rowsComPreco.filter(r => r.margemReal !== null || r.margemPlanejada !== null);
    return validos.length ? validos.reduce((a, b) => (a.margemReal ?? a.margemPlanejada ?? 0) > (b.margemReal ?? b.margemPlanejada ?? 0) ? a : b) : null;
  }, [rowsComPreco]);

  if (loading || loadingProdutos) return (
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
              value={metaVendaInput} onChange={e => setMetaVendaInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAdd()} placeholder="Preço alvo" />
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
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              <KpiCard label="Meta Mensal" value={metaMensal > 0 ? fmtK(metaMensal) : '—'} sub="faturamento alvo / mês" icon={<Target size={18} />} />
              <KpiCard label="Lucro Projetado" value={fmtK(totalLucroMeta)} sub="se a meta for atingida" icon={<TrendingUp size={18} />} />
              <KpiCard label="Lucro Real" value={fmtK(lucroRealMes)} sub="vendas deste mês" icon={<DollarSign size={18} />} />
              <KpiCard label="Margem Média" value={pct(margemMedia)} sub="média entre produtos" icon={<BarChart2 size={18} />} />
              <KpiCard label="Melhor Produto" value={melhorProduto ? pct(melhorProduto.margemReal ?? melhorProduto.margemPlanejada ?? 0) : '—'} sub={melhorProduto?.nome ?? ''} icon={<DollarSign size={18} />} />
            </div>
          </section>

          {/* ════ TABLE ════ */}
          <section>
            <SectionHeader title="Análise Detalhada" subtitle="Todos os indicadores por produto" />
            <div className="overflow-x-auto">
              <table className="w-full min-w-[780px] border-collapse">
                <thead>
                  <tr style={{ borderBottom: BORDER_STRONG }}>
                    {['Produto', 'Custo', 'Meta Venda', 'Lucro / un', 'Margem', 'Markup', ''].map(h => (
                      <th key={h} className="text-left text-[9px] tracking-[0.22em] uppercase text-[#444] font-medium pb-3 pr-5">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map(p => {
                    const isEditing = editId === p.id;
                    if (isEditing) return (
                      <tr key={p.id} style={{ borderBottom: BORDER }} className="bg-[#0d0d0d]">
                        <td className="py-3 pr-3">
                          <input
                            className={`w-full ${editInputCls}`}
                            value={editNome} onChange={e => setEditNome(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') cancelEdit(); }}
                            autoFocus
                          />
                        </td>
                        <td className="py-3 pr-3">
                          <input
                            className={`w-28 font-mono ${editInputCls}`}
                            type="number" min="0" step="0.01"
                            value={editCusto} onChange={e => setEditCusto(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') cancelEdit(); }}
                          />
                        </td>
                        <td className="py-3 pr-3">
                          <input
                            className={`w-28 font-mono ${editInputCls}`}
                            type="number" min="0" step="0.01"
                            value={editMetaVenda} onChange={e => setEditMetaVenda(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') cancelEdit(); }}
                            placeholder="—"
                          />
                        </td>
                        <td className="py-3 pr-5 font-mono text-sm text-[#444]" colSpan={3}>
                          {editError && <span className="text-[11px] text-[#666] tracking-wide">{editError}</span>}
                        </td>
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            <button onClick={saveEdit} className="text-[#555] hover:text-[#aaa] transition-colors p-1">
                              <Check size={13} strokeWidth={2} />
                            </button>
                            <button onClick={cancelEdit} className="text-[#333] hover:text-[#666] transition-colors p-1">
                              <X size={13} strokeWidth={2} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                    return (
                    <tr key={p.id} style={{ borderBottom: BORDER }} className="group hover:bg-[#0d0d0d] transition-colors">
                      <td className="py-4 pr-5">
                        <span style={{ fontFamily: 'Poppins, sans-serif', fontSize: '0.82rem', fontWeight: 300, letterSpacing: '0.14em' }}
                          className="text-[#c8c8c8] uppercase">{p.nome}</span>
                      </td>
                      <td className="py-4 pr-5 font-mono text-sm text-[#555] font-medium">{fmt(p.precoCusto)}</td>

                      <td className="py-4 pr-5 font-mono text-sm text-[#666] font-medium">
                        {p.metaVenda !== null ? fmt(p.metaVenda) : <span className="text-[#2a2a2a]">—</span>}
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
                      <td className="py-4">
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => startEdit(p)} className="text-[#333] hover:text-[#888] transition-colors p-1">
                            <Pencil size={13} strokeWidth={2} />
                          </button>
                          <button onClick={() => remove(p.id)} className="text-[#333] hover:text-[#888] transition-colors p-1">
                            <Trash2 size={13} strokeWidth={2} />
                          </button>
                        </div>
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
