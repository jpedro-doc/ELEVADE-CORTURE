import React, { useState, useEffect } from 'react';
import PrecificacaoTab from '@/components/PrecificacaoTab';
import VendasTab from '@/components/VendasTab';
import EstoqueTab from '@/components/EstoqueTab';
import { fetchProdutos, type Produto } from '@/services/produtoService';

type Tab = 'precificacao' | 'vendas' | 'estoque';

const TABS: { id: Tab; label: string }[] = [
  { id: 'precificacao', label: 'Precificação' },
  { id: 'vendas',       label: 'Vendas'       },
  { id: 'estoque',      label: 'Estoque'      },
];

const BORDER = '1px solid #2a2a2a';

const Index: React.FC = () => {
  const [tab, setTab] = useState<Tab>('precificacao');
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loadingProdutos, setLoadingProdutos] = useState(true);
  const [dbError, setDbError] = useState('');

  useEffect(() => {
    fetchProdutos()
      .then(setProdutos)
      .catch(err => setDbError(String(err?.message ?? err)))
      .finally(() => setLoadingProdutos(false));
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <header style={{ borderBottom: BORDER }} className="sticky top-0 z-50 bg-[#040404]/95 backdrop-blur-md">
        <div className="container h-16 flex items-center justify-between">
          <div className="flex items-baseline gap-3">
            <h1
              style={{ fontFamily: 'Poppins, sans-serif', fontSize: '0.85rem', fontWeight: 600, letterSpacing: '0.4em' }}
              className="text-[#e0e0e0]"
            >
              ELEVADE
            </h1>
            <span
              style={{ fontFamily: 'Poppins, sans-serif', fontSize: '0.85rem', fontWeight: 200, letterSpacing: '0.4em' }}
              className="text-[#888]"
            >
              CORTURE
            </span>
          </div>

          <nav className="flex items-center gap-1">
            {TABS.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                style={{ borderBottom: tab === t.id ? '1px solid #888' : '1px solid transparent' }}
                className={[
                  'px-4 py-1.5 text-[10px] tracking-[0.22em] uppercase font-medium transition-colors',
                  tab === t.id ? 'text-[#e0e0e0]' : 'text-[#666] hover:text-[#bbb]',
                ].join(' ')}
              >
                {t.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="container py-10">
        {dbError ? (
          <div className="py-24 text-center space-y-3">
            <p className="text-[10px] tracking-[0.3em] uppercase text-[#666] font-medium">Erro de conexão com o banco</p>
            <p className="font-mono text-xs text-[#444] max-w-lg mx-auto break-words">{dbError}</p>
          </div>
        ) : (
          <>
            {tab === 'precificacao' && (
              <PrecificacaoTab
                produtos={produtos}
                setProdutos={setProdutos}
                loadingProdutos={loadingProdutos}
              />
            )}
            {tab === 'vendas' && (
              <VendasTab
                produtos={produtos}
                setProdutos={setProdutos}
                loadingProdutos={loadingProdutos}
              />
            )}
            {tab === 'estoque' && (
              <EstoqueTab
                produtos={produtos}
                loadingProdutos={loadingProdutos}
              />
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default Index;