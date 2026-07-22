'use client'

import { useState } from 'react'
import { usePinLock } from '@/hooks/usePinLock'
import { ShieldAlert, X } from 'lucide-react'

const PIN_LENGTH = 4

type Props = {
  onClose: () => void
  onSuccess: () => void
  isChangeMode?: boolean
  onChangePin?: (newPin: string) => Promise<void>
}

export default function PinEntry({ onClose, onSuccess, isChangeMode, onChangePin }: Props) {
  const { unlock } = usePinLock()
  const [digits, setDigits] = useState<string[]>([])
  const [step, setStep] = useState<'current' | 'new' | 'confirm'>('current')
  const [newPin, setNewPin] = useState<string[]>([])
  const [confirmPin, setConfirmPin] = useState<string[]>([])
  const [error, setError] = useState(false)

  const handleDigit = async (d: string) => {
    if (isChangeMode) {
      // Change PIN flow: current -> new -> confirm
      if (step === 'current') {
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
            setTimeout(() => {
              setStep('new')
              setDigits([])
              setError(false)
            }, 300)
          }
        }
      } else if (step === 'new') {
        if (newPin.length >= PIN_LENGTH) return
        const next = [...newPin, d]
        setNewPin(next)
        if (next.length === PIN_LENGTH) {
          setTimeout(() => {
            setStep('confirm')
          }, 300)
        }
      } else if (step === 'confirm') {
        if (confirmPin.length >= PIN_LENGTH) return
        const next = [...confirmPin, d]
        setConfirmPin(next)
        if (next.length === PIN_LENGTH) {
          const entered = next.join('')
          if (entered === newPin.join('')) {
            await onChangePin?.(entered)
            onSuccess()
          } else {
            setError(true)
            setConfirmPin([])
          }
        }
      }
      return
    }

    // Normal unlock flow
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
    if (isChangeMode) {
      if (step === 'current') {
        setDigits((prev) => prev.slice(0, -1))
      } else if (step === 'new') {
        setNewPin((prev) => prev.slice(0, -1))
      } else {
        setConfirmPin((prev) => prev.slice(0, -1))
      }
    } else {
      setDigits((prev) => prev.slice(0, -1))
    }
    setError(false)
  }

  const currentDots = isChangeMode
    ? step === 'current' ? digits : step === 'new' ? newPin : confirmPin
    : digits

  const title = isChangeMode
    ? step === 'current'
      ? 'Enter current PIN'
      : step === 'new'
        ? 'Create new PIN'
        : 'Confirm new PIN'
    : 'Enter PIN'

  const subtitle = isChangeMode
    ? 'Change your store PIN'
    : 'Required for admin access'

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center animate-in fade-in">
      <div className="relative w-full max-w-xs bg-white rounded-3xl px-6 pt-8 pb-6 shadow-2xl animate-in zoom-in-95 mx-4">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-brand-bg flex items-center justify-center text-brand-text/30 active:text-brand-text/60"
        >
          <X className="w-4 h-4" strokeWidth={2} />
        </button>

        <div className="text-center mb-5">
          <div className="w-12 h-12 rounded-xl bg-brand-pink/10 flex items-center justify-center mx-auto mb-3">
            <ShieldAlert className="w-6 h-6 text-brand-pink" strokeWidth={1.5} />
          </div>
          <p className="text-sm font-bold text-brand-text">{title}</p>
          <p className="text-xs text-brand-text/50 mt-0.5">{subtitle}</p>
          {isChangeMode && step !== 'current' && (
            <p className="text-[10px] text-brand-pink font-medium mt-1">
              Step {step === 'new' ? '2' : '3'} of 3
            </p>
          )}
        </div>

        {/* Dots */}
        <div className="flex gap-4 justify-center mb-6">
          {Array.from({ length: PIN_LENGTH }).map((_, i) => (
            <div
              key={i}
              className={`w-3.5 h-3.5 rounded-full border-2 transition-all ${
                error
                  ? 'border-red-400 bg-red-400'
                  : i < currentDots.length
                    ? 'bg-brand-pink border-brand-pink'
                    : 'border-brand-text/15 bg-transparent'
              }`}
            />
          ))}
        </div>

        {error && (
          <p className="text-xs text-red-500 font-medium text-center mb-3 -mt-3">
            {isChangeMode && step === 'confirm' ? 'PINs do not match' : 'Incorrect PIN'}
          </p>
        )}

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-2.5 max-w-[220px] mx-auto mb-4">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
            <button
              key={n}
              onClick={() => handleDigit(n.toString())}
              disabled={currentDots.length >= PIN_LENGTH}
              className="w-full aspect-square rounded-xl bg-brand-bg border border-brand-pink/10 text-brand-text text-lg font-bold active:bg-brand-pink/10 transition-colors disabled:opacity-30"
            >
              {n}
            </button>
          ))}
          <div />
          <button
            onClick={() => handleDigit('0')}
            disabled={currentDots.length >= PIN_LENGTH}
            className="w-full aspect-square rounded-xl bg-brand-bg border border-brand-pink/10 text-brand-text text-lg font-bold active:bg-brand-pink/10 transition-colors disabled:opacity-30"
          >
            0
          </button>
          <button
            onClick={handleDelete}
            disabled={currentDots.length === 0}
            className="w-full aspect-square rounded-xl bg-transparent text-brand-text/25 text-xs font-bold active:text-brand-text/50 transition-colors disabled:opacity-20"
          >
            DEL
          </button>
        </div>
      </div>
    </div>
  )
}
