'use client'

import { useState, useMemo } from 'react'
import { ShoppingBasket, Minus, Plus, ChevronUp, ChevronDown } from 'lucide-react'
import { useCart } from '@/hooks/useCart'

type Props = {
  onProceed: () => void
  onBack: () => void
}

export default function CartPanel({ onProceed, onBack }: Props) {
  const { cart, dispatch } = useCart()
  const [expanded, setExpanded] = useState(false)

  const total = useMemo(
    () => cart.reduce((sum, i) => sum + i.price * i.quantity, 0),
    [cart],
  )

  const itemCount = useMemo(
    () => cart.reduce((sum, i) => sum + i.quantity, 0),
    [cart],
  )

  if (cart.length === 0) {
    return (
      <>
        {/* Mobile: bottom sheet */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t-2 border-brand-pink/20 rounded-t-3xl shadow-[0_-4px_20px_rgba(232,87,122,0.2)] px-5 pt-5 pb-8">
          <div className="text-center py-4">
            <ShoppingBasket className="w-8 h-8 text-brand-pink/30 mx-auto mb-2" strokeWidth={1.5} />
            <p className="text-sm text-brand-text/60 font-medium">
              Tap desserts above to add them
            </p>
          </div>
        </div>
        {/* Tablet: right sidebar */}
        <div className="hidden md:flex fixed right-0 top-0 bottom-0 w-72 z-30 bg-white border-l-2 border-brand-pink/20 flex-col items-center justify-center px-6">
          <ShoppingBasket className="w-10 h-10 text-brand-pink/20 mb-3" strokeWidth={1.5} />
          <p className="text-sm text-brand-text/40 font-medium text-center">
            Tap desserts to add them
          </p>
        </div>
      </>
    )
}

function MobileCartContent({
  total, itemCount, onBack, onProceed, setExpanded,
}: {
  total: number
  itemCount: number
  onBack: () => void
  onProceed: () => void
  setExpanded: (v: boolean) => void
}) {
  const { cart, dispatch } = useCart()
  return (
    <>
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={() => setExpanded(false)}
          className="flex items-center gap-1 text-sm font-bold text-brand-text/60 active:text-brand-text"
        >
          <ChevronDown className="w-4 h-4" strokeWidth={2} />
          Cart · {itemCount} item{itemCount !== 1 ? 's' : ''}
        </button>
        <button
          onClick={() => dispatch({ type: 'CLEAR' })}
          className="text-xs text-red-400 font-medium active:opacity-70"
        >
          Clear all
        </button>
      </div>
      <div className="space-y-2 mb-4">
        {cart.map((item) => (
          <CartItemRow key={item.product_id} item={item} />
        ))}
      </div>
      <div className="flex items-center justify-between mb-4 px-1">
        <span className="text-sm font-semibold text-brand-text/70">Total</span>
        <span className="text-xl font-extrabold text-brand-text">RM {total.toFixed(2)}</span>
      </div>
      <div className="flex gap-3">
        <button
          onClick={() => { setExpanded(false); onBack() }}
          className="flex-1 py-3 rounded-2xl border-2 border-brand-pink/30 text-brand-pink font-bold text-sm active:bg-brand-pink/10 transition-colors"
        >
          + Add Product
        </button>
        <button
          onClick={onProceed}
          className="flex-[2] py-3 rounded-2xl bg-brand-pink text-white font-bold text-sm active:bg-brand-pink/80 transition-colors shadow-md"
        >
          Proceed to Pay
        </button>
      </div>
    </>
  )
}

function DesktopCartContent({
  total, onProceed,
}: {
  total: number
  onBack: () => void
  onProceed: () => void
}) {
  const { cart, dispatch } = useCart()
  return (
    <>
      <div className="flex-1 overflow-y-auto px-5 py-3 space-y-2">
        {cart.map((item) => (
          <CartItemRow key={item.product_id} item={item} />
        ))}
      </div>
      <div className="px-5 py-4 border-t border-brand-pink/10 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-brand-text/70">Total</span>
          <span className="text-xl font-extrabold text-brand-text">RM {total.toFixed(2)}</span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => dispatch({ type: 'CLEAR' })}
            className="flex-1 py-3 rounded-2xl border-2 border-red-200 text-red-400 font-bold text-xs active:bg-red-50 transition-colors"
          >
            Clear All
          </button>
          <button
            onClick={onProceed}
            className="flex-[2] py-3 rounded-2xl bg-brand-pink text-white font-bold text-sm active:bg-brand-pink/80 transition-colors shadow-md"
          >
            Proceed to Pay
          </button>
        </div>
      </div>
    </>
  )
}

function CartItemRow({ item }: { item: { product_id: string; name: string; price: number; quantity: number; stock: number } }) {
  const { dispatch } = useCart()
  return (
    <div className="flex items-center justify-between bg-brand-bg rounded-xl px-3 py-2">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-brand-text truncate">{item.name}</p>
        <p className="text-xs text-brand-pink font-medium">RM {(item.price * item.quantity).toFixed(2)}</p>
      </div>
      <div className="flex items-center gap-2 ml-2">
        <button
          onClick={() => dispatch({ type: 'DECREMENT', product_id: item.product_id })}
          className="w-8 h-8 rounded-full bg-brand-pink/15 text-brand-pink flex items-center justify-center active:bg-brand-pink/30 transition-colors"
        >
          <Minus className="w-4 h-4" strokeWidth={2.5} />
        </button>
        <span className="w-7 text-center text-sm font-bold text-brand-text tabular-nums">{item.quantity}</span>
        <button
          onClick={() => dispatch({ type: 'INCREMENT', product_id: item.product_id })}
          disabled={item.quantity >= item.stock}
          className="w-8 h-8 rounded-full bg-brand-pink/15 text-brand-pink flex items-center justify-center active:bg-brand-pink/30 transition-colors disabled:opacity-30"
        >
          <Plus className="w-4 h-4" strokeWidth={2.5} />
        </button>
      </div>
    </div>
  )
}

  return (
    <>
      {/* Mobile: bottom sheet */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t-2 border-brand-pink/20 rounded-t-3xl shadow-[0_-4px_20px_rgba(232,87,122,0.2)] transition-all duration-200">
        {!expanded ? (
          <button
            onClick={() => setExpanded(true)}
            className="w-full px-4 py-3 flex items-center justify-between active:bg-brand-bg/50 transition-colors rounded-t-3xl"
          >
            <div className="flex items-center gap-3">
              <span className="bg-brand-pink text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">
                {itemCount}
              </span>
              <span className="text-sm font-bold text-brand-text">
                RM {total.toFixed(2)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-brand-text/40 font-medium">View cart</span>
              <ChevronUp className="w-4 h-4 text-brand-text/30" strokeWidth={2} />
            </div>
          </button>
        ) : (
          <div className="px-4 pt-4 pb-6 max-h-[40vh] overflow-y-auto">
            <MobileCartContent total={total} itemCount={itemCount} onBack={onBack} onProceed={onProceed} setExpanded={setExpanded} />
          </div>
        )}
      </div>

      {/* Tablet: right sidebar */}
      <div className="hidden md:flex fixed right-0 top-0 bottom-0 w-80 z-30 bg-white border-l-2 border-brand-pink/20 flex-col">
        <div className="px-5 pt-5 pb-2 border-b border-brand-pink/10">
          <h2 className="text-base font-bold text-brand-text">
            Cart · {itemCount} item{itemCount !== 1 ? 's' : ''}
          </h2>
        </div>
        <DesktopCartContent total={total} onBack={onBack} onProceed={onProceed} />
      </div>
    </>
  )
}
