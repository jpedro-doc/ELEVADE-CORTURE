import React, { useState, useEffect, useCallback } from 'react';
import type { OrdemServico, CostItem } from '@/types/os';
import { calcTotal } from '@/types/os';
import { PAYMENT_METHODS } from '@/types/os';
import { useOS } from '@/contexts/OSContext';
import { X, Plus, Trash2, Pencil } from 'lucide-react';
import DeleteConfirmModal from './DeleteConfirmModal';

interface Props {
  osId: string;
  initialMode: 'custos' | 'faturamento';
  onClose: () => void;
}

const OSModal: React.FC<Props> = ({ osId, initialMode, onClose }) => {
  const { getOrdem, updateOrdem, removeOrdem } = useOS();
  const os = getOrdem(osId);
  const [mode, setMode] = useState<'custos' | 'faturamento'>(initialMode);
  const [editingInfo, setEditingInfo] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [localOS, setLocalOS] = useState<OrdemServico | null>(null);

  useEffect(() => {
    if (os) setLocalOS({ ...os });
  }, [os?.id]);

  const save = useCallback((updated: OrdemServico) => {
    setLocalOS(updated);
    updateOrdem(updated);
  }, [updateOrdem]);

  if (!localOS) return null;

  const items = mode === 'custos' ? localOS.custo_items : localOS.fat_items;
  const setItems = (newItems: CostItem[]) => {
    const updated = { ...localOS, [mode === 'custos' ? 'custo_items' : 'fat_items']: newItems };
    save(updated);
  };

  const addItem = () => {
    setItems([...items, { id: crypto.randomUUID(), desc: '', qty: 1, unit: 0 }]);
  };

  const updateItem = (id: string, field: keyof CostItem, value: string | number) => {
    setItems(items.map(i => i.id === id ? { ...i, [field]: value } : i));
  };

  const removeItem = (id: string) => {
    setItems(items.filter(i => i.id !== id));
  };

  const finalize = () => {
    save({ ...localOS, status: 'finalizado' });
  };

  const borderColor = mode === 'custos' ? 'border-secondary' : 'border-primary';

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-background/80 backdrop-blur-sm overflow-y-auto py-8 px-4" onClick={onClose}>
      <div onClick={e => e.stopPropagation()} className={`bg-card border ${borderColor} border-t-2 rounded-lg w-full max-w-2xl animate-modal-in`}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div>
            <span className="font-mono text-sm text-primary">{localOS.cod}</span>
            <h2 className="font-display font-bold text-lg">{localOS.nome}</h2>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex gap-1">
              <button
                onClick={() => setMode('custos')}
                className={`px-3 py-1 text-xs rounded font-semibold transition-colors ${
                  mode === 'custos' ? 'bg-secondary text-secondary-foreground' : 'bg-muted text-muted-foreground'
                }`}
              >
                Custos
              </button>
              <button
                onClick={() => setMode('faturamento')}
                className={`px-3 py-1 text-xs rounded font-semibold transition-colors ${
                  mode === 'faturamento' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                }`}
              >
                Faturamento
              </button>
            </div>
            <button onClick={onClose} className="p-1 text-muted-foreground hover:text-foreground">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Edit Info */}
        {editingInfo && (
          <div className="p-4 border-b border-border bg-muted/30 space-y-2">
            <div className="grid grid-cols-3 gap-2">
              <input
                value={localOS.cod}
                onChange={e => save({ ...localOS, cod: e.target.value.toUpperCase() })}
                className="bg-muted border border-border rounded px-2 py-1 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="Código"
              />
              <input
                value={localOS.nome}
                onChange={e => save({ ...localOS, nome: e.target.value })}
                className="bg-muted border border-border rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="Nome"
              />
              <input
                value={localOS.tel || ''}
                onChange={e => save({ ...localOS, tel: e.target.value })}
                className="bg-muted border border-border rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="Telefone"
              />
            </div>
          </div>
        )}

        {/* Items table */}
        <div className="p-4">
          <h3 className="text-sm font-semibold mb-3 text-muted-foreground">
            {mode === 'custos' ? 'Itens de Custo' : 'Itens de Faturamento'}
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-muted-foreground border-b border-border">
                  <th className="text-left pb-2 pr-2">Descrição</th>
                  <th className="text-right pb-2 px-2 w-20">Qtd</th>
                  <th className="text-right pb-2 px-2 w-28">Valor Unit.</th>
                  <th className="text-right pb-2 px-2 w-28">Total</th>
                  <th className="w-8"></th>
                </tr>
              </thead>
              <tbody>
                {items.map(item => (
                  <tr key={item.id} className="border-b border-border/50">
                    <td className="py-1.5 pr-2">
                      <input
                        value={item.desc}
                        onChange={e => updateItem(item.id, 'desc', e.target.value)}
                        className="w-full bg-transparent text-sm focus:outline-none focus:bg-muted/50 rounded px-1"
                        placeholder="Descrição do item"
                      />
                    </td>
                    <td className="py-1.5 px-2">
                      <input
                        type="number"
                        min={0}
                        value={item.qty}
                        onChange={e => updateItem(item.id, 'qty', Number(e.target.value))}
                        className="w-full bg-transparent text-sm text-right font-mono focus:outline-none focus:bg-muted/50 rounded px-1"
                      />
                    </td>
                    <td className="py-1.5 px-2">
                      <input
                        type="number"
                        min={0}
                        step={0.01}
                        value={item.unit}
                        onChange={e => updateItem(item.id, 'unit', Number(e.target.value))}
                        className="w-full bg-transparent text-sm text-right font-mono focus:outline-none focus:bg-muted/50 rounded px-1"
                      />
                    </td>
                    <td className="py-1.5 px-2 text-right font-mono text-sm">
                      R$ {(item.qty * item.unit).toFixed(2)}
                    </td>
                    <td className="py-1.5">
                      <button onClick={() => removeItem(item.id)} className="p-0.5 text-muted-foreground hover:text-destructive">
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between mt-3">
            <button onClick={addItem} className="flex items-center gap-1 text-xs text-primary hover:opacity-80">
              <Plus size={14} /> Adicionar Item
            </button>
            <span className="font-mono text-sm font-semibold">
              Total: R$ {calcTotal(items).toFixed(2)}
            </span>
          </div>

          {/* Payment method (only in billing mode) */}
          {mode === 'faturamento' && (
            <div className="mt-4 pt-4 border-t border-border">
              <label className="text-xs text-muted-foreground block mb-1">Forma de Pagamento</label>
              <select
                value={localOS.pgto}
                onChange={e => save({ ...localOS, pgto: e.target.value })}
                className="bg-muted border border-border rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">Selecionar...</option>
                {PAYMENT_METHODS.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-border">
          <div className="flex gap-2">
            <button
              onClick={() => setEditingInfo(!editingInfo)}
              className="flex items-center gap-1 px-3 py-1.5 text-xs bg-muted text-foreground rounded hover:bg-muted/80 transition-colors"
            >
              <Pencil size={12} /> Editar Info
            </button>
            <button
              onClick={() => setShowDelete(true)}
              className="flex items-center gap-1 px-3 py-1.5 text-xs bg-destructive/10 text-destructive rounded hover:bg-destructive/20 transition-colors"
            >
              <Trash2 size={12} /> Apagar OS
            </button>
          </div>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-1.5 text-xs bg-muted text-foreground rounded hover:bg-muted/80 transition-colors">
              Fechar
            </button>
            {localOS.status === 'aberto' && (
              <button
                onClick={finalize}
                className="px-4 py-1.5 text-xs bg-success text-success-foreground rounded font-semibold hover:opacity-90 transition-opacity"
              >
                ✓ Finalizar OS
              </button>
            )}
          </div>
        </div>
      </div>

      {showDelete && (
        <DeleteConfirmModal
          title={`Apagar OS ${localOS.cod}?`}
          onConfirm={async () => { await removeOrdem(localOS.id); onClose(); }}
          onCancel={() => setShowDelete(false)}
        />
      )}
    </div>
  );
};

export default OSModal;
