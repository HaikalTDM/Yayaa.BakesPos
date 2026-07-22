'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { X, Check, Loader2 } from 'lucide-react'
import { CartProvider, useCart } from '@/hooks/useCart'
import { PinProvider, usePinLock } from '@/hooks/usePinLock'
import { fetchProducts, createSale, logWasteOrFreebie } from '@/lib/db'
import { initStoreContext } from '@/lib/supabase'
import type { Product, PaymentMethod, Tab } from '@/lib/types'
import TabBar from '@/components/TabBar'
import ProductGrid from '@/components/ProductGrid'
import CartPanel from '@/components/CartPanel'
import PaymentButtons from '@/components/PaymentButtons'
import CheckoutModal from '@/components/CheckoutModal'
import LongPressPopup from '@/components/LongPressPopup'
import ReconciliationDashboard from '@/components/ReconciliationDashboard'
import ProductManager from '@/components/ProductManager'
import PinSetup from '@/components/PinSetup'
import PinEntry from '@/components/PinEntry'

const ADMIN_TABS: Tab[] = ['reconciliation', 'products']

export default function HomePage() {
  return (
    <PinProvider>
      <CartProvider>
        <POSApp />
      </CartProvider>
    </PinProvider>
  )
}

function POSApp() {
  const { cart, dispatch } = useCart()
  const { hasPin, isUnlocked, pinExists } = usePinLock()
  const [products, setProducts] = useState<Product[]>([])
  const [activeTab, setActiveTab] = useState<Tab>('checkout')
  const [loading, setLoading] = useState(true)
  const [pendingTab, setPendingTab] = useState<Tab | null>(null)
  const [showPinEntry, setShowPinEntry] = useState(false)

  // Checkout flow state
  const [flowStep, setFlowStep] = useState<'cart' | 'payment' | 'qr' | 'confirm'>('cart')
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod | null>(null)
  const [checkoutLoading, setCheckoutLoading] = useState(false)

  // Long press state
  const [longPressTarget, setLongPressTarget] = useState<Product | null>(null)
  const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 })

  // Toast
  const [toast, setToast] = useState<string | null>(null)
  const toastTimerRef = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => {
    return () => clearTimeout(toastTimerRef.current)
  }, [])

  const showToast = useCallback((msg: string) => {
    setToast(msg)
    clearTimeout(toastTimerRef.current)
    toastTimerRef.current = setTimeout(() => setToast(null), 2000)
  }, [])

  const loadProducts = useCallback(async () => {
    setLoading(true)
    const data = await fetchProducts()
    setProducts(data)
    setLoading(false)
  }, [])

  useEffect(() => {
    initStoreContext()
    loadProducts()
  }, [loadProducts])

  const handleTabChange = useCallback((tab: Tab) => {
    if (ADMIN_TABS.includes(tab) && !isUnlocked) {
      setPendingTab(tab)
      setShowPinEntry(true)
      return
    }
    setActiveTab(tab)
  }, [isUnlocked])

  const onPinSuccess = useCallback(() => {
    setShowPinEntry(false)
    if (pendingTab) {
      setActiveTab(pendingTab)
      setPendingTab(null)
    }
  }, [pendingTab])

  const handleClosePinEntry = useCallback(() => {
    setShowPinEntry(false)
    setPendingTab(null)
  }, [])

  // Update product stock locally after DB mutations
  const updateLocalStock = useCallback(
    (productId: string, delta: number) => {
      setProducts((prev) =>
        prev.map((p) =>
          p.id === productId ? { ...p, stock: Math.max(0, p.stock + delta) } : p,
        ),
      )
    },
    [],
  )

  // Cart handlers
  const handleAddToCart = useCallback(
    (product: Product) => {
      dispatch({ type: 'ADD_ITEM', product })
    },
    [dispatch],
  )

  const handleLongPress = useCallback(
    (product: Product) => {
      setLongPressTarget(product)
      setPopupPosition({ x: 80, y: typeof window !== 'undefined' ? window.innerHeight / 2 - 100 : 200 })
    },
    [],
  )

  const handleWasted = useCallback(
    async (product: Product) => {
      setLongPressTarget(null)
      const ok = await logWasteOrFreebie(product.id, 'wasted')
      if (ok) {
        updateLocalStock(product.id, -1)
        showToast(`${product.name} — logged as waste`)
      } else {
        showToast('Failed to log waste')
      }
    },
    [updateLocalStock, showToast],
  )

  const handleFreebie = useCallback(
    async (product: Product) => {
      setLongPressTarget(null)
      const ok = await logWasteOrFreebie(product.id, 'freebie')
      if (ok) {
        updateLocalStock(product.id, -1)
        showToast(`${product.name} — logged as freebie`)
      } else {
        showToast('Failed to log freebie')
      }
    },
    [updateLocalStock, showToast],
  )

  // Checkout flow handlers
  const handleProceedToPayment = useCallback(() => {
    setFlowStep('payment')
  }, [])

  const handleSelectPayment = useCallback((method: PaymentMethod) => {
    setSelectedPayment(method)
    if (method === 'duitnow') {
      setFlowStep('qr')
    } else {
      setFlowStep('confirm')
    }
  }, [])

  const handleBackToCart = useCallback(() => {
    setFlowStep('cart')
    setSelectedPayment(null)
  }, [])

  const handleCancelCheckout = useCallback(() => {
    setFlowStep('cart')
    setSelectedPayment(null)
  }, [])

  const executeCheckout = useCallback(async () => {
    if (!selectedPayment) return
    setCheckoutLoading(true)
    const ok = await createSale(cart, selectedPayment)
    setCheckoutLoading(false)

    if (ok) {
      for (const item of cart) {
        updateLocalStock(item.product_id, -item.quantity)
      }
      dispatch({ type: 'CLEAR' })
      setFlowStep('cart')
      setSelectedPayment(null)
      showToast('Sale completed')
    } else {
      showToast('Checkout failed. Try again.')
    }
  }, [cart, selectedPayment, dispatch, updateLocalStock, showToast])

  const handleQrDone = useCallback(() => {
    executeCheckout()
  }, [executeCheckout])

  const handleConfirmCheckout = useCallback(() => {
    executeCheckout()
  }, [executeCheckout])

  const cartTotal = useMemo(
    () => cart.reduce((sum, i) => sum + i.price * i.quantity, 0),
    [cart],
  )

  const resetCheckout = useCallback(() => {
    setFlowStep('cart')
    setSelectedPayment(null)
  }, [])

  return (
    <div className="min-h-dvh flex flex-col relative">
      {/* Header */}
      <header className="bg-white border-b border-brand-pink/15 px-4 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <img
            src="/logo.png"
            alt="Yayaa.Bakes"
            className="w-10 h-10 rounded-xl object-cover shadow-sm"
          />
          <div>
            <h1 className="text-lg font-extrabold text-brand-pink leading-tight">
              Yayaa.Bakes
            </h1>
            <p className="text-[10px] text-brand-text/40 font-medium">
              Micro-POS
            </p>
          </div>
        </div>
        {activeTab === 'checkout' && cart.length > 0 && (
          <div className="bg-brand-pink text-white text-xs font-bold px-3 py-1.5 rounded-full">
            {cart.reduce((s, i) => s + i.quantity, 0)} items
          </div>
        )}
      </header>

      {/* Tab Bar */}
      <TabBar activeTab={activeTab} onTabChange={handleTabChange} />

      {/* Content */}
      <main className="flex-1 overflow-y-auto md:pr-80">
        {activeTab === 'checkout' && (
          loading ? (
            <div className="grid grid-cols-3 gap-3 p-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="aspect-square rounded-2xl bg-white animate-pulse" />
              ))}
            </div>
          ) : (
            <ProductGrid
              products={products}
              onAddToCart={handleAddToCart}
              onLongPress={handleLongPress}
            />
          )
        )}
        {activeTab === 'reconciliation' && <ReconciliationDashboard />}
        {activeTab === 'products' && (
          <ProductManager
            products={products}
            onRefresh={loadProducts}
            showToast={showToast}
          />
        )}
      </main>

      {/* Cart Panel & Payment Flow (checkout tab only) */}
      {activeTab === 'checkout' && flowStep === 'cart' && (
        <CartPanel
          onProceed={handleProceedToPayment}
          onBack={resetCheckout}
        />
      )}

      {activeTab === 'checkout' && flowStep === 'payment' && selectedPayment === null && (
        <PaymentButtons
          total={cartTotal}
          onSelect={handleSelectPayment}
          onBack={handleBackToCart}
        />
      )}

      {activeTab === 'checkout' && flowStep === 'qr' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-xs bg-white rounded-3xl px-5 pt-8 pb-6 shadow-2xl animate-in zoom-in-95 mx-4">
            {/* Cat ears on QR modal too */}
            <div className="absolute -top-4 left-8 w-0 h-0 border-l-[16px] border-r-[16px] border-b-[18px] border-l-transparent border-r-transparent border-b-brand-pink" />
            <div className="absolute -top-4 right-8 w-0 h-0 border-l-[16px] border-r-[16px] border-b-[18px] border-l-transparent border-r-transparent border-b-brand-pink" />
            <div className="absolute -top-3 left-[38px] w-0 h-0 border-l-[10px] border-r-[10px] border-b-[12px] border-l-transparent border-r-transparent border-b-white" />
            <div className="absolute -top-3 right-[38px] w-0 h-0 border-l-[10px] border-r-[10px] border-b-[12px] border-l-transparent border-r-transparent border-b-white" />

            <h2 className="text-lg font-extrabold text-center text-brand-text mb-1">
              Scan to Pay
            </h2>
            <p className="text-xs text-center text-brand-text/50 mb-4">
              Show this QR to your customer
            </p>

            <div className="bg-brand-bg rounded-2xl p-3 mb-4">
              <img
                src="/yayaqr.jpeg"
                alt="DuitNow QR"
                className="w-full rounded-xl"
              />
            </div>

            <p className="text-center text-sm font-bold text-brand-text mb-4">
              RM {cartTotal.toFixed(2)}
            </p>

            <div className="flex gap-3">
              <button
                onClick={handleCancelCheckout}
                className="flex-1 py-3.5 rounded-2xl border-2 border-red-200 text-red-500 font-bold text-sm active:bg-red-50 transition-colors flex items-center justify-center gap-1"
              >
                <X className="w-4 h-4" strokeWidth={2.5} />
                CANCEL
              </button>
              <button
                onClick={handleQrDone}
                disabled={checkoutLoading}
                className="flex-[2] py-3.5 rounded-2xl bg-brand-pink text-white font-bold text-sm active:bg-brand-pink/80 transition-colors shadow-md flex items-center justify-center gap-1 disabled:opacity-50"
              >
                {checkoutLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2.5} />
                    Processing...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" strokeWidth={2.5} />
                    PAID / DONE
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'checkout' && flowStep === 'confirm' && selectedPayment && (
        <CheckoutModal
          paymentMethod={selectedPayment}
          total={cartTotal}
          onConfirm={handleConfirmCheckout}
          onCancel={handleCancelCheckout}
          loading={checkoutLoading}
        />
      )}

      {/* Long Press Popup */}
      {longPressTarget && (
        <LongPressPopup
          product={longPressTarget}
          position={popupPosition}
          onWasted={handleWasted}
          onFreebie={handleFreebie}
          onClose={() => setLongPressTarget(null)}
        />
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[60] bg-brand-text text-white text-sm font-semibold px-5 py-2.5 rounded-full shadow-lg animate-in slide-in-from-top-2 fade-in">
          {toast}
        </div>
      )}

      {hasPin && !pinExists && <PinSetup />}
      {showPinEntry && (
        <PinEntry onClose={handleClosePinEntry} onSuccess={onPinSuccess} />
      )}
    </div>
  )
}
