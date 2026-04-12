import React, { useState, useMemo, useEffect } from 'react';
import { Trash2, Plus, ShoppingBag, TrendingUp, DollarSign, Package } from 'lucide-react';
import { fetchVendas, createVenda, deleteVenda, type Venda } from '@/services/vendasService';
import { createProduto, updateProduto, type Produto } from '@/services/produtoService';

/* ─── Helpers ────────────────────────────────────────────────────────────── */

const fmt  = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 });
const fmtK = (v: number) => v >= 1000 ? `R$ ${(v / 1000).toFixed(1)}k` : `R$ ${v.toFixed(0)}`;

function startOfDay(d: Date) {
  const r = new Date(d); r.setHours(0,0,0,0); return r;
}
function startOfWeek(d: Date) {
  const r = new Date(d);
  const day = r.getDay(); // 0=dom
  r.setDate(r.getDate() - day);
  r.setHours(0,0,0,0);
  return r;
}
function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function fmtDataHora(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

/* ─── Constants ─────────────────────────────────────────────────────────── */

const MANUAL_ID = '__manual__';

/* ─── Shared Styles ──────────────────────────────────────────────────────── */

const BORDER        = '1px solid #2a2a2a';
const BORDER_STRONG = '1px solid #3a3a3a';

const labelCls = 'block text-[10px] tracking-[0.2em] uppercase text-[#666] mb-2 font-medium';

const inputCls = [
  'w-full bg-[#0c0c0c] border border-[#2a2a2a] px-4 py-3',
  'text-sm text-[#e8e8e8] font-medium tracking-wide',
  'placeholder:text-[#2a2a2a] focus:border-[#666] focus:outline-none transition-colors',
].join(' ');

const selectCls = [
  'w-full bg-[#0c0c0c] border border-[#2a2a2a] px-4 py-3',
  'text-sm text-[#e8e8e8] font-medium tracking-wide',
  'focus:border-[#666] focus:outline-none transition-colors appearance-none cursor-pointer',
].join(' ');

/* ─── KPI Card ───────────────────────────────────────────────────────────── */

const KpiCard: React.FC<{ label: string; value: string; sub?: string; icon?: React.ReactNode }> = ({ label: l, value, sub, icon }) => (
  <div style={{ border: BORDER }} className="p-5 bg-[#070707]">
    <div className="flex items-start justify-between mb-3">
      <p className="text-[9px] tracking-[0.28em] uppercase text-[#444] font-medium">{l}</p>
      {icon && <span className="text-[#252525]">{icon}</span>}
    </div>
    <p style={{ fontFamily: 'Poppins, sans-serif', fontSize: '1.5rem', fontWeight: 200, letterSpacing: '0.04em', lineHeight: 1 }}
      className="text-[#e0e0e0] mb-2">{value}</p>
    {sub && <p className="text-[10px] text-[#3a3a3a] font-medium tracking-[0.12em] mt-2 uppercase">{sub}</p>}
  </div>
);

/* ─── Period Header ──────────────────────────────────────────────────────── */

const PeriodHeader: React.FC<{ title: string }> = ({ title }) => (
  <p className="text-[9px] tracking-[0.28em] uppercase text-[#444] font-medium mb-3">{title}</p>
);

/* ─── Main ───────────────────────────────────────────────────────────────── */

interface Props {
  produtos: Produto[];
  setProdutos: React.Dispatch<React.SetStateAction<Produto[]>>;
  loadingProdutos: boolean;
}

const VendasTab: React.FC<Props> = ({ produtos, setProdutos, loadingProdutos }) => {
  const [vendas, setVendas] = useState<Venda[]>([]);
  const [loading, setLoading]   = useState(true);
  const [dbError, setDbError]   = useState('');
  const [error, setError]       = useState('');

  // Form
  const [produtoId, setProdutoId]       = useState('');
  const [nomeManual, setNomeManual]     = useState('');
  const [quantidade, setQuantidade]     = useState('1');
  const [precoVenda, setPrecoVenda]     = useState('');
  const [precoCusto, setPrecoCusto]     = useState('');

  useEffect(() => {
    fetchVendas()
      .then(setVendas)
      .catch(err => setDbError(String(err?.message ?? err)))
      .finally(() => setLoading(false));
  }, []);

  // Ao selecionar produto, preenche preços automaticamente
  const handleSelectProduto = (id: string) => {
    setProdutoId(id);
    if (!id || id === MANUAL_ID) { setPrecoVenda(''); setPrecoCusto(''); return; }
    const p = produtos.find(p => p.id === id);
    if (!p) return;
    setPrecoVenda(String(p.precoVenda ?? p.metaVenda ?? ''));
    setPrecoCusto(String(p.precoCusto));
  };

  const handleAdd = async () => {
    const isManual = !produtoId || produtoId === MANUAL_ID;
    const qtd   = parseInt(quantidade);
    const pv    = parseFloat(precoVenda.replace(',', '.'));
    const pc    = parseFloat(precoCusto.replace(',', '.'));
    const nome  = isManual
      ? nomeManual.trim()
      : (produtos.find(p => p.id === produtoId)?.nome ?? '');

    if (!nome)              { setError('Selecione ou informe o produto.'); return; }
    if (!qtd || qtd <= 0)  { setError('Quantidade inválida.'); return; }
    if (!pv || pv <= 0)    { setError('Preço de venda inválido.'); return; }
    if (!pc || pc <= 0)    { setError('Custo inválido.'); return; }
    if (pv < pc)           { setError('Preço de venda não pode ser menor que o custo.'); return; }

    setError('');
    try {
      let idFinal = (produtoId && produtoId !== MANUAL_ID) ? produtoId : null;

      // Produto não cadastrado: cria no catálogo automaticamente
      if (isManual) {
        const novoProduto = await createProduto({ nome, precoCusto: pc, metaVenda: null, precoVenda: pv });
        idFinal = novoProduto.id;
        setProdutos(prev => [novoProduto, ...prev]);
      }

      const nova = await createVenda({
        produto_id:   idFinal,
        produto_nome: nome,
        quantidade:   qtd,
        preco_venda:  pv,
        preco_custo:  pc,
      });
      setVendas(prev => [nova, ...prev]);
      setProdutoId(''); setNomeManual(''); setQuantidade('1'); setPrecoVenda(''); setPrecoCusto('');
    } catch {
      setError('Erro ao registrar venda. Verifique a conexão.');
    }
  };

  const remove = async (id: string) => {
    const venda = vendas.find(v => v.id === id);
    try {
      await Promise.all([
        deleteVenda(id),
        venda?.produto_id ? updateProduto(venda.produto_id, { precoVenda: null }) : Promise.resolve(),
      ]);
      setVendas(prev => prev.filter(v => v.id !== id));
      if (venda?.produto_id) {
        setProdutos(prev => prev.map(p => p.id === venda.produto_id ? { ...p, precoVenda: null } : p));
      }
    } catch {
      setError('Erro ao remover venda.');
    }
  };

  /* ── Métricas ── */
  const { vendas_hoje, vendas_semana, vendas_mes } = useMemo(() => {
    const now = new Date();
    const t_hoje   = startOfDay(now);
    const t_semana = startOfWeek(now);
    const t_mes    = startOfMonth(now);
    return {
      vendas_hoje:   vendas.filter(v => new Date(v.created_at) >= t_hoje),
      vendas_semana: vendas.filter(v => new Date(v.created_at) >= t_semana),
      vendas_mes:    vendas.filter(v => new Date(v.created_at) >= t_mes),
    };
  }, [vendas]);

  function soma(vs: Venda[]) {
    return vs.reduce((acc, v) => ({
      fat:   acc.fat   + v.preco_venda * v.quantidade,
      lucro: acc.lucro + (v.preco_venda - v.preco_custo) * v.quantidade,
      qtd:   acc.qtd   + v.quantidade,
    }), { fat: 0, lucro: 0, qtd: 0 });
  }

  const mHoje   = useMemo(() => soma(vendas_hoje),   [vendas_hoje]);
  const mSemana = useMemo(() => soma(vendas_semana), [vendas_semana]);
  const mMes    = useMemo(() => soma(vendas_mes),    [vendas_mes]);

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

  const produtoSelecionado = produtoId ? produtos.find(p => p.id === produtoId) : null;

  return (
    <div className="max-w-6xl mx-auto pb-24">

      {/* ════ FORM ════ */}
      <section style={{ borderBottom: BORDER_STRONG }} className="mb-14 pb-14">
        <div className="flex items-end justify-between mb-8">
          <h2 style={{ fontFamily: 'Poppins, sans-serif', fontSize: '0.65rem', fontWeight: 500, letterSpacing: '0.32em' }}
            className="text-[#555] uppercase">
            Registrar Venda
          </h2>
          <span className="text-[10px] tracking-[0.22em] uppercase text-[#444] font-medium">
            {vendas.length} {vendas.length === 1 ? 'venda registrada' : 'vendas registradas'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
          {/* Produto */}
          <div className="lg:col-span-2">
            <label className={labelCls}>Produto</label>
            {produtos.length > 0 ? (
              <select
                className={selectCls}
                value={produtoId}
                onChange={e => handleSelectProduto(e.target.value)}
              >
                <option value="">— selecionar produto —</option>
                {produtos.map(p => (
                  <option key={p.id} value={p.id}>{p.nome}</option>
                ))}
                <option value="__manual__">Outro (digitar nome)</option>
              </select>
            ) : (
              <input className={inputCls} value={nomeManual}
                onChange={e => setNomeManual(e.target.value)}
                placeholder="Nome do produto" />
            )}
            {produtoId === MANUAL_ID && (
              <input className={inputCls + ' mt-2'} value={nomeManual}
                onChange={e => setNomeManual(e.target.value)}
                placeholder="Nome do produto" />
            )}
          </div>

          {/* Quantidade */}
          <div>
            <label className={labelCls}>Quantidade</label>
            <input className={inputCls} type="number" min="1" step="1"
              value={quantidade} onChange={e => setQuantidade(e.target.value)} />
          </div>

          {/* Preço de venda */}
          <div>
            <label className={labelCls}>
              Preço de Venda — R$
              {produtoSelecionado && (
                <span className="text-[#333] normal-case tracking-normal ml-1">(auto)</span>
              )}
            </label>
            <input className={inputCls} type="number" min="0" step="0.01"
              value={precoVenda} onChange={e => setPrecoVenda(e.target.value)}
              placeholder="0.00" />
          </div>

          {/* Custo */}
          <div>
            <label className={labelCls}>
              Custo — R$
              {produtoSelecionado && (
                <span className="text-[#333] normal-case tracking-normal ml-1">(auto)</span>
              )}
            </label>
            <input className={inputCls} type="number" min="0" step="0.01"
              value={precoCusto} onChange={e => setPrecoCusto(e.target.value)}
              placeholder="0.00" />
          </div>

          {/* Preview lucro */}
          {precoVenda && precoCusto && parseFloat(precoVenda) > 0 && parseFloat(precoCusto) > 0 && (
            <div style={{ border: BORDER }} className="p-4 bg-[#070707] flex flex-col justify-center">
              <p className="text-[9px] tracking-[0.22em] uppercase text-[#444] font-medium mb-2">Lucro desta venda</p>
              <p style={{ fontFamily: 'Poppins, sans-serif', fontSize: '1.2rem', fontWeight: 200 }}
                className="text-[#e0e0e0]">
                {fmt((parseFloat(precoVenda) - parseFloat(precoCusto)) * parseInt(quantidade || '1'))}
              </p>
              <p className="text-[10px] text-[#3a3a3a] mt-1 font-medium">
                {parseInt(quantidade || '1')} × {fmt(parseFloat(precoVenda) - parseFloat(precoCusto))} / un
              </p>
            </div>
          )}
        </div>

        <button
          onClick={handleAdd}
          style={{ border: BORDER_STRONG }}
          className="flex items-center gap-3 bg-[#0c0c0c] px-8 py-3 text-[11px] tracking-[0.22em] uppercase text-[#aaa] hover:border-[#666] hover:text-[#e8e8e8] hover:bg-[#111] transition-all font-medium"
        >
          <Plus size={13} strokeWidth={2} />
          Registrar Venda
        </button>

        {error && (
          <p style={{ borderLeft: '2px solid #3a3a3a' }} className="text-[11px] tracking-[0.1em] text-[#666] pl-4 py-1 font-medium mt-4">
            {error}
          </p>
        )}
      </section>

      {/* ════ MÉTRICAS ════ */}
      <section className="mb-14">
        <div style={{ borderBottom: BORDER_STRONG }} className="mb-8 pb-4">
          <h3 style={{ fontFamily: 'Poppins, sans-serif', fontSize: '1.1rem', fontWeight: 200, letterSpacing: '0.2em' }}
            className="text-[#c0c0c0] uppercase">Análise de Vendas</h3>
        </div>

        {/* Hoje */}
        <div className="mb-8">
          <PeriodHeader title="Hoje" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard label="Faturamento" value={fmtK(mHoje.fat)} sub="total do dia" icon={<DollarSign size={16} />} />
            <KpiCard label="Lucro" value={fmtK(mHoje.lucro)} sub="lucro do dia" icon={<TrendingUp size={16} />} />
            <KpiCard label="Vendas" value={String(vendas_hoje.length)} sub={`${mHoje.qtd} ${mHoje.qtd === 1 ? 'unidade' : 'unidades'}`} icon={<ShoppingBag size={16} />} />
            <KpiCard
              label="Ticket Médio"
              value={vendas_hoje.length > 0 ? fmt(mHoje.fat / vendas_hoje.length) : '—'}
              sub="por transação"
              icon={<Package size={16} />}
            />
          </div>
        </div>

        {/* Semana */}
        <div className="mb-8">
          <PeriodHeader title="Esta Semana" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard label="Faturamento" value={fmtK(mSemana.fat)} sub="total da semana" icon={<DollarSign size={16} />} />
            <KpiCard label="Lucro" value={fmtK(mSemana.lucro)} sub="lucro da semana" icon={<TrendingUp size={16} />} />
            <KpiCard label="Vendas" value={String(vendas_semana.length)} sub={`${mSemana.qtd} ${mSemana.qtd === 1 ? 'unidade' : 'unidades'}`} icon={<ShoppingBag size={16} />} />
            <KpiCard
              label="Ticket Médio"
              value={vendas_semana.length > 0 ? fmt(mSemana.fat / vendas_semana.length) : '—'}
              sub="por transação"
              icon={<Package size={16} />}
            />
          </div>
        </div>

        {/* Mês */}
        <div>
          <PeriodHeader title="Este Mês" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard label="Faturamento" value={fmtK(mMes.fat)} sub="total do mês" icon={<DollarSign size={16} />} />
            <KpiCard label="Lucro" value={fmtK(mMes.lucro)} sub="lucro do mês" icon={<TrendingUp size={16} />} />
            <KpiCard label="Vendas" value={String(vendas_mes.length)} sub={`${mMes.qtd} ${mMes.qtd === 1 ? 'unidade' : 'unidades'}`} icon={<ShoppingBag size={16} />} />
            <KpiCard
              label="Ticket Médio"
              value={vendas_mes.length > 0 ? fmt(mMes.fat / vendas_mes.length) : '—'}
              sub="por transação"
              icon={<Package size={16} />}
            />
          </div>
        </div>
      </section>

      {/* ════ HISTÓRICO ════ */}
      <section>
        <div style={{ borderBottom: BORDER_STRONG }} className="mb-8 pb-4">
          <h3 style={{ fontFamily: 'Poppins, sans-serif', fontSize: '1.1rem', fontWeight: 200, letterSpacing: '0.2em' }}
            className="text-[#c0c0c0] uppercase">Histórico</h3>
        </div>

        {vendas.length === 0 ? (
          <div style={{ border: BORDER }} className="py-24 text-center">
            <p style={{ fontFamily: 'Poppins, sans-serif', fontSize: '1.5rem', fontWeight: 400, letterSpacing: '0.1em' }}
              className="text-[#2a2a2a] italic">
              Nenhuma venda registrada
            </p>
            <p className="text-[10px] tracking-[0.22em] uppercase text-[#2a2a2a] mt-3 font-medium">
              Registre a primeira venda acima
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse">
              <thead>
                <tr style={{ borderBottom: BORDER_STRONG }}>
                  {['Data', 'Produto', 'Qtd', 'Preço / un', 'Total', 'Lucro', ''].map(h => (
                    <th key={h} className="text-left text-[9px] tracking-[0.22em] uppercase text-[#444] font-medium pb-3 pr-5">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {vendas.map(v => {
                  const total = v.preco_venda * v.quantidade;
                  const lucro = (v.preco_venda - v.preco_custo) * v.quantidade;
                  return (
                    <tr key={v.id} style={{ borderBottom: BORDER }} className="group hover:bg-[#0d0d0d] transition-colors">
                      <td className="py-4 pr-5 font-mono text-xs text-[#444] font-medium whitespace-nowrap">
                        {fmtDataHora(v.created_at)}
                      </td>
                      <td className="py-4 pr-5">
                        <span style={{ fontFamily: 'Poppins, sans-serif', fontSize: '0.82rem', fontWeight: 300, letterSpacing: '0.14em' }}
                          className="text-[#c8c8c8] uppercase">{v.produto_nome}</span>
                      </td>
                      <td className="py-4 pr-5 font-mono text-sm text-[#555] font-medium text-center">
                        {v.quantidade}
                      </td>
                      <td className="py-4 pr-5 font-mono text-sm text-[#555] font-medium">
                        {fmt(v.preco_venda)}
                      </td>
                      <td className="py-4 pr-5 font-mono text-sm text-[#aaa] font-medium">
                        {fmt(total)}
                      </td>
                      <td className="py-4 pr-5 font-mono text-sm font-medium" style={{ color: lucro >= 0 ? '#e0e0e0' : '#666' }}>
                        {fmt(lucro)}
                      </td>
                      <td className="py-4">
                        <button onClick={() => remove(v.id)}
                          className="opacity-30 hover:opacity-100 transition-opacity text-[#666] hover:text-[#e8e8e8] p-1">
                          <Trash2 size={13} strokeWidth={2} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};

export default VendasTab;
