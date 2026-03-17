import React from 'react';

interface Props {
  title: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const DeleteConfirmModal: React.FC<Props> = ({ title, onConfirm, onCancel }) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm" onClick={onCancel}>
      <div onClick={e => e.stopPropagation()} className="bg-card border border-border rounded-lg p-6 w-full max-w-sm animate-modal-in">
        <h3 className="font-display font-bold text-base mb-2">{title}</h3>
        <p className="text-sm text-muted-foreground mb-6">Esta ação não pode ser desfeita.</p>
        <div className="flex justify-end gap-3">
          <button onClick={onCancel} className="px-4 py-2 text-sm rounded bg-muted text-foreground hover:bg-muted/80 transition-colors">
            Cancelar
          </button>
          <button onClick={onConfirm} className="px-4 py-2 text-sm rounded bg-destructive text-destructive-foreground font-semibold hover:opacity-90 transition-opacity">
            Apagar
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmModal;
