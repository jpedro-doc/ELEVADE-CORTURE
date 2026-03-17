import React from 'react';
import { Trash2 } from 'lucide-react';
import type { OrdemServico } from '@/types/os';
import { calcTotal, calcLucro } from '@/types/os';
import { useOS } from '@/contexts/OSContext';
import { useState } from 'react';
import DeleteConfirmModal from './DeleteConfirmModal';

interface Props {
  os: OrdemServico;
  showFinancials: boolean;
  onClick: () => void;
  billingMode?: boolean;
}

const OSCard: React.FC<Props> = ({ os, showFinancials, onClick, billingMode }) => {
  const { removeOrdem } = useOS();
  const [showDelete, setShowDelete] = useState(false);

  const custo = calcTotal(os.custo_items);
  const faturado = calcTotal(os.fat_items);
  const lucro = calcLucro(os);
  const hasBilling = faturado > 0;

  return (
    <>
      <div
        onClick={onClick}
        className="bg-card border border-border rounded-lg p-4 cursor-pointer hover:border-primary/40 transition-colors group"
      >
        <div className="flex items-start justify-between mb-2">
          <div>
            <span className="font-mono text-sm text-primary">{os.cod}</span>
            <h3 className="text-sm font-semibold text-foreground mt-0.5">{os.nome}</h3>
          </div>
          <div className="flex items-center gap-2">
            {billingMode ? (
              <span className={`text-xs px-2 py-0.5 rounded font-semibold ${
                hasBilling ? 'bg-success/20 text-success' : 'bg-secondary/20 text-secondary'
              }`}>
                {hasBilling ? 'Faturado' : 'Pendente'}
              </span>
            ) : (
              <span className={`text-xs px-2 py-0.5 rounded font-semibold ${
                os.status === 'finalizado' ? 'bg-success/20 text-success' : 'bg-primary/20 text-primary'
              }`}>
                {os.status === 'finalizado' ? 'Finalizado' : 'Em aberto'}
              </span>
            )}
            {!billingMode && (
              <button
                onClick={e => { e.stopPropagation(); setShowDelete(true); }}
                className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-destructive transition-all"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        </div>
        {os.tel && <p className="text-xs text-muted-foreground mb-1">📞 {os.tel}</p>}
        <p className="text-xs text-muted-foreground">
          {new Date(os.data).toLocaleDateString('pt-BR')}
        </p>
        {showFinancials && (
          <div className="mt-3 pt-3 border-t border-border grid grid-cols-3 gap-2 text-xs">
            <div>
              <span className="text-muted-foreground">Custo</span>
              <p className="font-mono text-secondary">R$ {custo.toFixed(2)}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Faturado</span>
              <p className="font-mono text-primary">R$ {faturado.toFixed(2)}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Lucro</span>
              <p className={`font-mono ${lucro >= 0 ? 'text-success' : 'text-destructive'}`}>
                R$ {lucro.toFixed(2)}
              </p>
            </div>
          </div>
        )}
      </div>
      {showDelete && (
        <DeleteConfirmModal
          title={`Apagar OS ${os.cod}?`}
          onConfirm={async () => { await removeOrdem(os.id); setShowDelete(false); }}
          onCancel={() => setShowDelete(false)}
        />
      )}
    </>
  );
};

export default OSCard;
