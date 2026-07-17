import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

let client: SupabaseClient | null = null
if (isSupabaseConfigured) {
  client = createClient(supabaseUrl!, supabaseAnonKey!)
}

/**
 * Supabase client. Null when VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY are
 * missing — the app shows a setup screen instead of crashing in that case.
 */
export const supabase = client
