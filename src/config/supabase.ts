import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = (): boolean => {
  return Boolean(
    supabaseUrl &&
    supabaseKey &&
    supabaseUrl.startsWith('http') &&
    !supabaseUrl.includes('your-project-id') &&
    !supabaseKey.includes('your-supabase')
  );
};

let client: SupabaseClient | null = null;

if (isSupabaseConfigured()) {
  try {
    client = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
    console.log('✅ Supabase client initialized successfully connecting to:', supabaseUrl);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('⚠️ Failed to initialize Supabase client:', msg);
  }
} else {
  console.log('ℹ️ Supabase credentials not yet configured. Operating in resilient storage mode.');
}

export const supabase = client;
