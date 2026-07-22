'use client'

import { ShoppingCart, BarChart3, Package } from 'lucide-react'
import type { Tab } from '@/lib/types'

type Props = {
  activeTab: Tab
  onTabChange: (tab: Tab) => void
}

export default function TabBar({ activeTab, onTabChange }: Props) {
  return (
    <div className="flex bg-white border-b border-brand-pink/15 px-2 pt-2">
      <TabButton
        active={activeTab === 'checkout'}
        onClick={() => onTabChange('checkout')}
        icon={<ShoppingCart className="w-4 h-4" strokeWidth={2} />}
        label="Counter"
      />
      <TabButton
        active={activeTab === 'reconciliation'}
        onClick={() => onTabChange('reconciliation')}
        icon={<BarChart3 className="w-4 h-4" strokeWidth={2} />}
        label="Summary"
      />
      <TabButton
        active={activeTab === 'products'}
        onClick={() => onTabChange('products')}
        icon={<Package className="w-4 h-4" strokeWidth={2} />}
        label="Products"
      />
    </div>
  )
}

function TabButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  label: string
}) {
  return (
    <button
      onClick={onClick}
      className={`
        flex-1 py-3 text-sm font-bold rounded-t-xl transition-all duration-150 flex items-center justify-center gap-1.5
        ${
          active
            ? 'bg-[#FBFAF2] text-[#F89EAE]'
            : 'text-[#333333]/40 hover:text-[#333333]/60'
        }
      `}
    >
      {icon}
      {label}
    </button>
  )
}
