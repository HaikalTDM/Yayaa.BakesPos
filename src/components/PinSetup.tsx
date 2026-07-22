'use client'

import { useState } from 'react'
import { usePinLock } from '@/hooks/usePinLock'
import { ShieldCheck } from 'lucide-react'

const PIN_LENGTH = 4

export default function PinSetup() {
  const { setPin } = usePinLock()
  const [digits, setDigits] = useState<string[]>([])
  const [confirm, setConfirm] = useState<string[]>([])
  const [step, setStep] = useState<'create' | 'confirm' | 'mismatch'>('create')

  const handleDigit = (d: string) => {
    if (step === 'create') {
      const next = [...digits, d]
      setDigits(next)
      if (next.length === PIN_LENGTH) {
        setTimeout(() => {
          setStep('confirm')
        }, 300)
      }
    } else {
      const next = [...confirm, d]
      setConfirm(next)
      if (next.length === PIN_LENGTH) {
        const entered = next.join('')
        if (entered === digits.join('')) {
          ;(async () => { await setPin(entered) })()
        } else {
          setStep('mismatch')
          setTimeout(() => {
            setDigits([])
            setConfirm([])
            setStep('create')
          }, 1200)
        }
      }
    }
  }

  const handleDelete = () => {
    if (step === 'create') {
      setDigits((prev) => prev.slice(0, -1))
    } else {
      setConfirm((prev) => prev.slice(0, -1))
    }
  }

  const current = step === 'create' ? digits : confirm
  const label =
    step === 'create'
      ? 'Set a 4-digit PIN'
      : step === 'confirm'
        ? 'Confirm your PIN'
        : 'PINs do not match — try again'

  return (
    <div className="fixed inset-0 z-[100] bg-brand-bg flex flex-col items-center justify-center px-6">
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-2xl bg-brand-pink/10 flex items-center justify-center mx-auto mb-4">
          <ShieldCheck className="w-8 h-8 text-brand-pink" strokeWidth={1.5} />
        </div>
        <img src="/logo.png" alt="yayaa.bakes" className="h-8 mx-auto mb-1 object-contain" />
        <p className={`text-sm font-medium ${step === 'mismatch' ? 'text-red-500' : 'text-brand-text/50'}`}>
          {label}
        </p>
      </div>

      {/* Dots */}
      <div className="flex gap-4 mb-8">
        {Array.from({ length: PIN_LENGTH }).map((_, i) => (
          <div
            key={i}
            className={`w-4 h-4 rounded-full border-2 transition-all ${
              i < current.length
                ? 'bg-brand-pink border-brand-pink'
                : 'border-brand-text/15 bg-transparent'
            }`}
          />
        ))}
      </div>

      {/* Keypad */}
      <div className="grid grid-cols-3 gap-3 w-full max-w-[260px]">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
          <button
            key={n}
            onClick={() => handleDigit(n.toString())}
            disabled={current.length >= PIN_LENGTH}
            className="w-full aspect-square rounded-2xl bg-white border border-brand-pink/10 text-brand-text text-xl font-bold active:bg-brand-pink/10 transition-colors disabled:opacity-30"
          >
            {n}
          </button>
        ))}
        <div />
        <button
          onClick={() => handleDigit('0')}
          disabled={current.length >= PIN_LENGTH}
          className="w-full aspect-square rounded-2xl bg-white border border-brand-pink/10 text-brand-text text-xl font-bold active:bg-brand-pink/10 transition-colors disabled:opacity-30"
        >
          0
        </button>
        <button
          onClick={handleDelete}
          disabled={current.length === 0}
          className="w-full aspect-square rounded-2xl bg-transparent text-brand-text/30 text-xs font-bold active:text-brand-text/60 transition-colors disabled:opacity-20"
        >
          DEL
        </button>
      </div>
    </div>
  )
}
