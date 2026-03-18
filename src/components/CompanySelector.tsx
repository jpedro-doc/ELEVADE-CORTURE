import React, { useMemo } from 'react';
import { useCompany } from '@/contexts/CompanyContext';
import { useOS } from '@/contexts/OSContext';
import { Building2 } from 'lucide-react';

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

  const companies = useMemo(() => {
    const seen = new Set<string>();
    const list: string[] = [];
    for (const o of ordens) {
      if (o.cod && !seen.has(o.cod)) {
        seen.add(o.cod);
        list.push(o.cod);
      }
    }
    return list.sort();
  }, [ordens]);

  if (companies.length === 0) return null;

  return (
    <div className="border-b border-border bg-background/60 backdrop-blur-sm">
      <div className="container">
        <div
          className="flex items-end gap-1 overflow-x-auto py-2 px-1"
          style={{ scrollbarWidth: 'none' }}
        >
          {/* Todas */}
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

          {companies.map(cod => (
            <button
              key={cod}
              onClick={() => setSelectedCod(selectedCod === cod ? null : cod)}
              className={`flex-shrink-0 flex flex-col items-center gap-1 rounded-lg px-2 py-1 transition-all ${
                selectedCod === cod
                  ? 'ring-2 ring-primary ring-offset-1 ring-offset-background bg-primary/10'
                  : 'hover:bg-muted'
              }`}
            >
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-xs text-white shadow-sm"
                style={{ backgroundColor: codToColor(cod) }}
              >
                {codInitials(cod)}
              </div>
              <span className="text-xs whitespace-nowrap max-w-[64px] truncate" title={cod}>{cod}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CompanySelector;
