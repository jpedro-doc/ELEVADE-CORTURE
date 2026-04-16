import React from 'react';
import { type Produto } from '@/services/produtoService';

/* ─── Helpers ────────────────────────────────────────────────────────────── */

const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 });

/* ─── Shared Styles ──────────────────────────────────────────────────────── */

const BORDER        = '1px solid #2a2a2a';
const BORDER_STRONG = '1px solid #3a3a3a';

/* ─── Main ───────────────────────────────────────────────────────────────── */

interface Props {
  produtos: Produto[];
  loadingProdutos: boolean;
}

const EstoqueTab: React.FC<Props> = ({ produtos, loadingProdutos }) => {
  const emEstoque = produtos.filter(p => p.emEstoque);

  if (loadingProdutos) return (
    <div className="max-w-6xl mx-auto py-24 text-center">
      <p className="text-[10px] tracking-[0.3em] uppercase text-[#666] font-medium">Carregando...</p>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto pb-24">

      {/* ════ HEADER ════ */}
      <div style={{ borderBottom: BORDER_STRONG }} className="mb-10 pb-6 flex items-end justify-between">
        <div>
          <h3 style={{ fontFamily: 'Poppins, sans-serif', fontSize: '1.1rem', fontWeight: 200, letterSpacing: '0.2em' }}
            className="text-[#d8d8d8] uppercase">Estoque</h3>
          <p className="text-[10px] text-[#666] tracking-[0.18em] mt-2 font-medium uppercase">
            Produtos disponíveis para venda
          </p>
        </div>
        <div style={{ border: BORDER }} className="px-4 py-2 text-center">
          <p className="text-[9px] tracking-[0.22em] uppercase text-[#888] font-medium mb-1">Em estoque</p>
          <p style={{ fontFamily: 'Poppins, sans-serif', fontSize: '1.4rem', fontWeight: 200 }}
            className="text-[#e0e0e0]">{emEstoque.length}</p>
        </div>
      </div>

      {/* ════ EMPTY ════ */}
      {emEstoque.length === 0 && (
        <div style={{ border: BORDER }} className="py-24 text-center">
          <p style={{ fontFamily: 'Poppins, sans-serif', fontSize: '1.5rem', fontWeight: 400, letterSpacing: '0.1em' }}
            className="text-[#555] italic">
            Estoque vazio
          </p>
          <p className="text-[10px] tracking-[0.22em] uppercase text-[#555] mt-3 font-medium">
            Adicione produtos em Precificação para popular o estoque
          </p>
        </div>
      )}

      {/* ════ TABLE ════ */}
      {emEstoque.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] border-collapse">
            <thead>
              <tr style={{ borderBottom: BORDER_STRONG }}>
                {['Produto', 'Custo', 'Meta Venda', 'Status'].map(h => (
                  <th key={h} className="text-left text-[9px] tracking-[0.22em] uppercase text-[#888] font-medium pb-3 pr-5">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {emEstoque.map(p => (
                <tr key={p.id} style={{ borderBottom: BORDER }} className="hover:bg-[#0d0d0d] transition-colors">
                  <td className="py-4 pr-5">
                    <span style={{ fontFamily: 'Poppins, sans-serif', fontSize: '0.82rem', fontWeight: 300, letterSpacing: '0.14em' }}
                      className="text-[#c8c8c8] uppercase">{p.nome}</span>
                  </td>
                  <td className="py-4 pr-5 font-mono text-sm text-[#999] font-medium">{fmt(p.precoCusto)}</td>
                  <td className="py-4 pr-5 font-mono text-sm text-[#aaa] font-medium">
                    {p.metaVenda !== null ? fmt(p.metaVenda) : <span className="text-[#555]">—</span>}
                  </td>
                  <td className="py-4 pr-5">
                    <span className="text-[9px] tracking-[0.2em] uppercase text-[#888] font-medium border border-[#2a2a2a] px-2 py-1">
                      disponível
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default EstoqueTab;
