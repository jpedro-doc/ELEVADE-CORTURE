import React, { useMemo, useState } from 'react';
import { useCompany } from '@/contexts/CompanyContext';
import { useOS } from '@/contexts/OSContext';
import { usePinned } from '@/hooks/usePinned';
import { Building2, Pin, PinOff } from 'lucide-react';
import { deduplicateCI } from '@/lib/utils';

const COLORS = [
  '#6366f1', '#f59e0b', '#10b981', '#ef4444',
  '#3b82f6', '#8b5cf6', '#ec4899', '#f97316',
];

function codToColor(cod: string): string {
  let hash = 0;
  for (let i = 0; i < cod.length; i++) {
    hash = cod.charCodeAt(i) + ((hash << 5) - hash);
  }
  return COLORS[Math.abs(hash) % COLORS.length];
}

function codInitials(cod: string): string {
  return cod.trim().slice(0, 3).toUpperCase();
}

const CompanySelector: React.FC = () => {
  const { selectedCod, setSelectedCod } = useCompany();
  const { ordens } = useOS();
  const { pinned, toggle, isPinned } = usePinned('gestao-pro-pinned-companies');
  const [managingPins, setManagingPins] = useState(false);

  const allCompanies = useMemo(() => {
    return deduplicateCI(ordens.map(o => o.cod).filter(Boolean));
  }, [ordens]);

  const displayed = managingPins
    ? allCompanies
    : pinned.length > 0
      ? allCompanies.filter(c => isPinned(c))
      : allCompanies;

  if (allCompanies.length === 0) return null;

  return (
    <div className="border-b border-border bg-background/60 backdrop-blur-sm">
      <div className="container">
        <div className="flex items-end gap-1 overflow-x-auto py-2 px-1" style={{ scrollbarWidth: 'none' }}>
          {/* Todas */}
          {!managingPins && (
            <button
              onClick={() => setSelectedCod(null)}
              className={`flex-shrink-0 flex flex-col items-center gap-1 rounded-lg px-2 py-1 transition-all ${
                !selectedCod ? 'ring-2 ring-primary ring-offset-1 ring-offset-background bg-primary/10' : 'hover:bg-muted'
              }`}
            >
              <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                <Building2 size={16} className="text-muted-foreground" />
              </div>
              <span className="text-xs text-muted-foreground whitespace-nowrap">Todas</span>
            </button>
          )}

          {displayed.map(cod => (
            <div key={cod} className="relative flex-shrink-0 group">
              <button
                onClick={() => !managingPins && setSelectedCod(selectedCod === cod ? null : cod)}
                className={`flex flex-col items-center gap-1 rounded-lg px-2 py-1 transition-all ${
                  managingPins
                    ? 'cursor-default'
                    : selectedCod === cod
                      ? 'ring-2 ring-primary ring-offset-1 ring-offset-background bg-primary/10'
                      : 'hover:bg-muted'
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-xs text-white shadow-sm transition-opacity ${managingPins && !isPinned(cod) ? 'opacity-40' : ''}`}
                  style={{ backgroundColor: codToColor(cod) }}
                >
                  {codInitials(cod)}
                </div>
                <span className="text-xs whitespace-nowrap max-w-[64px] truncate" title={cod}>{cod}</span>
              </button>
              {managingPins && (
                <button
                  onClick={() => toggle(cod)}
                  className={`absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center shadow transition-colors ${
                    isPinned(cod) ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-primary/20'
                  }`}
                  title={isPinned(cod) ? 'Desafixar' : 'Fixar'}
                >
                  {isPinned(cod) ? <Pin size={10} /> : <PinOff size={10} />}
                </button>
              )}
            </div>
          ))}

          {/* Botão gerenciar fixados */}
          <button
            onClick={() => setManagingPins(p => !p)}
            className={`flex-shrink-0 flex flex-col items-center gap-1 rounded-lg px-2 py-1 transition-all ml-1 ${
              managingPins ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
            title={managingPins ? 'Concluir' : 'Gerenciar fixados'}
          >
            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
              <Pin size={14} />
            </div>
            <span className="text-xs whitespace-nowrap">{managingPins ? 'Concluir' : 'Fixar'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default CompanySelector;
