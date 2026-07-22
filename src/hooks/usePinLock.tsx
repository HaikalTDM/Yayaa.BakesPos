'use client'

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'

const STORAGE_KEY = 'yayaa_pin'
const PIN_LENGTH = 4

type PinContextType = {
  hasPin: boolean
  isUnlocked: boolean
  pinExists: boolean
  setPin: (pin: string) => void
  unlock: (pin: string) => boolean
  lock: () => void
  resetPin: () => void
}

const PinContext = createContext<PinContextType | null>(null)

export function PinProvider({ children }: { children: ReactNode }) {
  const [storedPin, setStoredPin] = useState<string | null>(null)
  const [isUnlocked, setIsUnlocked] = useState(false)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    const pin = localStorage.getItem(STORAGE_KEY)
    setStoredPin(pin)
    setHydrated(true)
  }, [])

  const pinExists = storedPin !== null && storedPin.length === PIN_LENGTH

  const setPin = useCallback((pin: string) => {
    if (pin.length !== PIN_LENGTH) return
    localStorage.setItem(STORAGE_KEY, pin)
    setStoredPin(pin)
    setIsUnlocked(true)
  }, [])

  const unlock = useCallback((pin: string): boolean => {
    if (pin === storedPin) {
      setIsUnlocked(true)
      return true
    }
    return false
  }, [storedPin])

  const lock = useCallback(() => {
    setIsUnlocked(false)
  }, [])

  const resetPin = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY)
    setStoredPin(null)
    setIsUnlocked(false)
  }, [])

  return (
    <PinContext.Provider value={{ hasPin: hydrated, isUnlocked, pinExists, setPin, unlock, lock, resetPin }}>
      {children}
    </PinContext.Provider>
  )
}

export function usePinLock() {
  const ctx = useContext(PinContext)
  if (!ctx) throw new Error('usePinLock must be used within PinProvider')
  return ctx
}
