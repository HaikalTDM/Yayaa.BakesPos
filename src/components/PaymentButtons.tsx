'use client'

import { Banknote, Smartphone, ArrowLeft } from 'lucide-react'
import type { PaymentMethod } from '@/lib/types'

type Props = {
  total: number
  onSelect: (method: PaymentMethod) => void
  onBack: () => void
}

export default function PaymentButtons({ total, onSelect, onBack }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-xs bg-white rounded-3xl px-5 pt-6 pb-5 shadow-2xl animate-in zoom-in-95 mx-4">
        <div className="text-center mb-5">
          <p className="text-xs text-brand-text/50 font-medium mb-1 tracking-wide uppercase">
            Total Amount
          </p>
          <p className="text-3xl font-extrabold text-brand-text">
            RM {total.toFixed(2)}
          </p>
        </div>

        <p className="text-xs text-brand-text/50 font-medium text-center mb-3">
          Select payment method
        </p>

        <div className="flex gap-3 mb-3">
          <button
            onClick={() => onSelect('cash')}
            className="flex-1 py-4 rounded-2xl bg-green-50 border-2 border-green-300 text-green-800 font-bold text-base active:bg-green-100 transition-colors flex flex-col items-center gap-1"
          >
            <Banknote className="w-5 h-5" strokeWidth={1.5} />
            Cash
          </button>
          <button
            onClick={() => onSelect('duitnow')}
            className="flex-1 py-4 rounded-2xl bg-blue-50 border-2 border-blue-300 text-blue-800 font-bold text-base active:bg-blue-100 transition-colors flex flex-col items-center gap-1"
          >
            <Smartphone className="w-5 h-5" strokeWidth={1.5} />
            DuitNow / QR
          </button>
        </div>

        <button
          onClick={onBack}
          className="w-full py-3 rounded-2xl border-2 border-brand-pink/20 text-brand-pink/70 font-semibold text-sm active:bg-brand-pink/5 transition-colors flex items-center justify-center gap-1"
        >
          <ArrowLeft className="w-4 h-4" strokeWidth={2} />
          Back to Cart
        </button>
      </div>
    </div>
  )
}
