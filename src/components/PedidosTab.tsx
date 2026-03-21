import React, { useState } from 'react';
import { useOS } from '@/contexts/OSContext';
import { useAuth } from '@/contexts/AuthContext';
import { useCompany } from '@/contexts/CompanyContext';
import { usePinned } from '@/hooks/usePinned';
import { toast } from '@/hooks/use-toast';
import OSCard from './OSCard';
import { Search, Pin, PinOff } from 'lucide-react';
import { deduplicateCI, normalizeKey } from '@/lib/utils';

const PedidosTab: React.FC<{ onOpenOS: (id: string, mode?: string) => void }> = ({ onOpenOS }) => {
  const { ordens, loading, addOrdem } = useOS();
  const { isOwner } = useAuth();
  const { selectedCod } = useCompany();
  const [cod, setCod] = useState('');
  const [nome, setNome] = useState('');
  const [tel, setTel] = useState('');
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'aberto' | 'finalizado'>('all');
  const { pinned: pinnedServices, toggle: toggleService, isPinned: isServicePinned } = usePinned('gestao-pro-pinned-services');
  const [managingServicePins, setManagingServicePins] = useState(false);

  const allServices = deduplicateCI(ordens.map(o => o.nome));

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cod.trim() || !nome.trim()) {
      toast({ title: 'Preencha empresa e nome', variant: 'destructive' });
      return;
    }
    try {
      await addOrdem(cod.trim().toUpperCase(), nome.trim(), tel.trim());
      setCod(''); setNome(''); setTel('');
    } catch {
      toast({ title: 'Erro ao criar OS', variant: 'destructive' });
    }
  };

  const filtered = ordens.filter(o => {
    if (selectedCod && o.cod !== selectedCod) return false;
    if (filterStatus !== 'all' && o.status !== filterStatus) return false;
    if (search) {
      const s = normalizeKey(search);
      return normalizeKey(o.cod).includes(s) || normalizeKey(o.nome).includes(s);
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Create form */}
      <form onSubmit={handleCreate} className="bg-card border border-border rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display font-bold text-base">Nova Ordem de Serviço</h2>
          <button
            type="button"
            onClick={() => setManagingServicePins(p => !p)}
            className={`flex items-center gap-1 text-xs px-2 py-1 rounded transition-colors ${
              managingServicePins ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
          >
            <Pin size={11} /> {managingServicePins ? 'Concluir' : 'Fixar serviços'}
          </button>
        </div>
        <datalist id="empresas-list">
          {[...new Set(ordens.map(o => o.cod))].sort().map(c => (
            <option key={c} value={c} />
          ))}
        </datalist>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <input
            value={cod}
            onChange={e => setCod(e.target.value.toUpperCase())}
            placeholder="Empresa"
            list="empresas-list"
            className="bg-muted border border-border rounded px-3 py-2 text-sm font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <input
            value={nome}
            onChange={e => setNome(e.target.value)}
            placeholder="Nome do Serviço/Cliente"
            className="bg-muted border border-border rounded px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary sm:col-span-2"
          />
          <div className="flex gap-2">
            <input
              value={tel}
              onChange={e => setTel(e.target.value)}
              placeholder="Telefone (opc.)"
              className="bg-muted border border-border rounded px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary flex-1"
            />
            <button type="submit" className="bg-primary text-primary-foreground px-4 py-2 rounded font-semibold text-sm hover:opacity-90 transition-opacity whitespace-nowrap">
              Abrir OS
            </button>
          </div>
        </div>
      </form>

      {/* Serviços fixados */}
      {(pinnedServices.length > 0 || managingServicePins) && (
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs text-muted-foreground">Serviços fixados:</span>
          {(managingServicePins ? allServices : pinnedServices).map(s => (
            <div key={s} className="flex items-center gap-1">
              <button
                onClick={() => !managingServicePins && setNome(s)}
                className={`text-xs px-2 py-1 rounded border transition-colors ${
                  managingServicePins
                    ? isServicePinned(s) ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground opacity-60'
                    : 'border-border bg-muted hover:bg-muted/80 text-foreground'
                }`}
              >
                {s}
              </button>
              {managingServicePins && (
                <button
                  onClick={() => toggleService(s)}
                  className="text-muted-foreground hover:text-primary"
                  title={isServicePinned(s) ? 'Desafixar' : 'Fixar'}
                >
                  {isServicePinned(s) ? <PinOff size={12} /> : <Pin size={12} />}
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Search and filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por empresa ou nome..."
            className="w-full bg-muted border border-border rounded pl-9 pr-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <div className="flex gap-1">
          {(['all', 'aberto', 'finalizado'] as const).map(s => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-2 text-xs rounded transition-colors ${
                filterStatus === s ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              {s === 'all' ? 'Todos' : s === 'aberto' ? 'Em aberto' : 'Finalizados'}
            </button>
          ))}
        </div>
      </div>

      {/* OS List */}
      {loading ? (
        <div className="text-center text-muted-foreground py-8">Carregando...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center text-muted-foreground py-8">Nenhuma OS encontrada</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map(os => (
            <OSCard key={os.id} os={os} showFinancials={isOwner} onClick={() => onOpenOS(os.id, 'custos')} />
          ))}
        </div>
      )}
    </div>
  );
};

export default PedidosTab;
