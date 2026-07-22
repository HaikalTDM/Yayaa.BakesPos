import { supabase, STORE_ID } from './supabase'

const IS_MOCK = !process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL.includes('your-project')

export async function hashPin(pin: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(`yayaa:${pin}`)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}

export async function fetchPinHash(): Promise<string | null> {
  if (IS_MOCK) return null
  const { data, error } = await supabase.rpc('get_store_pin')
  if (error) {
    console.error('Failed to fetch PIN hash:', error.message)
    return null
  }
  return data as string | null
}

export async function savePinHash(hash: string): Promise<boolean> {
  if (IS_MOCK) return true
  const { error } = await supabase.rpc('set_store_pin', { p_hash: hash })
  if (error) {
    console.error('Failed to save PIN hash:', error.message)
    return false
  }
  return true
}

export async function clearRemotePin(): Promise<boolean> {
  if (IS_MOCK) return true
  const { error } = await supabase.rpc('clear_store_pin')
  if (error) {
    console.error('Failed to clear PIN hash:', error.message)
    return false
  }
  return true
}
