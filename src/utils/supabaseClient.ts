import { createClient } from '@supabase/supabase-js'

const supabaseUrl = (import.meta.env as Record<string, string>)['VITE_SUPABASE_URL']!
const supabaseAnonKey = (import.meta.env as Record<string, string>)['VITE_SUPABASE_ANON_KEY']!

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  global: {
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    }
  }
})
