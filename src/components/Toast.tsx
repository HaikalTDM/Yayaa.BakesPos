'use client'

import { useEffect, useState } from 'react'
import { CheckCircle, XCircle, AlertTriangle, X } from 'lucide-react'

type ToastType = 'success' | 'error' | 'info'
type ToastItem = { id: number; message: string; type: ToastType }

let toastId = 0
let addToastFn: ((msg: string, type: ToastType) => void) | null = null

export function showToast(message: string, type: ToastType = 'info') {
  addToastFn?.(message, type)
}

export function showSuccess(message: string) { showToast(message, 'success') }
export function showError(message: string) { showToast(message, 'error') }

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  useEffect(() => {
    addToastFn = (message: string, type: ToastType) => {
      const id = ++toastId
      setToasts((prev) => [...prev, { id, message, type }])
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id))
      }, 3000)
    }
    return () => { addToastFn = null }
  }, [])

  const dismiss = (id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }

  if (toasts.length === 0) return null

  const icons: Record<ToastType, React.ReactNode> = {
    success: <CheckCircle className="w-4 h-4" strokeWidth={2.5} />,
    error: <XCircle className="w-4 h-4" strokeWidth={2.5} />,
    info: <AlertTriangle className="w-4 h-4" strokeWidth={2.5} />,
  }

  const colors: Record<ToastType, string> = {
    success: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    error: 'bg-rose-50 border-rose-200 text-rose-700',
    info: 'bg-slate-800 border-slate-700 text-white',
  }

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[200] flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto flex items-center gap-2 px-4 py-2.5 rounded-xl border shadow-lg text-sm font-semibold animate-in slide-in-from-top-2 fade-in ${colors[t.type]}`}
        >
          {icons[t.type]}
          <span className="flex-1">{t.message}</span>
          <button onClick={() => dismiss(t.id)} className="opacity-50 hover:opacity-100">
            <X className="w-3.5 h-3.5" strokeWidth={2.5} />
          </button>
        </div>
      ))}
    </div>
  )
}
