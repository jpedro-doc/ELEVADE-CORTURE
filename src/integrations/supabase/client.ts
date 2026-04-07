import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  throw new Error('Variáveis VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY não definidas no .env');
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
