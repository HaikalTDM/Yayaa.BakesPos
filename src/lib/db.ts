import { supabase, STORE_ID } from './supabase'
import type { Product, CartItem, PaymentMethod, EnhancedStats, Period, ModalEntry, CategoryBreakdown, Session, InventoryLog } from './types'

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

export async function restockProduct(
  productId: string,
  quantity: number,
): Promise<boolean> {
  try {
    const { error: stockError } = await supabase.rpc('add_stock', { p_product_id: productId, p_quantity: quantity })
    if (stockError) throw stockError
    await supabase.from('inventory_logs').insert({
      store_id: STORE_ID, product_id: productId, change_amount: quantity, reason: 'restock', sale_id: null,
    })
    return true
  } catch (err: any) {
    console.error('restockProduct failed:', err?.message || err)
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
      .select('id, total, payment_method')
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

    // Category breakdown — join sale_items with products to get real revenue per category
    const catMap = new Map<string, number>()
    for (const p of (products ?? [])) { catMap.set(p.category, 0) }

    if (sales.length > 0) {
      const saleIds = sales.map((s: any) => s.id)
      const { data: items } = await supabase
        .from('sale_items')
        .select('quantity, price_at_sale, products(category)')
        .in('sale_id', saleIds)

      if (items) {
        for (const item of items) {
          const cat = (item as any).products?.category ?? 'Uncategorized'
          const revenue = item.quantity * item.price_at_sale
          catMap.set(cat, (catMap.get(cat) ?? 0) + revenue)
        }
      }
    }

    // Find top product
    const productSales = new Map<string, number>()
    if (sales.length > 0) {
      const saleIds = sales.map((s: any) => s.id)
      const { data: items } = await supabase
        .from('sale_items')
        .select('quantity, product_id, products(name)')
        .in('sale_id', saleIds)

      if (items) {
        for (const item of items) {
          const name = (item as any).products?.name ?? '—'
          productSales.set(name, (productSales.get(name) ?? 0) + item.quantity)
        }
      }
    }
    const topProduct = productSales.size > 0
      ? [...productSales.entries()].sort((a, b) => b[1] - a[1])[0][0]
      : '—'

    const catTotal = [...catMap.values()].reduce((s, v) => s + v, 0)
    const categoryBreakdown = [...catMap.entries()].map(([category, amount]) => ({
      category,
      amount: round(amount),
      pct: catTotal > 0 ? round((amount / catTotal) * 100) : 0,
    }))

    return {
      grossSales, cashTotal: round(cashTotal), duitnowTotal: round(duitnowTotal),
      totalModal: modalTotal, netProfit: round(grossSales - modalTotal), saleCount,
      avgOrderValue: saleCount > 0 ? round(grossSales / saleCount) : 0,
      topProduct, cashPct, duitnowPct,
      categoryBreakdown,
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

// ==========================================
// SESSION MANAGEMENT
// ==========================================

export async function openSession(openingFloat: number): Promise<Session | null> {
  const { data, error } = await supabase
    .from('sessions')
    .insert({ store_id: STORE_ID, opening_float: openingFloat })
    .select()
    .single()

  if (error) { console.error('Failed to open session:', error); return null }
  return data as Session
}

export async function closeSession(
  sessionId: string,
  closingCashCounted: number,
  cashSalesExpected: number,
): Promise<boolean> {
  const discrepancy = round(closingCashCounted - cashSalesExpected)
  const { error } = await supabase
    .from('sessions')
    .update({
      closed_at: new Date().toISOString(),
      closing_cash_counted: closingCashCounted,
      cash_sales_expected: cashSalesExpected,
      discrepancy,
      status: 'closed',
    })
    .eq('id', sessionId)

  if (error) { console.error('Failed to close session:', error); return false }
  return true
}

export async function fetchCurrentSession(): Promise<Session | null> {
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('store_id', STORE_ID)
    .eq('status', 'open')
    .order('opened_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) { console.error('Failed to fetch current session:', error); return null }
  return data as Session | null
}

export async function fetchSessionHistory(limit = 20): Promise<Session[]> {
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('store_id', STORE_ID)
    .eq('status', 'closed')
    .order('opened_at', { ascending: false })
    .limit(limit)

  if (error) { console.error('Failed to fetch session history:', error); return [] }
  return data as Session[]
}

export async function fetchCashSalesToday(sessionOpenedAt: string): Promise<number> {
  const { data, error } = await supabase
    .from('sales')
    .select('total')
    .eq('store_id', STORE_ID)
    .eq('status', 'received')
    .eq('payment_method', 'cash')
    .gte('created_at', sessionOpenedAt)
    .lt('created_at', new Date().toISOString())

  if (error || !data) return 0
  return data.reduce((sum, s) => sum + (s.total as number), 0)
}

export async function fetchRecentRestocks(limit = 20): Promise<(InventoryLog & { product_name?: string })[]> {
  const { data, error } = await supabase
    .from('inventory_logs')
    .select('*, products(name)')
    .eq('store_id', STORE_ID)
    .eq('reason', 'restock')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) { console.error('Failed to fetch restocks:', error); return [] }
  return (data ?? []).map((r: any) => ({ ...r, product_name: r.products?.name ?? '—' }))
}

export async function fetchSaleHistory(period: Period): Promise<any[]> {
  const { start, end } = getPeriodRange(period)
  const { data, error } = await supabase
    .from('sales')
    .select('id, total, payment_method, created_at, sale_items(quantity, price_at_sale, products(name))')
    .eq('store_id', STORE_ID)
    .eq('status', 'received')
    .gte('created_at', start)
    .lt('created_at', end)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) { console.error('Failed to fetch sale history:', error); return [] }

  return (data ?? []).map((sale: any) => {
    const items = sale.sale_items ?? []
    const productNames = items.map((si: any) => si.products?.name ?? '—').join(', ')
    const totalQty = items.reduce((sum: number, si: any) => sum + si.quantity, 0)
    const time = sale.created_at
      ? new Date(sale.created_at).toLocaleTimeString('en-MY', { hour: '2-digit', minute: '2-digit', hour12: true })
      : '--:--'
    const date = sale.created_at
      ? new Date(sale.created_at).toLocaleDateString('en-MY', { month: 'short', day: 'numeric' })
      : '—'

    return {
      id: sale.id,
      date,
      time,
      products: productNames,
      qty: totalQty,
      total: sale.total,
      payment: sale.payment_method as string,
      created_at: sale.created_at,
    }
  })
}

export async function fetchSalesForExport(period: Period): Promise<any[]> {
  const { start, end } = getPeriodRange(period)
  const { data, error } = await supabase
    .from('sale_items')
    .select('quantity, price_at_sale, product_id, sale_id, products(name, category), sales(created_at, payment_method)')
    .eq('products.store_id', STORE_ID)
    .gte('sales.created_at', start)
    .lt('sales.created_at', end)
    .order('created_at', { foreignTable: 'sales', ascending: false })

  if (error) { console.error('Failed to fetch sales for export:', error); return [] }
  return (data ?? []).map((item: any) => ({
    date: item.sales?.created_at?.split('T')[0] ?? '—',
    product: item.products?.name ?? '—',
    category: item.products?.category ?? '—',
    quantity: item.quantity,
    revenue: item.price_at_sale * item.quantity,
    payment: item.sales?.payment_method ?? '—',
  }))
}
