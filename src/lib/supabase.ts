import { createClient } from '@supabase/supabase-js';

// Using the provided Supabase credentials as fallbacks to ensure the client initializes correctly.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://gejwaqycddushksbhpit.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY || 'sb_publishable_EXLfMXT0C6cIHq6Fus59Jw_NarwuOnq';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
