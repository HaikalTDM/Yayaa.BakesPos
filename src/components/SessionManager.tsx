'use client'

import { useState, useCallback, useEffect } from 'react'
import { Clock, DollarSign, X, AlertTriangle } from 'lucide-react'
import { openSession, closeSession, fetchCurrentSession } from '@/lib/db'
import { showToast } from '@/components/Toast'
import type { Session } from '@/lib/types'

type Props = {
  session: Session | null
  onSessionChange: (s: Session | null) => void
  cashSalesToday: number
}

export default function SessionManager({ session, onSessionChange, cashSalesToday }: Props) {
  const [showOpenModal, setShowOpenModal] = useState(false)
  const [showCloseModal, setShowCloseModal] = useState(false)
  const [openingFloat, setOpeningFloat] = useState('50')
  const [closingCashCounted, setClosingCashCounted] = useState('')
  const [loading, setLoading] = useState(false)

  const cashSalesExpected = (session?.opening_float ?? 0) + cashSalesToday

  useEffect(() => {
    if (session) {
      setClosingCashCounted(cashSalesExpected.toFixed(2))
    }
  }, [session, cashSalesExpected])

  const handleOpen = useCallback(async () => {
    const amount = parseFloat(openingFloat)
    if (isNaN(amount) || amount < 0) return
    setLoading(true)
    const s = await openSession(amount)
    setLoading(false)
    if (s) {
      onSessionChange(s)
      setShowOpenModal(false)
      showToast(`Session opened — float RM ${amount.toFixed(2)}`)
    } else {
      showToast('Failed to open session')
    }
  }, [openingFloat, onSessionChange])

  const handleClose = useCallback(async () => {
    if (!session) return
    const counted = parseFloat(closingCashCounted)
    if (isNaN(counted)) return
    setLoading(true)
    const ok = await closeSession(session.id, counted, cashSalesExpected)
    setLoading(false)
    if (ok) {
      onSessionChange(null)
      setShowCloseModal(false)
      const diff = counted - cashSalesExpected
      showToast(`Session closed — ${diff >= 0 ? 'over' : 'short'} RM ${Math.abs(diff).toFixed(2)}`)
    } else {
      showToast('Failed to close session')
    }
  }, [session, closingCashCounted, cashSalesExpected, onSessionChange])

  if (!session) {
    return (
      <>
        <button
          onClick={() => setShowOpenModal(true)}
          className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-amber-100 border border-amber-300 text-amber-800 text-[10px] font-bold active:bg-amber-200 transition-colors"
        >
          <AlertTriangle className="w-3 h-3" strokeWidth={2.5} />
          No session
        </button>

        {showOpenModal && (
          <div className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-sm flex items-center justify-center animate-in fade-in">
            <div className="relative w-full max-w-xs bg-white rounded-3xl px-6 pt-8 pb-6 shadow-2xl animate-in zoom-in-95 mx-4">
              <button onClick={() => setShowOpenModal(false)} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-brand-bg flex items-center justify-center text-brand-text/30 active:text-brand-text/60">
                <X className="w-4 h-4" strokeWidth={2} />
              </button>
              <div className="text-center mb-5">
                <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center mx-auto mb-3">
                  <Clock className="w-6 h-6 text-amber-600" strokeWidth={1.5} />
                </div>
                <p className="text-sm font-bold text-brand-text">Open Session</p>
                <p className="text-xs text-brand-text/50 mt-0.5">Enter your starting float</p>
              </div>
              <div className="mb-4">
                <label className="text-[10px] font-semibold text-brand-text/50 block mb-1">Starting Float (RM)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-brand-text/40">RM</span>
                  <input
                    type="number"
                    inputMode="decimal"
                    value={openingFloat}
                    onChange={(e) => setOpeningFloat(e.target.value)}
                    className="w-full pl-10 pr-3 py-2.5 rounded-xl border-2 border-brand-pink/20 bg-brand-bg text-sm font-medium text-brand-text focus:outline-none focus:border-brand-pink"
                  />
                </div>
              </div>
              <button
                onClick={handleOpen}
                disabled={loading}
                className="w-full py-3 rounded-2xl bg-[#F89EAE] text-white font-bold text-sm active:bg-[#E8577A] transition-colors shadow-md disabled:opacity-50"
              >
                {loading ? 'Opening...' : 'Open Session'}
              </button>
            </div>
          </div>
        )}
      </>
    )
  }

  return (
    <>
      <button
        onClick={() => setShowCloseModal(true)}
        className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-green-100 border border-green-300 text-green-800 text-[10px] font-bold active:bg-green-200 transition-colors"
      >
        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
        Session open
      </button>

      {showCloseModal && (
        <div className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-sm flex items-center justify-center animate-in fade-in">
          <div className="relative w-full max-w-xs bg-white rounded-3xl px-6 pt-8 pb-6 shadow-2xl animate-in zoom-in-95 mx-4">
            <button onClick={() => setShowCloseModal(false)} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-brand-bg flex items-center justify-center text-brand-text/30 active:text-brand-text/60">
              <X className="w-4 h-4" strokeWidth={2} />
            </button>
            <div className="text-center mb-5">
              <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center mx-auto mb-3">
                <DollarSign className="w-6 h-6 text-green-600" strokeWidth={1.5} />
              </div>
              <p className="text-sm font-bold text-brand-text">Close Session</p>
              <p className="text-xs text-brand-text/50 mt-0.5">Count cash in drawer</p>
            </div>
            <div className="space-y-3 mb-4">
              <div className="bg-pink-50/50 rounded-xl p-3 space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-brand-text/50">Opening float</span>
                  <span className="font-bold text-brand-text">RM {session.opening_float.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-brand-text/50">Cash sales today</span>
                  <span className="font-bold text-brand-text">RM {cashSalesToday.toFixed(2)}</span>
                </div>
                <div className="border-t border-brand-pink/10 pt-1.5 flex justify-between text-xs">
                  <span className="font-semibold text-brand-text">Expected in drawer</span>
                  <span className="font-extrabold text-brand-pink">RM {cashSalesExpected.toFixed(2)}</span>
                </div>
              </div>
              <div>
                <label className="text-[10px] font-semibold text-brand-text/50 block mb-1">Cash counted in drawer (RM)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-brand-text/40">RM</span>
                  <input
                    type="number"
                    inputMode="decimal"
                    value={closingCashCounted}
                    onChange={(e) => setClosingCashCounted(e.target.value)}
                    className="w-full pl-10 pr-3 py-2.5 rounded-xl border-2 border-brand-pink/20 bg-brand-bg text-sm font-medium text-brand-text focus:outline-none focus:border-brand-pink"
                  />
                </div>
              </div>
            </div>
            <button
              onClick={handleClose}
              disabled={loading}
              className="w-full py-3 rounded-2xl bg-[#F89EAE] text-white font-bold text-sm active:bg-[#E8577A] transition-colors shadow-md disabled:opacity-50"
            >
              {loading ? 'Closing...' : 'Close Session'}
            </button>
          </div>
        </div>
      )}
    </>
  )
}