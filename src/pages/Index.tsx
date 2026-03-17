import React, { useState } from 'react';
import AppHeader from '@/components/AppHeader';
import PedidosTab from '@/components/PedidosTab';
import FaturamentoTab from '@/components/FaturamentoTab';
import DashboardTab from '@/components/DashboardTab';
import OSModal from '@/components/OSModal';
import { useAuth } from '@/contexts/AuthContext';
import { OSProvider } from '@/contexts/OSContext';
import LoginPage from './LoginPage';

const IndexContent: React.FC = () => {
  const { user, isOwner } = useAuth();
  const [activeTab, setActiveTab] = useState('pedidos');
  const [modalOS, setModalOS] = useState<{ id: string; mode: 'custos' | 'faturamento' } | null>(null);

  if (!user) return <LoginPage />;

  const openOS = (id: string, mode?: string) => {
    setModalOS({ id, mode: (mode as 'custos' | 'faturamento') || 'custos' });
  };

  // Prevent non-owners from accessing dashboard
  const tab = activeTab === 'dashboard' && !isOwner ? 'pedidos' : activeTab;

  return (
    <OSProvider>
      <div className="min-h-screen bg-background">
        <AppHeader activeTab={tab} onTabChange={setActiveTab} />
        <main className="container py-6">
          {tab === 'pedidos' && <PedidosTab onOpenOS={openOS} />}
          {tab === 'faturamento' && <FaturamentoTab onOpenOS={openOS} />}
          {tab === 'dashboard' && isOwner && <DashboardTab />}
        </main>
        {modalOS && (
          <OSModal osId={modalOS.id} initialMode={modalOS.mode} onClose={() => setModalOS(null)} />
        )}
      </div>
    </OSProvider>
  );
};

const Index: React.FC = () => <IndexContent />;

export default Index;
