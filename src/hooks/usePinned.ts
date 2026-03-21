import { useState, useCallback } from 'react';

function load(key: string): string[] {
  try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch { return []; }
}
function persist(key: string, items: string[]) {
  localStorage.setItem(key, JSON.stringify(items));
}

export function usePinned(storageKey: string) {
  const [pinned, setPinned] = useState<string[]>(() => load(storageKey));

  const toggle = useCallback((value: string) => {
    setPinned(prev => {
      const next = prev.includes(value)
        ? prev.filter(v => v !== value)
        : [...prev, value];
      persist(storageKey, next);
      return next;
    });
  }, [storageKey]);

  const isPinned = useCallback((value: string) => pinned.includes(value), [pinned]);

  return { pinned, toggle, isPinned };
}
