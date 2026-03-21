import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Normaliza para comparação case-insensitive e sem espaços extras */
export function normalizeKey(s: string): string {
  return s.trim().toLowerCase();
}

/** Deduplica uma lista de strings ignorando maiúsculas/minúsculas e espaços.
 *  Mantém a primeira ocorrência encontrada como representante do grupo. */
export function deduplicateCI(items: string[]): string[] {
  const seen = new Map<string, string>();
  for (const item of items) {
    const key = normalizeKey(item);
    if (!seen.has(key)) seen.set(key, item);
  }
  return Array.from(seen.values()).sort((a, b) => normalizeKey(a).localeCompare(normalizeKey(b)));
}
