import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: false },
  db: {
    schema: 'public',
  },
})

export const STORE_ID = process.env.NEXT_PUBLIC_STORE_ID ?? '00000000-0000-0000-0000-000000000001'

const IS_MOCK = !supabaseUrl || supabaseUrl.includes('your-project')

export async function initStoreContext(): Promise<void> {
  if (IS_MOCK) return
  const { error } = await supabase.rpc('set_store_id', { p_store_id: STORE_ID })
  if (error) {
    console.error('Failed to set store context for RLS:', error.message)
  }
}
