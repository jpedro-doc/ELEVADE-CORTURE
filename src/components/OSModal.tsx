import React, { useState, useEffect, useCallback } from 'react';
import type { OrdemServico, CostItem, BillingItem } from '@/types/os';
import { calcTotal, PAYMENT_METHODS, syncFatFromCusto } from '@/types/os';
import { useOS } from '@/contexts/OSContext';
import { useAuth } from '@/contexts/AuthContext';
import { X, Plus, Trash2, Pencil } from 'lucide-react';
import DeleteConfirmModal from './DeleteConfirmModal';

interface Props {
  osId: string;
  initialMode: 'custos' | 'faturamento';
  onClose: () => void;
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = iso.length === 10 ? iso : iso.substring(0, 10);
  const [y, m, day] = d.split('-');
  return `${day}/${m}/${y}`;
}

const OSModal: React.FC<Props> = ({ osId, initialMode, onClose }) => {
  const { getOrdem, updateOrdem, removeOrdem } = useOS();
  const { isOwner } = useAuth();
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

  // ─── Custos helpers ───────────────────────────────────────────────────────
  const setCustoItems = (newItems: CostItem[]) => {
    const syncedFat = syncFatFromCusto(newItems, localOS.fat_items);
    save({ ...localOS, custo_items: newItems, fat_items: syncedFat });
  };

  const addCustoItem = () => {
    setCustoItems([...localOS.custo_items, { id: crypto.randomUUID(), desc: '', qty: 1, unit: 0 }]);
  };

  const updateCustoItem = (id: string, field: keyof CostItem, value: string | number) => {
    setCustoItems(localOS.custo_items.map(i => i.id === id ? { ...i, [field]: value } : i));
  };

  const removeCustoItem = (id: string) => {
    setCustoItems(localOS.custo_items.filter(i => i.id !== id));
  };

  // ─── Faturamento helpers ──────────────────────────────────────────────────
  const updateBillingValue = (id: string, value: number) => {
    const newFat = localOS.fat_items.map(f =>
      f.id === id ? { ...f, unit: value, billing_manually_edited: true } : f
    );
    save({ ...localOS, fat_items: newFat });
  };

  const billingTotal = calcTotal(localOS.fat_items);
  const borderColor = mode === 'custos' ? 'border-secondary' : 'border-primary';

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-background/80 backdrop-blur-sm overflow-y-auto py-8 px-4"
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        className={`bg-card border ${borderColor} border-t-2 rounded-lg w-full max-w-2xl animate-modal-in`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div>
            <span className="font-mono text-sm text-primary">{localOS.cod}</span>
            <h2 className="font-display font-bold text-lg">{localOS.nome}</h2>
            {localOS.service_date && (
              <p className="text-xs text-muted-foreground mt-0.5">
                Serviço: {formatDate(localOS.service_date)}
              </p>
            )}
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

        {/* Edit Info panel */}
        {editingInfo && (
          <div className="p-4 border-b border-border bg-muted/30 space-y-2">
            <div className="grid grid-cols-3 gap-2">
              <input
                value={localOS.cod}
                onChange={e => save({ ...localOS, cod: e.target.value.toUpperCase() })}
                className="bg-muted border border-border rounded px-2 py-1 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="Empresa"
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
            <div className="flex items-center gap-2">
              <label className="text-xs text-muted-foreground whitespace-nowrap">Data do Serviço:</label>
              <input
                type="date"
                value={localOS.service_date || ''}
                onChange={e => save({ ...localOS, service_date: e.target.value || null })}
                className="bg-muted border border-border rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>
        )}

        {/* ─── CUSTOS TAB ─── */}
        {mode === 'custos' && (
          <div className="p-4">
            <h3 className="text-sm font-semibold mb-3 text-muted-foreground">Itens de Custo</h3>
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
                  {localOS.custo_items.map(item => (
                    <tr key={item.id} className="border-b border-border/50">
                      <td className="py-1.5 pr-2">
                        <input
                          value={item.desc}
                          onChange={e => updateCustoItem(item.id, 'desc', e.target.value)}
                          className="w-full bg-transparent text-sm focus:outline-none focus:bg-muted/50 rounded px-1"
                          placeholder="Descrição do item"
                        />
                      </td>
                      <td className="py-1.5 px-2">
                        <input
                          type="number"
                          min={0}
                          value={item.qty}
                          onChange={e => updateCustoItem(item.id, 'qty', Number(e.target.value))}
                          className="w-full bg-transparent text-sm text-right font-mono focus:outline-none focus:bg-muted/50 rounded px-1"
                        />
                      </td>
                      <td className="py-1.5 px-2">
                        <input
                          type="number"
                          min={0}
                          step={0.01}
                          value={item.unit}
                          onChange={e => updateCustoItem(item.id, 'unit', Number(e.target.value))}
                          className="w-full bg-transparent text-sm text-right font-mono focus:outline-none focus:bg-muted/50 rounded px-1"
                        />
                      </td>
                      <td className="py-1.5 px-2 text-right font-mono text-sm">
                        R$ {(item.qty * item.unit).toFixed(2)}
                      </td>
                      <td className="py-1.5">
                        <button onClick={() => removeCustoItem(item.id)} className="p-0.5 text-muted-foreground hover:text-destructive">
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between mt-3">
              <button onClick={addCustoItem} className="flex items-center gap-1 text-xs text-primary hover:opacity-80">
                <Plus size={14} /> Adicionar Item
              </button>
              <span className="font-mono text-sm font-semibold">
                Total: R$ {calcTotal(localOS.custo_items).toFixed(2)}
              </span>
            </div>
          </div>
        )}

        {/* ─── FATURAMENTO TAB ─── */}
        {mode === 'faturamento' && (
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-muted-foreground">Itens de Faturamento</h3>
            </div>

            {localOS.fat_items.length === 0 ? (
              <p className="text-xs text-muted-foreground py-4 text-center">
                Adicione itens na aba Custos para que apareçam aqui automaticamente.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-muted-foreground border-b border-border">
                      <th className="text-left pb-2 pr-2">Produto</th>
                      <th className="text-right pb-2 px-2 w-14">Qtd</th>
                      <th className="text-right pb-2 px-2 w-28">Val. Faturamento</th>
                      <th className="text-right pb-2 pl-2 w-24">Total Fat.</th>
                      {isOwner && <th className="text-right pb-2 pl-2 w-24">Lucro</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {localOS.fat_items.map((item: BillingItem) => {
                      const costRef = item.cost_unit ?? 0;
                      const lucroItem = (item.unit - costRef) * item.qty;
                      return (
                        <tr key={item.id} className="border-b border-border/50">
                          {/* Produto */}
                          <td className="py-1.5 pr-2 text-sm">
                            {item.desc || <span className="text-muted-foreground italic">sem descrição</span>}
                          </td>
                          {/* Qtd — sempre igual ao custo, somente leitura */}
                          <td className="py-1.5 px-2 text-right font-mono text-sm text-muted-foreground">
                            {item.qty}
                          </td>
                          {/* Val. Faturamento — editável só no modo edição */}
                          <td className="py-1.5 px-2">
                            {editingInfo ? (
                              <input
                                type="number"
                                min={0}
                                step={0.01}
                                value={item.unit}
                                onChange={e => updateBillingValue(item.id, Number(e.target.value))}
                                className="w-full bg-muted/50 border border-border/60 text-sm text-right font-mono rounded px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-primary"
                              />
                            ) : (
                              <span className="font-mono text-sm text-right block">
                                R$ {item.unit.toFixed(2)}
                              </span>
                            )}
                          </td>
                          {/* Total */}
                          <td className="py-1.5 pl-2 text-right font-mono text-sm text-primary">
                            R$ {(item.qty * item.unit).toFixed(2)}
                          </td>
                          {/* Lucro — só dono */}
                          {isOwner && (
                            <td className={`py-1.5 pl-2 text-right font-mono text-sm ${lucroItem >= 0 ? 'text-success' : 'text-destructive'}`}>
                              R$ {lucroItem.toFixed(2)}
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Totais */}
            {localOS.fat_items.length > 0 && (
              <div className="flex justify-end gap-6 mt-3 pt-3 border-t border-border">
                <div className="text-right">
                  <span className="text-xs text-muted-foreground block mb-0.5">Total Faturado</span>
                  <span className="font-mono text-base font-bold text-primary">
                    R$ {billingTotal.toFixed(2)}
                  </span>
                </div>
                {isOwner && (
                  <div className="text-right">
                    <span className="text-xs text-muted-foreground block mb-0.5">Lucro</span>
                    <span className={`font-mono text-base font-bold ${(billingTotal - calcTotal(localOS.custo_items)) >= 0 ? 'text-success' : 'text-destructive'}`}>
                      R$ {(billingTotal - calcTotal(localOS.custo_items)).toFixed(2)}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Forma de pagamento */}
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
          </div>
        )}

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
                onClick={() => save({ ...localOS, status: 'finalizado' })}
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
