import React, { useState } from 'react';
import { useOS } from '@/contexts/OSContext';
import { useAuth } from '@/contexts/AuthContext';
import OSCard from './OSCard';
import { Search } from 'lucide-react';

const FaturamentoTab: React.FC<{ onOpenOS: (id: string, mode?: string) => void }> = ({ onOpenOS }) => {
  const { ordens, loading } = useOS();
  const { isOwner } = useAuth();
  const [search, setSearch] = useState('');

  const filtered = ordens.filter(o => {
    if (!search) return true;
    const s = search.toLowerCase();
    return o.cod.toLowerCase().includes(s) || o.nome.toLowerCase().includes(s);
  });

  return (
    <div className="space-y-6">
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por código ou nome..."
          className="w-full bg-muted border border-border rounded pl-9 pr-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      {loading ? (
        <div className="text-center text-muted-foreground py-8">Carregando...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center text-muted-foreground py-8">Nenhuma OS encontrada</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map(os => (
            <OSCard key={os.id} os={os} showFinancials={isOwner} onClick={() => onOpenOS(os.id, 'faturamento')} billingMode />
          ))}
        </div>
      )}
    </div>
  );
};

export default FaturamentoTab;
