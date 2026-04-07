import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { LogOut } from 'lucide-react';

const AppHeader: React.FC<{ activeTab: string; onTabChange: (tab: string) => void }> = ({ activeTab, onTabChange }) => {
  const { user, logout, isOwner } = useAuth();

  const tabs = [
    { id: 'pedidos', label: 'Pedidos / OS' },
    { id: 'faturamento', label: 'Faturamento' },
    ...(isOwner ? [{ id: 'dashboard', label: 'Dashboard' }] : []),
    { id: 'precificacao', label: 'Precificação' },
    { id: 'lixeira', label: 'Lixeira' },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="container flex items-center justify-between h-14">
        <div className="flex items-center gap-6">
          <h1 className="font-display font-extrabold text-lg text-primary tracking-tight">ELEVADE CORTURE</h1>
          <nav className="flex gap-1">
            {tabs.map(t => (
              <button
                key={t.id}
                onClick={() => onTabChange(t.id)}
                className={`px-3 py-1.5 text-sm rounded transition-colors ${
                  activeTab === t.id
                    ? 'bg-primary text-primary-foreground font-semibold'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {t.label}
              </button>
            ))}
          </nav>
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
