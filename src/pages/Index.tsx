import React, { useState } from 'react';
import PrecificacaoTab from '@/components/PrecificacaoTab';
import VendasTab from '@/components/VendasTab';

type Tab = 'precificacao' | 'vendas';

const TABS: { id: Tab; label: string }[] = [
  { id: 'precificacao', label: 'Precificação' },
  { id: 'vendas',       label: 'Vendas'       },
];

const Index: React.FC = () => {
  const [tab, setTab] = useState<Tab>('precificacao');

  return (
    <div className="min-h-screen bg-background">
      <header style={{ borderBottom: '1px solid #2a2a2a' }} className="sticky top-0 z-50 bg-[#040404]/95 backdrop-blur-md">
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
              className="text-[#555]"
            >
              CORTURE
            </span>
          </div>

          {/* Nav de abas */}
          <nav className="flex items-center gap-1">
            {TABS.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                style={{
                  borderBottom: tab === t.id ? '1px solid #666' : '1px solid transparent',
                }}
                className={[
                  'px-4 py-1.5 text-[10px] tracking-[0.22em] uppercase font-medium transition-colors',
                  tab === t.id ? 'text-[#e0e0e0]' : 'text-[#444] hover:text-[#888]',
                ].join(' ')}
              >
                {t.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="container py-10">
        {tab === 'precificacao' && <PrecificacaoTab />}
        {tab === 'vendas'       && <VendasTab />}
      </main>
    </div>
  );
};

export default Index;
