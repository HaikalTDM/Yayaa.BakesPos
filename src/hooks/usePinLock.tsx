'use client'

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { hashPin, fetchPinHash, savePinHash, clearRemotePin } from '@/lib/pin'

const STORAGE_KEY = 'yayaa_pin_hash'
const PIN_LENGTH = 4

type PinContextType = {
  hasPin: boolean
  isUnlocked: boolean
  pinExists: boolean
  setPin: (pin: string) => Promise<void>
  unlock: (pin: string) => Promise<boolean>
  lock: () => void
  resetPin: () => Promise<void>
}

const PinContext = createContext<PinContextType | null>(null)

export function PinProvider({ children }: { children: ReactNode }) {
  const [storedHash, setStoredHash] = useState<string | null>(null)
  const [isUnlocked, setIsUnlocked] = useState(false)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    ;(async () => {
      const remote = await fetchPinHash()
      if (remote) {
        localStorage.setItem(STORAGE_KEY, remote)
        setStoredHash(remote)
      } else {
        const local = localStorage.getItem(STORAGE_KEY)
        setStoredHash(local)
      }
      setHydrated(true)
    })()
  }, [])

  const pinExists = storedHash !== null && storedHash.length > 0

  const setPin = useCallback(async (pin: string) => {
    if (pin.length !== PIN_LENGTH) return
    const hash = await hashPin(pin)
    localStorage.setItem(STORAGE_KEY, hash)
    setStoredHash(hash)
    setIsUnlocked(true)
    await savePinHash(hash)
  }, [])

  const unlock = useCallback(async (pin: string): Promise<boolean> => {
    const hash = await hashPin(pin)
    if (hash === storedHash) {
      setIsUnlocked(true)
      return true
    }
    return false
  }, [storedHash])

  const lock = useCallback(() => {
    setIsUnlocked(false)
  }, [])

  const resetPin = useCallback(async () => {
    localStorage.removeItem(STORAGE_KEY)
    setStoredHash(null)
    setIsUnlocked(false)
    await clearRemotePin()
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
