import { createClient } from '@supabase/supabase-js';

// These variables should be defined in your environment variables (e.g., .env.local)
// We provide fallbacks here to prevent the 'createClient' function from throwing 
// a "supabaseUrl is required" error during the initial build or if keys are missing.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://your-project-id.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
