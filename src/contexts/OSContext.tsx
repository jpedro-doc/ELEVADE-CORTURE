import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import type { OrdemServico } from '@/types/os';
import { fetchOrdens, upsertOrdem, createOrdem, deleteOrdem } from '@/services/osService';
import { toast } from '@/hooks/use-toast';

interface OSContextType {
  ordens: OrdemServico[];
  loading: boolean;
  addOrdem: (cod: string, nome: string, tel: string) => Promise<void>;
  updateOrdem: (os: OrdemServico) => void;
  removeOrdem: (id: string) => Promise<void>;
  getOrdem: (id: string) => OrdemServico | undefined;
}

const OSContext = createContext<OSContextType | null>(null);

export const OSProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [ordens, setOrdens] = useState<OrdemServico[]>([]);
  const [loading, setLoading] = useState(true);
  const saveTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  useEffect(() => {
    fetchOrdens()
      .then(setOrdens)
      .catch(() => toast({ title: 'Erro ao carregar OS', variant: 'destructive' }))
      .finally(() => setLoading(false));
  }, []);

  const addOrdem = useCallback(async (cod: string, nome: string, tel: string) => {
    const os = await createOrdem(cod, nome, tel);
    setOrdens(prev => [os, ...prev]);
    toast({ title: 'OS criada com sucesso', className: 'bg-success text-success-foreground' });
  }, []);

  const updateOrdem = useCallback((os: OrdemServico) => {
    setOrdens(prev => prev.map(o => o.id === os.id ? os : o));
    if (saveTimers.current[os.id]) clearTimeout(saveTimers.current[os.id]);
    saveTimers.current[os.id] = setTimeout(async () => {
      try {
        await upsertOrdem(os);
      } catch {
        toast({ title: 'Erro ao salvar', variant: 'destructive' });
      }
    }, 500);
  }, []);

  const removeOrdem = useCallback(async (id: string) => {
    await deleteOrdem(id);
    setOrdens(prev => prev.filter(o => o.id !== id));
    toast({ title: 'OS apagada', className: 'bg-success text-success-foreground' });
  }, []);

  const getOrdem = useCallback((id: string) => ordens.find(o => o.id === id), [ordens]);

  return (
    <OSContext.Provider value={{ ordens, loading, addOrdem, updateOrdem, removeOrdem, getOrdem }}>
      {children}
    </OSContext.Provider>
  );
};

export const useOS = () => {
  const ctx = useContext(OSContext);
  if (!ctx) throw new Error('useOS must be used within OSProvider');
  return ctx;
};
