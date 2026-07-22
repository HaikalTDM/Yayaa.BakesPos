'use client'

import { useState, useMemo } from 'react'
import { ShoppingBasket, Minus, Plus, ChevronUp, ChevronDown } from 'lucide-react'
import { useCart } from '@/hooks/useCart'

type Props = {
  onProceed: () => void
  onBack: () => void
  variant?: 'sidebar' | 'inline'
}

export default function CartPanel({ onProceed, onBack, variant = 'inline' }: Props) {
  const { cart, dispatch } = useCart()
  const [expanded, setExpanded] = useState(false)

  const total = useMemo(() => cart.reduce((sum, i) => sum + i.price * i.quantity, 0), [cart])
  const itemCount = useMemo(() => cart.reduce((sum, i) => sum + i.quantity, 0), [cart])

  if (variant === 'sidebar') {
    return <SidebarCart total={total} itemCount={itemCount} onProceed={onProceed} />
  }

  if (cart.length === 0) {
    return (
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t-2 border-pink-100 rounded-t-3xl shadow-[0_-4px_20px_rgba(248,158,174,0.15)] px-5 pt-5 pb-8">
        <div className="text-center py-4">
          <ShoppingBasket className="w-8 h-8 text-pink-200 mx-auto mb-2" strokeWidth={1.5} />
          <p className="text-sm text-[#333333]/60 font-medium">Tap desserts above to add them</p>
        </div>
      </div>
    )
  }

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t-2 border-pink-100 rounded-t-3xl shadow-[0_-4px_20px_rgba(248,158,174,0.15)] transition-all duration-200">
      {!expanded ? (
        <button
          onClick={() => setExpanded(true)}
          className="w-full px-4 py-3 flex items-center justify-between active:bg-pink-50/50 rounded-t-3xl"
        >
          <div className="flex items-center gap-3">
            <span className="bg-[#F89EAE] text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">
              {itemCount}
            </span>
            <span className="text-sm font-bold text-[#333333]">RM {total.toFixed(2)}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#333333]/40 font-medium">View cart</span>
            <ChevronUp className="w-4 h-4 text-[#333333]/30" strokeWidth={2} />
          </div>
        </button>
      ) : (
        <div className="px-4 pt-4 pb-6 max-h-[55vh] overflow-y-auto">
          <CartItemsList onBack={() => { setExpanded(false); onBack() }} onProceed={onProceed} total={total} itemCount={itemCount} setExpanded={setExpanded} />
        </div>
      )}
    </div>
  )
}

function SidebarCart({ total, itemCount, onProceed }: { total: number; itemCount: number; onProceed: () => void }) {
  const { cart, dispatch } = useCart()

  if (cart.length === 0) {
    return (
      <div className="hidden md:flex flex-col items-center justify-center h-full px-6 text-center">
        <ShoppingBasket className="w-12 h-12 text-pink-200 mb-3" strokeWidth={1} />
        <p className="text-sm text-[#333333]/40 font-medium">Select items to build order</p>
      </div>
    )
  }

  return (
    <div className="hidden md:flex flex-col h-full">
      <div className="px-5 pt-5 pb-3 border-b border-pink-100">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-[#333333]">
            Cart · {itemCount} item{itemCount !== 1 ? 's' : ''}
          </h2>
          <button onClick={() => dispatch({ type: 'CLEAR' })} className="text-xs text-red-400 font-medium active:opacity-70">
            Clear
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-5 py-3 space-y-2">
        {cart.map((item) => (
          <div key={item.product_id} className="flex items-center justify-between bg-pink-50/50 rounded-xl px-3 py-2">
            <div className="flex-1 min-w-0"><p className="text-sm font-semibold text-[#333333] truncate">{item.name}</p></div>
            <div className="flex items-center gap-2 ml-2">
              <button onClick={() => dispatch({ type: 'DECREMENT', product_id: item.product_id })} className="w-7 h-7 rounded-full bg-pink-100 text-[#F89EAE] flex items-center justify-center active:bg-pink-200">
                <Minus className="w-3.5 h-3.5" strokeWidth={2.5} />
              </button>
              <span className="w-6 text-center text-sm font-bold text-[#333333] tabular-nums">{item.quantity}</span>
              <button onClick={() => dispatch({ type: 'INCREMENT', product_id: item.product_id })} disabled={item.quantity >= item.stock} className="w-7 h-7 rounded-full bg-pink-100 text-[#F89EAE] flex items-center justify-center active:bg-pink-200 disabled:opacity-30">
                <Plus className="w-3.5 h-3.5" strokeWidth={2.5} />
              </button>
            </div>
          </div>
        ))}
      </div>
      <div className="px-5 py-4 border-t border-pink-100 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-[#333333]/70">Total</span>
          <span className="text-xl font-extrabold text-[#333333]">RM {total.toFixed(2)}</span>
        </div>
        <button onClick={onProceed} className="w-full py-3 rounded-2xl bg-[#F89EAE] text-white font-bold text-sm active:bg-[#E8577A] transition-colors shadow-md">
          Proceed to Pay
        </button>
      </div>
    </div>
  )
}

function CartItemsList({
  total, itemCount, onBack, onProceed, setExpanded,
}: {
  total: number; itemCount: number; onBack: () => void; onProceed: () => void; setExpanded: (v: boolean) => void;
}) {
  const { cart, dispatch } = useCart()
  return (
    <>
      <div className="flex items-center justify-between mb-3">
        <button onClick={() => setExpanded(false)} className="flex items-center gap-1 text-sm font-bold text-[#333333]/60 active:text-[#333333]">
          <ChevronDown className="w-4 h-4" strokeWidth={2} /> Cart · {itemCount} item{itemCount !== 1 ? 's' : ''}
        </button>
        <button onClick={() => dispatch({ type: 'CLEAR' })} className="text-xs text-red-400 font-medium active:opacity-70">Clear all</button>
      </div>
      <div className="space-y-2 mb-4">
        {cart.map((item) => (
          <div key={item.product_id} className="flex items-center justify-between bg-pink-50/50 rounded-xl px-3 py-2">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[#333333] truncate">{item.name}</p>
              <p className="text-xs text-[#F89EAE] font-medium">RM {(item.price * item.quantity).toFixed(2)}</p>
            </div>
            <div className="flex items-center gap-2 ml-2">
              <button onClick={() => dispatch({ type: 'DECREMENT', product_id: item.product_id })} className="w-8 h-8 rounded-full bg-pink-100 text-[#F89EAE] flex items-center justify-center active:bg-pink-200">
                <Minus className="w-4 h-4" strokeWidth={2.5} />
              </button>
              <span className="w-7 text-center text-sm font-bold text-[#333333] tabular-nums">{item.quantity}</span>
              <button onClick={() => dispatch({ type: 'INCREMENT', product_id: item.product_id })} disabled={item.quantity >= item.stock} className="w-8 h-8 rounded-full bg-pink-100 text-[#F89EAE] flex items-center justify-center active:bg-pink-200 disabled:opacity-30">
                <Plus className="w-4 h-4" strokeWidth={2.5} />
              </button>
            </div>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between mb-4 px-1">
        <span className="text-sm font-semibold text-[#333333]/70">Total</span>
        <span className="text-xl font-extrabold text-[#333333]">RM {total.toFixed(2)}</span>
      </div>
      <div className="flex gap-3">
        <button onClick={() => { setExpanded(false); onBack() }} className="flex-1 py-3 rounded-2xl border-2 border-pink-200 text-[#F89EAE] font-bold text-sm active:bg-pink-50 transition-colors">
          + Add Product
        </button>
        <button onClick={onProceed} className="flex-[2] py-3 rounded-2xl bg-[#F89EAE] text-white font-bold text-sm active:bg-[#E8577A] transition-colors shadow-md">
          Proceed to Pay
        </button>
      </div>
    </>
  )
}
