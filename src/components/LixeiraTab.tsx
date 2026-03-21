import React from 'react';
import { useOS } from '@/contexts/OSContext';
import { calcTotal } from '@/types/os';
import { RotateCcw, Trash2 } from 'lucide-react';

const LixeiraTab: React.FC = () => {
  const { deletedOrdens, restoreOrdem, purgueOrdem } = useOS();

  if (deletedOrdens.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-16">
        Nenhuma OS apagada
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        {deletedOrdens.length} OS apagada{deletedOrdens.length > 1 ? 's' : ''} — salvas localmente neste dispositivo
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {deletedOrdens.map(os => {
          const faturado = calcTotal(os.fat_items);
          return (
            <div key={os.id} className="bg-card border border-border rounded-lg p-4 opacity-70">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <span className="font-mono text-sm text-primary">{os.cod}</span>
                  <h3 className="text-sm font-semibold text-foreground mt-0.5">{os.nome}</h3>
                </div>
                <span className="text-xs px-2 py-0.5 rounded bg-destructive/20 text-destructive font-semibold">
                  Apagada
                </span>
              </div>
              {os.tel && <p className="text-xs text-muted-foreground mb-1">📞 {os.tel}</p>}
              <p className="text-xs text-muted-foreground">
                {new Date(os.data).toLocaleDateString('pt-BR')}
              </p>
              {faturado > 0 && (
                <p className="text-xs font-mono text-primary mt-1">R$ {faturado.toFixed(2)}</p>
              )}
              <div className="flex gap-2 mt-3 pt-3 border-t border-border">
                <button
                  onClick={() => restoreOrdem(os.id)}
                  className="flex items-center gap-1 text-xs bg-primary/10 text-primary px-3 py-1.5 rounded hover:bg-primary/20 transition-colors"
                >
                  <RotateCcw size={12} /> Restaurar
                </button>
                <button
                  onClick={() => purgueOrdem(os.id)}
                  className="flex items-center gap-1 text-xs bg-destructive/10 text-destructive px-3 py-1.5 rounded hover:bg-destructive/20 transition-colors"
                >
                  <Trash2 size={12} /> Apagar definitivo
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default LixeiraTab;
