'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  RefreshCw, Plus, TrendingUp, ShoppingBag,
  DollarSign, AlertTriangle, Package,
} from 'lucide-react'
import { fetchStats, addModalEntry, fetchModalEntries } from '@/lib/db'
import type { EnhancedStats, Period, ModalEntry } from '@/lib/types'

const PERIODS: { key: Period; label: string }[] = [
  { key: 'daily', label: 'Today' },
  { key: 'weekly', label: 'This Week' },
  { key: 'monthly', label: 'This Month' },
]

export default function ReconciliationDashboard() {
  const [period, setPeriod] = useState<Period>('daily')
  const [stats, setStats] = useState<EnhancedStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [modalAmount, setModalAmount] = useState('')
  const [modalNote, setModalNote] = useState('')
  const [showModalForm, setShowModalForm] = useState(false)
  const [modalEntries, setModalEntries] = useState<ModalEntry[]>([])
  const [saving, setSaving] = useState(false)

  const loadAll = useCallback(async () => {
    setLoading(true)
    const [data, entries] = await Promise.all([
      fetchStats(period),
      fetchModalEntries(),
    ])
    setStats(data)
    setModalEntries(entries)
    setLoading(false)
  }, [period])

  useEffect(() => {
    loadAll()
  }, [loadAll])

  const handleAddModal = async () => {
    const amount = parseFloat(modalAmount)
    if (isNaN(amount) || amount <= 0) return
    setSaving(true)
    const entry = await addModalEntry(amount, modalNote.trim() || 'Session modal')
    setSaving(false)
    if (entry) {
      setModalAmount('')
      setModalNote('')
      setShowModalForm(false)
      loadAll()
    }
  }

  const periodLabel =
    period === 'daily'
      ? new Date().toLocaleDateString('en-MY', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
      : period === 'weekly'
        ? `Week of ${getMonday().toLocaleDateString('en-MY', { month: 'short', day: 'numeric' })}`
        : new Date().toLocaleDateString('en-MY', { year: 'numeric', month: 'long' })

  if (loading) {
    return (
      <div className="p-4 pb-8 space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-16 bg-white rounded-2xl animate-pulse" />
        ))}
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="p-4 pb-8">
        <p className="text-sm text-slate-400 text-center py-12">
          No data available
        </p>
      </div>
    )
  }

  return (
    <div className="p-4 pb-8 space-y-4">
      {/* Header */}
      <div>
        <h2 className="text-lg font-extrabold text-slate-800">
          Sales Summary
        </h2>
        <p className="text-xs text-slate-400">{periodLabel}</p>
      </div>

      {/* Period selector */}
      <div className="flex bg-white rounded-2xl border border-slate-200 p-1">
        {PERIODS.map((p) => (
          <button
            key={p.key}
            onClick={() => setPeriod(p.key)}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
              period === p.key
                ? 'bg-brand-pink text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-3 gap-3">
        <QuickStat
          icon={<ShoppingBag className="w-4 h-4" strokeWidth={1.5} />}
          label="Avg Order"
          value={`RM ${stats.avgOrderValue.toFixed(2)}`}
          accent="border-l-slate-400"
        />
        <QuickStat
          icon={<TrendingUp className="w-4 h-4" strokeWidth={1.5} />}
          label="Top Item"
          value={stats.topProduct}
          valueClass="text-[11px] truncate"
          accent="border-l-purple-400"
        />
        <QuickStat
          icon={<DollarSign className="w-4 h-4" strokeWidth={1.5} />}
          label="Net Profit"
          value={`RM ${stats.netProfit.toFixed(2)}`}
          valueClass={stats.netProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'}
          accent={stats.netProfit >= 0 ? 'border-l-emerald-400' : 'border-l-rose-400'}
        />
      </div>

      {/* Main Stat Cards */}
      <div className="space-y-2.5">
        <div className="bg-white rounded-2xl border border-slate-200 border-l-4 border-l-brand-pink p-4">
          <p className="text-xs font-semibold text-slate-500">Gross Sales</p>
          <p className="text-2xl font-extrabold text-brand-pink tabular-nums mt-1">
            RM {stats.grossSales.toFixed(2)}
          </p>
          <div className="mt-1">
            <span className="text-[10px] text-slate-400">
              {stats.saleCount} sale{stats.saleCount !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* Payment Split */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4">
          <p className="text-xs font-semibold text-slate-500 mb-3">Payment Split</p>
          <div className="flex gap-3">
            <div className="flex-1 bg-emerald-50 border border-emerald-200 rounded-xl p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-[11px] font-semibold text-emerald-800">Cash</span>
              </div>
              <p className="text-sm font-extrabold text-emerald-900">RM {stats.cashTotal.toFixed(2)}</p>
              <p className="text-[10px] text-emerald-600 font-medium">{stats.cashPct}%</p>
            </div>
            <div className="flex-1 bg-indigo-50 border border-indigo-200 rounded-xl p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <div className="w-2 h-2 rounded-full bg-indigo-500" />
                <span className="text-[11px] font-semibold text-indigo-800">DuitNow</span>
              </div>
              <p className="text-sm font-extrabold text-indigo-900">RM {stats.duitnowTotal.toFixed(2)}</p>
              <p className="text-[10px] text-indigo-600 font-medium">{stats.duitnowPct}%</p>
            </div>
          </div>
        </div>

        <StatCard label="Total Modal" value={stats.totalModal} bg="bg-amber-50" border="border-amber-200">
          <span className="text-[10px] text-amber-600">Sum of all session costs</span>
        </StatCard>
        <StatCard
          label="Net Profit"
          value={stats.netProfit}
          bg={stats.netProfit >= 0 ? 'bg-emerald-50' : 'bg-rose-50'}
          border={stats.netProfit >= 0 ? 'border-emerald-200' : 'border-rose-200'}
        >
          {stats.totalModal > 0 && (
            <span className="text-[10px] text-slate-400">
              Gross RM {stats.grossSales.toFixed(2)} − Modal RM {stats.totalModal.toFixed(2)}
            </span>
          )}
        </StatCard>
      </div>

      {/* Category Breakdown */}
      {stats.categoryBreakdown.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-4">
          <p className="text-xs font-semibold text-slate-500 mb-3">Sales by Category</p>
          <div className="space-y-2.5">
            {stats.categoryBreakdown.map((cat) => (
              <div key={cat.category}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-semibold text-slate-700">{cat.category}</span>
                  <span className="font-bold text-slate-800 tabular-nums">
                    RM {cat.amount.toFixed(2)}
                    <span className="text-slate-400 font-medium ml-1">{cat.pct}%</span>
                  </span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-brand-pink rounded-full transition-all duration-500"
                    style={{ width: `${cat.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Low Stock Alerts */}
      {stats.lowStockProducts.length > 0 && (
        <div className="bg-rose-50 rounded-2xl border border-rose-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-rose-600" strokeWidth={2} />
            <p className="text-xs font-bold text-rose-700">Low Stock Alert</p>
          </div>
          <div className="space-y-1">
            {stats.lowStockProducts.map((p) => (
              <div key={p.name} className="flex justify-between text-xs">
                <span className="text-rose-800 font-medium">{p.name}</span>
                <span className="text-rose-600 font-bold">{p.stock} pcs left</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Log Session Modal */}
      <div>
        <button
          onClick={() => setShowModalForm(!showModalForm)}
          className="w-full py-3 rounded-2xl border-2 border-dashed border-brand-pink/30 text-brand-pink font-semibold text-sm active:bg-brand-pink/5 transition-colors flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" strokeWidth={2} />
          Log Session Modal
        </button>

        {showModalForm && (
          <div className="bg-white rounded-2xl border-2 border-brand-pink/20 p-4 mt-3 space-y-3">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">RM</span>
              <input
                type="number"
                inputMode="decimal"
                value={modalAmount}
                onChange={(e) => setModalAmount(e.target.value)}
                placeholder="0.00"
                className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-slate-200 bg-slate-50 text-slate-800 font-bold text-lg focus:outline-none focus:border-brand-pink"
                autoFocus
              />
            </div>
            <input
              type="text"
              value={modalNote}
              onChange={(e) => setModalNote(e.target.value)}
              placeholder="Note (e.g. Weekend ingredients)"
              className="w-full px-3 py-2.5 rounded-xl border-2 border-slate-200 bg-slate-50 text-sm font-medium text-slate-700 placeholder:text-slate-300 focus:outline-none focus:border-brand-pink"
            />
            <div className="flex gap-2">
              <button
                onClick={() => setShowModalForm(false)}
                className="flex-1 py-2.5 rounded-xl border-2 border-slate-200 text-slate-500 font-semibold text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleAddModal}
                disabled={saving}
                className="flex-1 py-2.5 rounded-xl bg-brand-pink text-white font-bold text-sm active:bg-brand-pink/80 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Modal'}
              </button>
            </div>
          </div>
        )}

        {modalEntries.length > 0 && (
          <div className="mt-4 space-y-1.5">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-1 mb-2">
              Recent Session Modals
            </p>
            {modalEntries.slice(0, 5).map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between bg-white rounded-xl border border-slate-200 px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="text-xs text-slate-400">
                    {new Date(entry.created_at).toLocaleDateString('en-MY', { month: 'short', day: 'numeric' })}
                  </p>
                  <p className="text-xs font-medium text-slate-600 truncate">{entry.note}</p>
                </div>
                <span className="text-sm font-bold text-amber-700 ml-2 shrink-0">
                  RM {entry.amount.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <button
        onClick={loadAll}
        className="w-full mt-2 py-3 rounded-2xl border-2 border-brand-pink/20 text-brand-pink font-semibold text-sm active:bg-brand-pink/5 transition-colors flex items-center justify-center gap-2"
      >
        <RefreshCw className="w-4 h-4" strokeWidth={2} />
        Refresh
      </button>
    </div>
  )
}

function QuickStat({
  icon, label, value, valueClass = '', accent = '',
}: {
  icon: React.ReactNode
  label: string
  value: string
  valueClass?: string
  accent?: string
}) {
  return (
    <div className={`bg-white rounded-2xl border border-slate-200 border-l-4 ${accent} p-3`}>
      <div className="text-brand-pink/70 mb-1">{icon}</div>
      <p className={`text-sm font-bold text-slate-800 tabular-nums ${valueClass}`}>{value}</p>
      <p className="text-[10px] text-slate-400 font-medium mt-0.5">{label}</p>
    </div>
  )
}

function StatCard({
  label, value, bg = 'bg-white', border = 'border-slate-200', children,
}: {
  label: string
  value: number
  bg?: string
  border?: string
  children?: React.ReactNode
}) {
  return (
    <div className={`${bg} rounded-2xl border ${border} p-4`}>
      <div className="flex items-end justify-between">
        <p className="text-xs font-semibold text-slate-500">{label}</p>
      </div>
      <p className="text-2xl font-extrabold text-slate-800 tabular-nums mt-1">
        RM {value.toFixed(2)}
      </p>
      {children && <div className="mt-1">{children}</div>}
    </div>
  )
}

function getMonday(): Date {
  const now = new Date()
  const day = now.getDay()
  return new Date(now.getFullYear(), now.getMonth(), now.getDate() - (day === 0 ? 6 : day - 1))
}
