import { createClient } from '@supabase/supabase-js'

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL ?? '').trim()
const supabasePublishableKey = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? '').trim()

export const supabaseConfigError = !supabaseUrl || !supabasePublishableKey
  ? 'Reviews are not connected yet. Configure the Supabase environment variables to enable the feedback service.'
  : null

export const supabase = supabaseConfigError
  ? null
  : createClient(supabaseUrl, supabasePublishableKey)
