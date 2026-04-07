import React from 'react';
import PrecificacaoTab from '@/components/PrecificacaoTab';

const Index: React.FC = () => (
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
        <span className="text-[8px] tracking-[0.35em] uppercase text-[#333] font-medium">
          Dashboard de Precificação
        </span>
      </div>
    </header>
    <main className="container py-10">
      <PrecificacaoTab />
    </main>
  </div>
);

export default Index;
