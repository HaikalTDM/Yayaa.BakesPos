'use client'

import { Trash2, Gift } from 'lucide-react'
import type { Product } from '@/lib/types'

type Props = {
  product: Product
  position: { x: number; y: number }
  onWasted: (product: Product) => void
  onFreebie: (product: Product) => void
  onClose: () => void
}

export default function LongPressPopup({
  product,
  position,
  onWasted,
  onFreebie,
  onClose,
}: Props) {
  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/30"
        onClick={onClose}
        onPointerDown={(e) => e.stopPropagation()}
      />
      <div
        className="fixed z-50 bg-white rounded-2xl shadow-xl border border-brand-pink/20 p-4 min-w-[180px] animate-in zoom-in-95 fade-in"
        style={{
          left: Math.min(position.x, typeof window !== 'undefined' ? window.innerWidth - 200 : 0),
          top: Math.min(position.y, typeof window !== 'undefined' ? window.innerHeight - 200 : 0),
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
        </div>
        <p className="text-[10px] text-brand-text/40 text-center mt-2">
          Deducts 1 from stock · RM 0.00 sales
        </p>
      </div>
    </>
  )
}
