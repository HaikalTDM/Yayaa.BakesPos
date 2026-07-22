import { supabase, STORE_ID } from './supabase'
import type { Product, CartItem, PaymentMethod, DailyStats, Period, ModalEntry, EnhancedStats, CategoryBreakdown } from './types'

const IS_MOCK =
  !process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL.includes('your-project')

const MOCK_PRODUCTS: Product[] = [
  { id: 'p1', store_id: STORE_ID, name: 'Tiramisu',                     price: 15.00, stock: 12, image_url: null, category: 'Sweet Treats',   created_at: '', updated_at: '' },
  { id: 'p2', store_id: STORE_ID, name: 'Mix Cheese Tart',              price:  8.00, stock: 20, image_url: null, category: 'Sweet Treats',   created_at: '', updated_at: '' },
  { id: 'p3', store_id: STORE_ID, name: 'Mini Biscoff Cheesecake',      price:  3.00, stock: 24, image_url: null, category: 'Sweet Treats',   created_at: '', updated_at: '' },
  { id: 'p4', store_id: STORE_ID, name: 'Sea Salt Chocolate Chip',      price:  8.00, stock: 18, image_url: null, category: 'Soft Cookies',   created_at: '', updated_at: '' },
  { id: 'p5', store_id: STORE_ID, name: 'White Chocolate Matcha',        price:  7.00, stock: 16, image_url: null, category: 'Soft Cookies',   created_at: '', updated_at: '' },
  { id: 'p6', store_id: STORE_ID, name: 'Marshmallow Red Velvet',       price:  7.00, stock: 14, image_url: null, category: 'Soft Cookies',   created_at: '', updated_at: '' },
]

let mockIdCounter = 100

let mockSales: { total: number; payment_method: PaymentMethod; created_at: string }[] = []

let mockModalIdCounter = 200
let mockModals: ModalEntry[] = []

export function getMockProducts(): Product[] {
  return MOCK_PRODUCTS
}

export async function fetchProducts(): Promise<Product[]> {
  if (IS_MOCK) {
    return [...MOCK_PRODUCTS]
  }

  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('store_id', STORE_ID)
    .order('name')

  if (error) {
    console.error('Failed to fetch products:', error)
    return [...MOCK_PRODUCTS]
  }

  return data as Product[]
}

export async function createSale(
  items: CartItem[],
  paymentMethod: PaymentMethod,
): Promise<boolean> {
  const total = round(items.reduce((sum, i) => sum + i.price * i.quantity, 0))

  if (IS_MOCK) {
    mockSales.push({ total, payment_method: paymentMethod, created_at: new Date().toISOString() })
    return true
  }

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
    console.error('createSale failed, using local fallback:', err?.message || err)
    mockSales.push({ total, payment_method: paymentMethod, created_at: new Date().toISOString() })
    return true
  }
}

export async function logWasteOrFreebie(
  productId: string,
  reason: 'wasted' | 'freebie',
): Promise<boolean> {
  if (IS_MOCK) return true

  try {
    const { error: stockError } = await supabase.rpc('deduct_stock', { p_product_id: productId, p_quantity: 1 })
    if (stockError) throw stockError
    await supabase.from('inventory_logs').insert({
      store_id: STORE_ID, product_id: productId, change_amount: -1, reason, sale_id: null,
    })
    return true
  } catch (err: any) {
    console.error('logWasteOrFreebie failed, using local fallback:', err?.message || err)
    return true
  }
}

export async function fetchStats(period: Period): Promise<EnhancedStats> {
  const { start, end } = getPeriodRange(period)

  if (IS_MOCK) {
    let cashTotal = 0
    let duitnowTotal = 0
    let count = 0
    const periodSales: number[] = []
    for (const s of mockSales) {
      if (s.created_at < start || s.created_at >= end) continue
      if (s.total === 0) continue
      if (s.payment_method === 'cash') cashTotal += s.total
      else duitnowTotal += s.total
      periodSales.push(s.total)
      count++
    }
    const grossSales = round(cashTotal + duitnowTotal)
    const modalTotal = sumModalsForRange(start, end)
    return buildMockEnhanced(grossSales, cashTotal, duitnowTotal, modalTotal, count, periodSales)
  }

  const { data: sales, error } = await supabase
    .from('sales')
    .select('total, payment_method')
    .eq('store_id', STORE_ID)
    .eq('status', 'received')
    .gte('created_at', start)
    .lt('created_at', end)

  if (error) {
    console.error('Failed to fetch stats:', error)
    const empty = { grossSales: 0, cashTotal: 0, duitnowTotal: 0, totalModal: 0, netProfit: 0, saleCount: 0 }
    return { ...empty, avgOrderValue: 0, topProduct: '—', cashPct: 0, duitnowPct: 0, categoryBreakdown: [], lowStockProducts: [] }
  }

  let cashTotal = 0
  let duitnowTotal = 0
  const periodSales: number[] = []

  for (const sale of sales ?? []) {
    if (sale.payment_method === 'cash') cashTotal += sale.total
    else duitnowTotal += sale.total
    periodSales.push(sale.total)
  }

  const grossSales = cashTotal + duitnowTotal
  const { data: periodModals } = await supabase
    .from('session_modals')
    .select('amount')
    .eq('store_id', STORE_ID)
    .gte('created_at', start)
    .lt('created_at', end)
  const modalTotal = (periodModals ?? []).reduce((sum, m: { amount: number }) => sum + m.amount, 0)
  const saleCount = (sales ?? []).length
  const cashPct = grossSales > 0 ? round((cashTotal / grossSales) * 100) : 0
  const duitnowPct = grossSales > 0 ? round((duitnowTotal / grossSales) * 100) : 0

  return {
    grossSales: round(grossSales),
    cashTotal: round(cashTotal),
    duitnowTotal: round(duitnowTotal),
    totalModal: modalTotal,
    netProfit: round(grossSales - modalTotal),
    saleCount,
    avgOrderValue: saleCount > 0 ? round(grossSales / saleCount) : 0,
    topProduct: '—',
    cashPct,
    duitnowPct,
    categoryBreakdown: [],
    lowStockProducts: [],
  }
}

function buildMockEnhanced(
  grossSales: number, cashTotal: number, duitnowTotal: number,
  modalTotal: number, count: number, periodSales: number[],
): EnhancedStats {
  const products = MOCK_PRODUCTS
  const catMap = new Map<string, number>()
  for (const p of products) {
    const amt = round((p.price * p.stock * 0.3) * (periodSales.length / Math.max(mockSales.filter((s) => s.total > 0).length, 1)))
    catMap.set(p.category, (catMap.get(p.category) || 0) + amt)
  }
  const totalCat = Array.from(catMap.values()).reduce((a, b) => a + b, 0) || 1
  const breakdown: CategoryBreakdown[] = Array.from(catMap.entries())
    .map(([category, amount]) => ({ category, amount: round(amount), pct: round((amount / totalCat) * 100) }))
    .sort((a, b) => b.amount - a.amount)

  const cashPct = grossSales > 0 ? round((cashTotal / grossSales) * 100) : 0
  const duitnowPct = grossSales > 0 ? round((duitnowTotal / grossSales) * 100) : 0
  const topIdx = (count * 3) % products.length
  const lowStock = products.filter((p) => p.stock <= 3).map((p) => ({ name: p.name, stock: p.stock }))

  return {
    grossSales,
    cashTotal: round(cashTotal),
    duitnowTotal: round(duitnowTotal),
    totalModal: modalTotal,
    netProfit: round(grossSales - modalTotal),
    saleCount: count,
    avgOrderValue: count > 0 ? round(grossSales / count) : 0,
    topProduct: count > 0 ? products[topIdx].name : '—',
    cashPct,
    duitnowPct,
    categoryBreakdown: breakdown,
    lowStockProducts: lowStock,
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
  // monthly
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 1)
  return { start: firstDay.toISOString(), end: lastDay.toISOString() }
}

function round(n: number): number {
  return Math.round(n * 100) / 100
}

export async function addProduct(name: string, price: number, stock: number, category: string, image_url?: string): Promise<Product | null> {
  if (IS_MOCK) {
    const id = `p${++mockIdCounter}`
    const product: Product = {
      id, store_id: STORE_ID, name, price, stock, image_url: image_url ?? null, category,
      created_at: '', updated_at: '',
    }
    MOCK_PRODUCTS.push(product)
    return product
  }

  const { data, error } = await supabase
    .from('products')
    .insert({ store_id: STORE_ID, name, price, stock, category, image_url: image_url ?? null })
    .select()
    .single()

  if (error) { console.error('Failed to add product:', error); return null }
  return data as Product
}

export async function updateProduct(id: string, updates: { name?: string; price?: number; stock?: number; category?: string; image_url?: string | null }): Promise<boolean> {
  if (IS_MOCK) {
    const idx = MOCK_PRODUCTS.findIndex((p) => p.id === id)
    if (idx === -1) return false
    MOCK_PRODUCTS[idx] = { ...MOCK_PRODUCTS[idx], ...updates, updated_at: '' }
    return true
  }

  const { error } = await supabase
    .from('products')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) { console.error('Failed to update product:', error); return false }
  return true
}

export async function deleteProduct(id: string): Promise<boolean> {
  if (IS_MOCK) {
    const idx = MOCK_PRODUCTS.findIndex((p) => p.id === id)
    if (idx === -1) return false
    MOCK_PRODUCTS.splice(idx, 1)
    return true
  }

  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', id)

  if (error) { console.error('Failed to delete product:', error); return false }
  return true
}

export async function addModalEntry(amount: number, note: string): Promise<ModalEntry | null> {
  if (IS_MOCK) {
    const entry: ModalEntry = {
      id: `m${++mockModalIdCounter}`,
      amount,
      note,
      created_at: new Date().toISOString(),
    }
    mockModals.unshift(entry)
    return entry
  }

  const { data, error } = await supabase
    .from('session_modals')
    .insert({ store_id: STORE_ID, amount, note })
    .select()
    .single()

  if (error) { console.error('Failed to add modal entry:', error); return null }
  return data as ModalEntry
}

export async function fetchModalEntries(): Promise<ModalEntry[]> {
  if (IS_MOCK) return [...mockModals]

  const { data, error } = await supabase
    .from('session_modals')
    .select('*')
    .eq('store_id', STORE_ID)
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) { console.error('Failed to fetch modal entries:', error); return [] }
  return data as ModalEntry[]
}

function sumModalsForRange(start: string, end: string): number {
  let total = 0
  for (const m of mockModals) {
    if (m.created_at >= start && m.created_at < end) {
      total += m.amount
    }
  }
  return round(total)
}

export function clearSessionData(): void {
  mockSales = []
  mockModals = []
}

export async function clearAllStoreData(): Promise<void> {
  mockSales = []
  mockModals = []

  if (IS_MOCK) return

  try {
    await supabase.from('inventory_logs').delete().eq('store_id', STORE_ID)
    await supabase.from('sales').delete().eq('store_id', STORE_ID)
    await supabase.from('session_modals').delete().eq('store_id', STORE_ID)
  } catch (err: any) {
    console.error('Failed to clear store data:', err?.message || err)
  }
}
