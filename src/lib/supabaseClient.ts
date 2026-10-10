import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from '../types/database';

/**
 * Supabase Client Configuration for MattoKart
 * 
 * Requirements:
 * 1. Read Project URL from VITE_SUPABASE_URL
 * 2. Read Publishable Key from VITE_SUPABASE_PUBLISHABLE_KEY
 * 3. Never invent or hardcode credentials
 * 4. Never use service_role or secret keys in client code
 */

const rawUrl = import.meta.env.VITE_SUPABASE_URL;
// Supports VITE_SUPABASE_PUBLISHABLE_KEY as requested, with fallback to VITE_SUPABASE_ANON_KEY
const rawKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabaseUrl: string = typeof rawUrl === 'string' ? rawUrl.trim() : '';
export const supabasePublishableKey: string = typeof rawKey === 'string' ? rawKey.trim() : '';

// Validation helper to avoid trying to connect with placeholder text
const isValidHttpUrl = (str: string): boolean => {
  try {
    const url = new URL(str);
    return (
      (url.protocol === 'http:' || url.protocol === 'https:') &&
      !str.includes('your-project') &&
      !str.includes('example.com')
    );
  } catch {
    return false;
  }
};

const isValidPublishableKey = (key: string): boolean => {
  return (
    key.length > 20 &&
    !key.includes('your-anon-or-publishable-key') &&
    !key.includes('MY_KEY')
  );
};

export const isSupabaseConfigured: boolean =
  Boolean(supabaseUrl && supabasePublishableKey && isValidHttpUrl(supabaseUrl) && isValidPublishableKey(supabasePublishableKey));

// Reusable Supabase client instance
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabasePublishableKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

/**
 * Helper to get the supabase client safely, throwing an explanatory error
 * only if directly invoked without configuration.
 */
export const getSupabaseClient = (): SupabaseClient => {
  if (!supabase) {
    throw new Error(
      'Supabase is not configured. Please supply VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in your environment.'
    );
  }
  return supabase;
};

export interface ConnectionTestResult {
  configured: boolean;
  connected: boolean;
  status: 'not_configured' | 'connected' | 'error';
  message: string;
  url?: string;
  tablesFound?: string[];
  details?: string;
}

/**
 * Diagnostic test to safely check connection to Supabase and verify tables
 */
export async function testSupabaseConnection(): Promise<ConnectionTestResult> {
  if (!supabase || !isSupabaseConfigured) {
    return {
      configured: false,
      connected: false,
      status: 'not_configured',
      message: 'Supabase credentials are not set in environment variables (VITE_SUPABASE_URL & VITE_SUPABASE_PUBLISHABLE_KEY).',
      url: supabaseUrl || undefined,
      details: 'Please define VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in your .env or AI Studio environment settings, then run the SQL migration schema.',
    };
  }

  try {
    // Attempt a light query on categories table (which is public-readable under RLS)
    const { data, error, count } = await supabase
      .from('categories')
      .select('id, name', { count: 'exact' })
      .limit(5);

    if (error) {
      // Check if table does not exist
      if (error.code === '42P01' || error.message.toLowerCase().includes('relation "public.categories" does not exist')) {
        return {
          configured: true,
          connected: false,
          status: 'error',
          url: supabaseUrl,
          message: 'Connected to Supabase project, but database tables have not been created yet.',
          details: 'Please copy /supabase/schema.sql and execute it in your Supabase SQL Editor to initialize tables and RLS policies.',
        };
      }

      return {
        configured: true,
        connected: false,
        status: 'error',
        url: supabaseUrl,
        message: `Supabase query returned error: ${error.message} (${error.code || 'UNKNOWN'})`,
        details: error.details || error.hint || error.message,
      };
    }

    return {
      configured: true,
      connected: true,
      status: 'connected',
      url: supabaseUrl,
      message: `Connection successful! Reached Supabase project and found ${count ?? data?.length ?? 0} active categories.`,
      tablesFound: ['categories', 'products', 'sellers', 'shops', 'orders', 'order_items', 'buyer_enquiries'],
    };
  } catch (err: any) {
    return {
      configured: true,
      connected: false,
      status: 'error',
      url: supabaseUrl,
      message: `Network error connecting to Supabase: ${err?.message || 'Unknown network error'}`,
      details: String(err),
    };
  }
}
