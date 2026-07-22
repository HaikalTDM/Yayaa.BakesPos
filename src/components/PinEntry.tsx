'use client'

import { useState } from 'react'
import { usePinLock } from '@/hooks/usePinLock'
import { ShieldAlert, X } from 'lucide-react'

const PIN_LENGTH = 4

type Props = {
  onClose: () => void
  onSuccess: () => void
}

export default function PinEntry({ onClose, onSuccess }: Props) {
  const { unlock, resetPin } = usePinLock()
  const [digits, setDigits] = useState<string[]>([])
  const [error, setError] = useState(false)
  const [showReset, setShowReset] = useState(false)

  const handleDigit = async (d: string) => {
    if (digits.length >= PIN_LENGTH) return
    const next = [...digits, d]
    setDigits(next)
    setError(false)
    if (next.length === PIN_LENGTH) {
      const entered = next.join('')
      const ok = await unlock(entered)
      if (!ok) {
        setError(true)
        setDigits([])
      } else {
        setTimeout(() => onSuccess(), 200)
      }
    }
  }

  const handleDelete = () => {
    setDigits((prev) => prev.slice(0, -1))
    setError(false)
  }

  const handleReset = async () => {
    await resetPin()
    setTimeout(() => onClose(), 100)
  }

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center animate-in fade-in">
      <div className="relative w-full max-w-xs bg-white rounded-3xl px-6 pt-8 pb-6 shadow-2xl animate-in zoom-in-95 mx-4">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-brand-bg flex items-center justify-center text-brand-text/30 active:text-brand-text/60"
        >
          <X className="w-4 h-4" strokeWidth={2} />
        </button>

        {showReset ? (
          <div className="text-center">
            <ShieldAlert className="w-10 h-10 text-amber-500 mx-auto mb-3" strokeWidth={1.5} />
            <h3 className="text-base font-extrabold text-brand-text mb-1">Reset PIN?</h3>
            <p className="text-xs text-brand-text/50 mb-5">
              This clears your current PIN. You will create a new one.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowReset(false)}
                className="flex-1 py-2.5 rounded-xl border-2 border-brand-pink/20 text-brand-text/60 font-semibold text-sm"
              >
                Back
              </button>
              <button
                onClick={handleReset}
                className="flex-1 py-2.5 rounded-xl bg-red-500 text-white font-bold text-sm"
              >
                Reset PIN
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="text-center mb-5">
              <div className="w-12 h-12 rounded-xl bg-brand-pink/10 flex items-center justify-center mx-auto mb-3">
                <ShieldAlert className="w-6 h-6 text-brand-pink" strokeWidth={1.5} />
              </div>
              <p className="text-sm font-bold text-brand-text">Enter PIN</p>
              <p className="text-xs text-brand-text/50 mt-0.5">
                Required for admin access
              </p>
            </div>

            {/* Dots */}
            <div className="flex gap-4 justify-center mb-6">
              {Array.from({ length: PIN_LENGTH }).map((_, i) => (
                <div
                  key={i}
                  className={`w-3.5 h-3.5 rounded-full border-2 transition-all ${
                    error
                      ? 'border-red-400 bg-red-400'
                      : i < digits.length
                        ? 'bg-brand-pink border-brand-pink'
                        : 'border-brand-text/15 bg-transparent'
                  }`}
                />
              ))}
            </div>

            {error && (
              <p className="text-xs text-red-500 font-medium text-center mb-3 -mt-3">
                Incorrect PIN
              </p>
            )}

            {/* Keypad */}
            <div className="grid grid-cols-3 gap-2.5 max-w-[220px] mx-auto mb-4">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                <button
                  key={n}
                  onClick={() => handleDigit(n.toString())}
                  className="w-full aspect-square rounded-xl bg-brand-bg border border-brand-pink/10 text-brand-text text-lg font-bold active:bg-brand-pink/10 transition-colors"
                >
                  {n}
                </button>
              ))}
              <div />
              <button
                onClick={() => handleDigit('0')}
                className="w-full aspect-square rounded-xl bg-brand-bg border border-brand-pink/10 text-brand-text text-lg font-bold active:bg-brand-pink/10 transition-colors"
              >
                0
              </button>
              <button
                onClick={handleDelete}
                disabled={digits.length === 0}
                className="w-full aspect-square rounded-xl bg-transparent text-brand-text/25 text-xs font-bold active:text-brand-text/50 transition-colors disabled:opacity-20"
              >
                DEL
              </button>
            </div>

            <button
              onClick={() => setShowReset(true)}
              className="text-[10px] text-brand-text/25 font-medium mx-auto block active:text-brand-text/50"
            >
              Forgot PIN?
            </button>
          </>
        )}
      </div>
    </div>
  )
}
