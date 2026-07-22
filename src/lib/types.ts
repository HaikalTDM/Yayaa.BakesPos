export type Product = {
  id: string
  store_id: string
  name: string
  price: number
  stock: number
  image_url: string | null
  category: string
  created_at: string
  updated_at: string
}

export type CartItem = {
  product_id: string
  name: string
  price: number
  quantity: number
  stock: number
}

export type PaymentMethod = 'cash' | 'duitnow'

export type SaleStatus = 'received' | 'cancelled'

export type InventoryReason = 'sale' | 'wasted' | 'freebie' | 'restock'

export type Sale = {
  id: string
  store_id: string
  total: number
  payment_method: PaymentMethod
  status: SaleStatus
  created_at: string
}

export type SaleItem = {
  id: string
  sale_id: string
  product_id: string
  quantity: number
  price_at_sale: number
}

export type InventoryLog = {
  id: string
  store_id: string
  product_id: string
  change_amount: number
  reason: InventoryReason
  sale_id: string | null
  created_at: string
}

export type DailyStats = {
  grossSales: number
  cashTotal: number
  duitnowTotal: number
  totalModal: number
  netProfit: number
  saleCount: number
}

export type CategoryBreakdown = {
  category: string
  amount: number
  pct: number
}

export type EnhancedStats = DailyStats & {
  avgOrderValue: number
  topProduct: string
  cashPct: number
  duitnowPct: number
  categoryBreakdown: CategoryBreakdown[]
  lowStockProducts: { name: string; stock: number }[]
}

export type CartAction =
  | { type: 'ADD_ITEM'; product: Product }
  | { type: 'REMOVE_ITEM'; product_id: string }
  | { type: 'INCREMENT'; product_id: string }
  | { type: 'DECREMENT'; product_id: string }
  | { type: 'CLEAR' }

export type Tab = 'checkout' | 'reconciliation' | 'products'

export type Period = 'daily' | 'weekly' | 'monthly'

export type ModalEntry = {
  id: string
  amount: number
  note: string
  created_at: string
}
