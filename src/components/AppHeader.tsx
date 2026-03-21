import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { LogOut } from 'lucide-react';

const AppHeader: React.FC<{ activeTab: string; onTabChange: (tab: string) => void }> = ({ activeTab, onTabChange }) => {
  const { user, logout, isOwner } = useAuth();

  const tabs = [
    { id: 'pedidos', label: 'Pedidos / OS' },
    { id: 'faturamento', label: 'Faturamento' },
    ...(isOwner ? [{ id: 'dashboard', label: 'Dashboard' }] : []),
    { id: 'lixeira', label: 'Lixeira' },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="container flex items-center justify-between h-14">
        <div className="flex items-center gap-6">
          <h1 className="font-display font-extrabold text-lg text-primary tracking-tight">GestãoPro</h1>
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
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm text-foreground">{user?.displayName}</span>
            <span className={`text-xs px-2 py-0.5 rounded font-mono ${
              isOwner ? 'bg-primary/20 text-primary' : 'bg-secondary/20 text-secondary'
            }`}>
              {isOwner ? 'Owner' : 'Employee'}
            </span>
          </div>
          <button onClick={logout} className="p-1.5 text-muted-foreground hover:text-foreground transition-colors">
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
