import { supabase, STORE_ID } from './supabase'
import type { Product, CartItem, PaymentMethod, EnhancedStats, Period, ModalEntry, CategoryBreakdown } from './types'

export async function fetchProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('store_id', STORE_ID)
    .order('name')

  if (error) {
    console.error('Failed to fetch products:', error)
    return []
  }
  return data as Product[]
}

export async function createSale(
  items: CartItem[],
  paymentMethod: PaymentMethod,
): Promise<boolean> {
  const total = round(items.reduce((sum, i) => sum + i.price * i.quantity, 0))

  try {
    const { data: sale, error: saleError } = await supabase
      .from('sales')
      .insert({ store_id: STORE_ID, total, payment_method: paymentMethod, status: 'received' })
      .select('id')
      .single()

    if (saleError || !sale) throw saleError

    const saleId = sale.id
    const saleItems = items.map((item) => ({
      sale_id: saleId, product_id: item.product_id, quantity: item.quantity, price_at_sale: item.price,
    }))

    const { error: itemsError } = await supabase.from('sale_items').insert(saleItems)
    if (itemsError) throw itemsError

    for (const item of items) {
      const { error: stockError } = await supabase.rpc('deduct_stock', { p_product_id: item.product_id, p_quantity: item.quantity })
      if (stockError) throw stockError
      await supabase.from('inventory_logs').insert({
        store_id: STORE_ID, product_id: item.product_id, change_amount: -item.quantity, reason: 'sale', sale_id: saleId,
      })
    }
    return true
  } catch (err: any) {
    console.error('createSale failed:', err?.message || err)
    return false
  }
}

export async function logWasteOrFreebie(
  productId: string,
  reason: 'wasted' | 'freebie',
): Promise<boolean> {
  try {
    const { error: stockError } = await supabase.rpc('deduct_stock', { p_product_id: productId, p_quantity: 1 })
    if (stockError) throw stockError
    await supabase.from('inventory_logs').insert({
      store_id: STORE_ID, product_id: productId, change_amount: -1, reason, sale_id: null,
    })
    return true
  } catch (err: any) {
    console.error('logWasteOrFreebie failed:', err?.message || err)
    return false
  }
}

export async function fetchStats(period: Period): Promise<EnhancedStats> {
  const { start, end } = getPeriodRange(period)
  const empty: EnhancedStats = {
    grossSales: 0, cashTotal: 0, duitnowTotal: 0, totalModal: 0, netProfit: 0, saleCount: 0,
    avgOrderValue: 0, topProduct: '—', cashPct: 0, duitnowPct: 0,
    categoryBreakdown: [], lowStockProducts: [],
  }

  try {
    const { data: sales, error: salesErr } = await supabase
      .from('sales')
      .select('total, payment_method')
      .eq('store_id', STORE_ID)
      .eq('status', 'received')
      .gte('created_at', start)
      .lt('created_at', end)

    if (salesErr || !sales) return empty

    let cashTotal = 0; let duitnowTotal = 0
    for (const s of sales) {
      if (s.payment_method === 'cash') cashTotal += s.total
      else duitnowTotal += s.total
    }

    const grossSales = round(cashTotal + duitnowTotal)
    const saleCount = sales.length

    const { data: modals } = await supabase
      .from('session_modals')
      .select('amount')
      .eq('store_id', STORE_ID)
      .gte('created_at', start)
      .lt('created_at', end)
    const modalTotal = round((modals ?? []).reduce((sum: number, m: { amount: number }) => sum + m.amount, 0))

    const cashPct = grossSales > 0 ? round((cashTotal / grossSales) * 100) : 0
    const duitnowPct = grossSales > 0 ? round((duitnowTotal / grossSales) * 100) : 0

    const { data: products } = await supabase.from('products').select('*').eq('store_id', STORE_ID)
    const lowStock = (products ?? []).filter((p: Product) => p.stock <= 3).map((p: Product) => ({ name: p.name, stock: p.stock }))

    const catMap = new Map<string, number>()
    for (const p of (products ?? [])) { catMap.set(p.category, 0) }
    const { data: topItems } = await supabase
      .from('sale_items')
      .select('product_id, quantity')
      .in('sale_id', sales.map((s: any) => s.id).length ? [] : [])
    // Note: accurate per-category breakdown requires joining sale_items with products
    // For simplicity, show categories with $0 until the sales query above is expanded

    return {
      grossSales, cashTotal: round(cashTotal), duitnowTotal: round(duitnowTotal),
      totalModal: modalTotal, netProfit: round(grossSales - modalTotal), saleCount,
      avgOrderValue: saleCount > 0 ? round(grossSales / saleCount) : 0,
      topProduct: '—', cashPct, duitnowPct,
      categoryBreakdown: Array.from(catMap.entries()).map(([c]) => ({ category: c, amount: 0, pct: 0 })),
      lowStockProducts: lowStock,
    }
  } catch (err: any) {
    console.error('fetchStats failed:', err?.message || err)
    return empty
  }
}

function getPeriodRange(period: Period): { start: string; end: string } {
  const now = new Date()
  if (period === 'daily') {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    return { start: start.toISOString(), end: new Date(start.getTime() + 86400000).toISOString() }
  }
  if (period === 'weekly') {
    const day = now.getDay()
    const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (day === 0 ? 6 : day - 1))
    const nextMonday = new Date(monday.getTime() + 7 * 86400000)
    return { start: monday.toISOString(), end: nextMonday.toISOString() }
  }
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 1)
  return { start: firstDay.toISOString(), end: lastDay.toISOString() }
}

function round(n: number): number {
  return Math.round(n * 100) / 100
}

export async function addProduct(name: string, price: number, stock: number, category: string, image_url?: string): Promise<Product | null> {
  const { data, error } = await supabase
    .from('products')
    .insert({ store_id: STORE_ID, name, price, stock, category, image_url: image_url ?? null })
    .select()
    .single()

  if (error) {
    console.error('Failed to add product:', error.message, error.details, error.hint)
    return null
  }
  return data as Product
}

export async function updateProduct(id: string, updates: { name?: string; price?: number; stock?: number; category?: string; image_url?: string | null }): Promise<boolean> {
  const { error } = await supabase
    .from('products')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) { console.error('Failed to update product:', error.message, error.details, error.hint); return false }
  return true
}

export async function deleteProduct(id: string): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Failed to delete product:', error.message, error.details, error.hint)
    return { ok: false, error: error.message }
  }
  return { ok: true }
}

export async function addModalEntry(amount: number, note: string): Promise<ModalEntry | null> {
  const { data, error } = await supabase
    .from('session_modals')
    .insert({ store_id: STORE_ID, amount, note })
    .select()
    .single()

  if (error) { console.error('Failed to add modal entry:', error); return null }
  return data as ModalEntry
}

export async function fetchModalEntries(): Promise<ModalEntry[]> {
  const { data, error } = await supabase
    .from('session_modals')
    .select('*')
    .eq('store_id', STORE_ID)
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) { console.error('Failed to fetch modal entries:', error); return [] }
  return data as ModalEntry[]
}

export async function clearAllStoreData(): Promise<void> {
  try {
    await supabase.from('inventory_logs').delete().eq('store_id', STORE_ID)
    await supabase.from('sales').delete().eq('store_id', STORE_ID)
    await supabase.from('session_modals').delete().eq('store_id', STORE_ID)
  } catch (err: any) {
    console.error('Failed to clear store data:', err?.message || err)
  }
}
