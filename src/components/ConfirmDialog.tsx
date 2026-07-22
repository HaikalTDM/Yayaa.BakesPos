'use client'

import { AlertTriangle } from 'lucide-react'

type Props = {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'danger' | 'warning'
  onConfirm: () => void
  onCancel: () => void
  loading?: boolean
}

export default function ConfirmDialog({
  open, title, message, confirmLabel = 'Confirm', cancelLabel = 'Cancel',
  variant = 'warning', onConfirm, onCancel, loading = false,
}: Props) {
  if (!open) return null

  const confirmColor = variant === 'danger'
    ? 'bg-rose-500 active:bg-rose-600'
    : 'bg-amber-500 active:bg-amber-600'

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-3xl px-6 pt-8 pb-6 shadow-2xl w-full max-w-xs mx-4 animate-in zoom-in-95">
        <div className="text-center">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4 ${
            variant === 'danger' ? 'bg-rose-100' : 'bg-amber-100'
          }`}>
            <AlertTriangle className={`w-6 h-6 ${variant === 'danger' ? 'text-rose-500' : 'text-amber-500'}`} strokeWidth={1.5} />
          </div>
          <h3 className="text-base font-extrabold text-[#333333] mb-1">{title}</h3>
          <p className="text-sm text-[#333333]/50 mb-6">{message}</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 py-3 rounded-2xl border-2 border-slate-200 text-slate-500 font-bold text-sm active:bg-slate-50 transition-colors disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 py-3 rounded-2xl text-white font-bold text-sm transition-colors disabled:opacity-50 shadow-sm ${confirmColor}`}
          >
            {loading ? 'Processing...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
