'use client'

import { Banknote, Smartphone, X, Check, Loader2 } from 'lucide-react'
import { useCart } from '@/hooks/useCart'
import type { PaymentMethod } from '@/lib/types'

type Props = {
  paymentMethod: PaymentMethod
  total: number
  onConfirm: () => void
  onCancel: () => void
  loading: boolean
}

export default function CheckoutModal({
  paymentMethod,
  total,
  onConfirm,
  onCancel,
  loading,
}: Props) {
  const { cart } = useCart()

  const methodLabel = paymentMethod === 'cash' ? 'Cash' : 'DuitNow / QR'
  const MethodIcon = paymentMethod === 'cash' ? Banknote : Smartphone
  const methodClass =
    paymentMethod === 'cash'
      ? 'bg-green-50 text-green-800 border-green-300'
      : 'bg-blue-50 text-blue-800 border-blue-300'

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full sm:max-w-sm bg-white rounded-t-3xl sm:rounded-3xl px-5 pt-8 pb-8 shadow-2xl animate-in slide-in-from-bottom">
        {/* Cat ears */}
        <div className="absolute -top-4 left-8 w-0 h-0 border-l-[16px] border-r-[16px] border-b-[18px] border-l-transparent border-r-transparent border-b-brand-pink" />
        <div className="absolute -top-4 right-8 w-0 h-0 border-l-[16px] border-r-[16px] border-b-[18px] border-l-transparent border-r-transparent border-b-brand-pink" />

        {/* Inner ear pink */}
        <div className="absolute -top-3 left-[38px] w-0 h-0 border-l-[10px] border-r-[10px] border-b-[12px] border-l-transparent border-r-transparent border-b-white" />
        <div className="absolute -top-3 right-[38px] w-0 h-0 border-l-[10px] border-r-[10px] border-b-[12px] border-l-transparent border-r-transparent border-b-white" />

        <h2 className="text-lg font-extrabold text-center text-brand-text mb-1">
          Confirm Order
        </h2>
        <p className="text-xs text-center text-brand-text/50 mb-4">
          Please double-check before confirming
        </p>

        {/* Order summary */}
        <div className="bg-brand-bg rounded-2xl p-3 mb-4 space-y-2">
          {cart.map((item) => (
            <div key={item.product_id} className="flex justify-between text-sm">
              <span className="text-brand-text font-medium">
                {item.quantity}× {item.name}
              </span>
              <span className="text-brand-text font-semibold tabular-nums">
                RM {(item.price * item.quantity).toFixed(2)}
              </span>
            </div>
          ))}
          <div className="border-t border-brand-pink/20 pt-2 flex justify-between">
            <span className="text-sm font-bold text-brand-text">Total</span>
            <span className="text-sm font-extrabold text-brand-text tabular-nums">
              RM {total.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Payment method */}
        <div
          className={`rounded-xl border-2 px-4 py-2 mb-5 text-center text-sm font-bold flex items-center justify-center gap-2 ${methodClass}`}
        >
          <MethodIcon className="w-4 h-4" strokeWidth={1.5} />
          Pay via {methodLabel}
        </div>

        {/* Action buttons */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 py-3.5 rounded-2xl border-2 border-red-200 text-red-500 font-bold text-sm active:bg-red-50 transition-colors disabled:opacity-50 flex items-center justify-center gap-1"
          >
            <X className="w-4 h-4" strokeWidth={2.5} />
            CANCEL
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-[2] py-3.5 rounded-2xl bg-brand-pink text-white font-bold text-sm active:bg-brand-pink/80 transition-colors disabled:opacity-50 shadow-md flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2.5} />
                Saving...
              </>
            ) : (
              <>
                <Check className="w-4 h-4" strokeWidth={2.5} />
                RECEIVED
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
