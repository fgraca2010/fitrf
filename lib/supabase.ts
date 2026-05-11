import { createBrowserClient } from '@supabase/ssr'

// Falls back to placeholder values during build-time pre-rendering;
// actual calls happen in useEffect on the client where real values are present.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'placeholder'
  )
}
