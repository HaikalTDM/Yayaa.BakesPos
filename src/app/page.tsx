'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { X, Check, Loader2, CakeSlice } from 'lucide-react'
import confetti from 'canvas-confetti'
import { CartProvider, useCart } from '@/hooks/useCart'
import { PinProvider, usePinLock } from '@/hooks/usePinLock'
import { fetchProducts, createSale, logWasteOrFreebie, restockProduct } from '@/lib/db'
import { showToast } from '@/components/Toast'
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
import { ToastContainer } from '@/components/Toast'

const ADMIN_TABS: Tab[] = ['reconciliation', 'products']

// Minimalist chime using Web Audio API — two soft ascending notes
function playChime() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
    const notes = [523.25, 659.25] // C5, E5 — clean ascending interval
    const duration = 0.15
    const gain = ctx.createGain()
    gain.connect(ctx.destination)
    gain.gain.setValueAtTime(0.3, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4)

    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.12)
      osc.connect(gain)
      osc.start(ctx.currentTime + i * 0.12)
      osc.stop(ctx.currentTime + i * 0.12 + duration)
    })
  } catch {
    // Silently fail if AudioContext is unavailable
  }
}

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
  const { hasPin, isUnlocked, pinExists, changePin } = usePinLock()
  const [products, setProducts] = useState<Product[]>([])
  const [activeTab, setActiveTab] = useState<Tab>('checkout')
  const [loading, setLoading] = useState(true)
  const [pendingTab, setPendingTab] = useState<Tab | null>(null)
  const [showPinEntry, setShowPinEntry] = useState(false)
  const [showChangePin, setShowChangePin] = useState(false)

  // Checkout flow state
  const [flowStep, setFlowStep] = useState<'cart' | 'payment' | 'qr' | 'confirm'>('cart')
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod | null>(null)
  const [checkoutLoading, setCheckoutLoading] = useState(false)

  // Long press state
  const [longPressTarget, setLongPressTarget] = useState<Product | null>(null)
  const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 })

  // Fly-to-cart animation state
  const [flyingProduct, setFlyingProduct] = useState<{
    product: Product
    startX: number
    startY: number
    endX: number
    endY: number
    key: number
  } | null>(null)
  const [cartAnimateIn, setCartAnimateIn] = useState(false)
  const flyKeyRef = useRef(0)
  const cartWasEmpty = useRef(true)

  // Track if cart was empty before the last add (for entrance animation)
  useEffect(() => {
    cartWasEmpty.current = cart.length === 0
  }, [cart.length])

  const loadProducts = useCallback(async () => {
    setLoading(true)
    const data = await fetchProducts()
    setProducts(data)
    setLoading(false)
  }, [])

  useEffect(() => {
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

  const handleChangePin = useCallback(async (newPin: string) => {
    await changePin(newPin)
    setShowChangePin(false)
    showToast('PIN changed successfully')
  }, [changePin])

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

  // Cart handlers — with fly animation logic
  const handleAddToCart = useCallback(
    (product: Product, e: React.PointerEvent<HTMLButtonElement>) => {
      const wasEmpty = cart.length === 0

      // Add to cart
      dispatch({ type: 'ADD_ITEM', product })

      // Calculate animation coordinates
      const startX = e.clientX
      const startY = e.clientY
      // Target: center of the bottom of the screen (where the cart bar will appear)
      const endX = typeof window !== 'undefined' ? window.innerWidth / 2 : startX
      const endY = typeof window !== 'undefined' ? window.innerHeight - 50 : startY + 200

      // Trigger fly animation
      flyKeyRef.current += 1
      setFlyingProduct({
        product,
        startX,
        startY,
        endX,
        endY,
        key: flyKeyRef.current,
      })

      // If cart was empty, show the cart bar with entrance animation after fly completes
      if (wasEmpty) {
        setTimeout(() => {
          setCartAnimateIn(true)
        }, 450) // slightly after fly animation ends
      }

      // Clean up flying element after animation
      setTimeout(() => {
        setFlyingProduct(null)
      }, 500)
    },
    [dispatch, cart.length],
  )

  // Clear cartAnimateIn when cart becomes empty (user cleared all items)
  useEffect(() => {
    if (cart.length === 0) {
      setCartAnimateIn(false)
    }
  }, [cart.length])

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
    [updateLocalStock],
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
    [updateLocalStock],
  )

  const handleRestock = useCallback(
    async (product: Product, quantity: number) => {
      setLongPressTarget(null)
      const ok = await restockProduct(product.id, quantity)
      if (ok) {
        updateLocalStock(product.id, quantity)
        showToast(`${product.name} — restocked +${quantity}`)
      } else {
        showToast('Failed to restock')
      }
    },
    [updateLocalStock],
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

      // 🎉 Confetti + chime on successful payment
      playChime()
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#F89EAE', '#FFD700', '#FF6B8A', '#A78BFA', '#60A5FA'],
      })
    } else {
      showToast('Checkout failed. Try again.')
    }
  }, [cart, selectedPayment, dispatch, updateLocalStock])

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
    <div className="min-h-dvh md:h-dvh flex flex-col md:flex-row md:overflow-hidden">
      {/* LEFT PANEL — products, summary, product manager */}
      <div className="flex-1 md:w-[68%] flex flex-col min-w-0">
        <header className="bg-white border-b border-pink-100 px-4 py-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <img src="/logo.png" alt="logo" className="w-14 h-14 rounded-xl object-cover shadow-sm shrink-0" />
            <div className="flex flex-col">
              <img src="/logo-workmark.png" alt="yayaa.bakes" className="h-14 object-contain" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isUnlocked && ADMIN_TABS.includes(activeTab) && (
              <button
                onClick={() => setShowChangePin(true)}
                className="text-[10px] text-[#333333]/40 font-medium px-2 py-1 rounded-lg border border-pink-100 active:bg-pink-50 transition-colors"
              >
                Change PIN
              </button>
            )}
            {activeTab === 'checkout' && cart.length > 0 && (
              <div className="bg-[#F89EAE] text-white text-xs font-bold px-3 py-1.5 rounded-full">
                {cart.reduce((s, i) => s + i.quantity, 0)} items
              </div>
            )}
          </div>
        </header>

        <TabBar activeTab={activeTab} onTabChange={handleTabChange} />

        <main className="flex-1 overflow-y-auto pb-24 md:pb-0">
          {activeTab === 'checkout' && (
            loading ? (
              <div className="grid grid-cols-3 md:grid-cols-2 lg:grid-cols-3 gap-3 p-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="aspect-square md:h-24 rounded-2xl bg-white animate-pulse" />
                ))}
              </div>
            ) : (
              <ProductGrid products={products} onAddToCart={handleAddToCart} onLongPress={handleLongPress} />
            )
          )}
          {activeTab === 'reconciliation' && <ReconciliationDashboard />}
          {activeTab === 'products' && (
            <ProductManager products={products} onRefresh={loadProducts} />
          )}
        </main>
      </div>

      {/* MOBILE CART — fixed bottom sheet */}
      {activeTab === 'checkout' && flowStep === 'cart' && (
        <div className="md:hidden">
          <CartPanel onProceed={handleProceedToPayment} onBack={resetCheckout} variant="inline" animateIn={cartAnimateIn} />
        </div>
      )}

      {/* TABLET CART — sidebar */}
      {activeTab === 'checkout' && (
        <div className="hidden md:flex w-[32%] border-l border-pink-100 bg-white flex-col h-full shrink-0">
          <CartPanel onProceed={handleProceedToPayment} onBack={resetCheckout} variant="sidebar" />
        </div>
      )}

      {/* Fly-to-cart animation element */}
      {flyingProduct && (
        <div
          key={flyingProduct.key}
          className="fixed z-50 pointer-events-none animate-fly-to-cart"
          style={{
            left: flyingProduct.startX - 20,
            top: flyingProduct.startY - 20,
            '--fly-dx': `${flyingProduct.endX - flyingProduct.startX}px`,
            '--fly-dy': `${flyingProduct.endY - flyingProduct.startY}px`,
          } as React.CSSProperties}
        >
          <div className="w-10 h-10 rounded-full bg-[#F89EAE] shadow-lg flex items-center justify-center">
            <CakeSlice className="w-5 h-5 text-white" strokeWidth={2} />
          </div>
        </div>
      )}

      {/* Payment modal */}
      {activeTab === 'checkout' && flowStep === 'payment' && selectedPayment === null && (
        <PaymentButtons total={cartTotal} onSelect={handleSelectPayment} onBack={handleBackToCart} />
      )}

      {/* QR modal */}
      {activeTab === 'checkout' && flowStep === 'qr' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-xs bg-white rounded-3xl px-5 pt-8 pb-6 shadow-2xl animate-in zoom-in-95 mx-4">
            <div className="absolute -top-4 left-8 w-0 h-0 border-l-[16px] border-r-[16px] border-b-[18px] border-l-transparent border-r-transparent border-b-[#F89EAE]" />
            <div className="absolute -top-4 right-8 w-0 h-0 border-l-[16px] border-r-[16px] border-b-[18px] border-l-transparent border-r-transparent border-b-[#F89EAE]" />
            <div className="absolute -top-3 left-[38px] w-0 h-0 border-l-[10px] border-r-[10px] border-b-[12px] border-l-transparent border-r-transparent border-b-white" />
            <div className="absolute -top-3 right-[38px] w-0 h-0 border-l-[10px] border-r-[10px] border-b-[12px] border-l-transparent border-r-transparent border-b-white" />
            <h2 className="text-lg font-extrabold text-center text-[#333333] mb-1">Scan to Pay</h2>
            <p className="text-xs text-center text-[#333333]/50 mb-4">Show this QR to your customer</p>
            <div className="bg-pink-50 rounded-2xl p-3 mb-4">
              <img src="/yayaqr.jpeg" alt="DuitNow QR" className="w-full rounded-xl" />
            </div>
            <p className="text-center text-sm font-bold text-[#333333] mb-4">RM {cartTotal.toFixed(2)}</p>
            <div className="flex gap-3">
              <button onClick={handleCancelCheckout} className="flex-1 py-3.5 rounded-2xl border-2 border-red-200 text-red-500 font-bold text-sm active:bg-red-50 transition-colors flex items-center justify-center gap-1">
                <X className="w-4 h-4" strokeWidth={2.5} /> CANCEL
              </button>
              <button
                onClick={handleQrDone}
                disabled={checkoutLoading}
                className="flex-[2] py-3.5 rounded-2xl bg-[#F89EAE] text-white font-bold text-sm active:bg-[#E8577A] transition-colors shadow-md flex items-center justify-center gap-1 disabled:opacity-50"
              >
                {checkoutLoading ? <><Loader2 className="w-4 h-4 animate-spin" strokeWidth={2.5} /> Processing...</> : <><Check className="w-4 h-4" strokeWidth={2.5} /> PAID / DONE</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation modal */}
      {activeTab === 'checkout' && flowStep === 'confirm' && selectedPayment && (
        <CheckoutModal paymentMethod={selectedPayment} total={cartTotal} onConfirm={handleConfirmCheckout} onCancel={handleCancelCheckout} loading={checkoutLoading} />
      )}

      {/* Long Press Popup */}
      {longPressTarget && (
        <LongPressPopup product={longPressTarget} position={popupPosition} onWasted={handleWasted} onFreebie={handleFreebie} onRestock={handleRestock} onClose={() => setLongPressTarget(null)} />
      )}

      {hasPin && !pinExists && <PinSetup />}
      {showPinEntry && <PinEntry onClose={handleClosePinEntry} onSuccess={onPinSuccess} />}
      {showChangePin && (
        <PinEntry
          onClose={() => setShowChangePin(false)}
          onSuccess={() => setShowChangePin(false)}
          isChangeMode
          onChangePin={handleChangePin}
        />
      )}
      <ToastContainer />
    </div>
  )
}