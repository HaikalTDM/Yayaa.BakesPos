'use client'

import { useState } from 'react'
import { Trash2, Gift, Plus } from 'lucide-react'
import type { Product } from '@/lib/types'

type Props = {
  product: Product
  position: { x: number; y: number }
  onWasted: (product: Product) => void
  onFreebie: (product: Product) => void
  onRestock: (product: Product, quantity: number) => void
  onClose: () => void
}

export default function LongPressPopup({
  product,
  position,
  onWasted,
  onFreebie,
  onRestock,
  onClose,
}: Props) {
  const [restockQty, setRestockQty] = useState(5)

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/30"
        onClick={onClose}
        onPointerDown={(e) => e.stopPropagation()}
      />
      <div
        className="fixed z-50 bg-white rounded-2xl shadow-xl border border-brand-pink/20 p-4 min-w-[200px] animate-in zoom-in-95 fade-in"
        style={{
          left: Math.min(position.x, typeof window !== 'undefined' ? window.innerWidth - 220 : 0),
          top: Math.min(position.y, typeof window !== 'undefined' ? window.innerHeight - 280 : 0),
        }}
      >
        <p className="text-xs font-semibold text-brand-text/60 mb-3 text-center">
          {product.name} · Stock: {product.stock}
        </p>
        <div className="flex flex-col gap-2">
          <button
            onClick={() => onWasted(product)}
            className="w-full py-3 rounded-xl bg-red-50 border border-red-200 text-red-600 font-bold text-sm active:bg-red-100 transition-colors flex items-center justify-center gap-2"
          >
            <Trash2 className="w-4 h-4" strokeWidth={2} />
            Wasted / Dropped
          </button>
          <button
            onClick={() => onFreebie(product)}
            className="w-full py-3 rounded-xl bg-yellow-50 border border-yellow-200 text-yellow-700 font-bold text-sm active:bg-yellow-100 transition-colors flex items-center justify-center gap-2"
          >
            <Gift className="w-4 h-4" strokeWidth={2} />
            Freebie / Taste Test
          </button>

          <div className="border-t border-pink-100 pt-2 mt-1">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold text-brand-text/50">Restock quantity:</span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setRestockQty((q) => Math.max(1, q - 1))}
                  className="w-6 h-6 rounded-md bg-pink-50 text-[#F89EAE] font-bold text-xs active:bg-pink-100"
                >
                  −
                </button>
                <span className="w-7 text-center text-sm font-bold text-brand-text tabular-nums">{restockQty}</span>
                <button
                  onClick={() => setRestockQty((q) => Math.min(99, q + 1))}
                  className="w-6 h-6 rounded-md bg-pink-50 text-[#F89EAE] font-bold text-xs active:bg-pink-100"
                >
                  +
                </button>
              </div>
            </div>
            <button
              onClick={() => onRestock(product, restockQty)}
              className="w-full py-3 rounded-xl bg-green-50 border border-green-200 text-green-700 font-bold text-sm active:bg-green-100 transition-colors flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" strokeWidth={2} />
              Add {restockQty} to stock
            </button>
          </div>
        </div>
        <p className="text-[10px] text-brand-text/40 text-center mt-2">
          Waste/Freebie: −1 stock · RM 0.00
        </p>
      </div>
    </>
  )
}