'use client'

import { useMemo } from 'react'
import ProductCard from './ProductCard'
import type { Product } from '@/lib/types'

type Props = {
  products: Product[]
  onAddToCart: (product: Product) => void
  onLongPress: (product: Product) => void
}

const SECTION_DESCRIPTIONS: Record<string, string> = {
  'Soft Cookies': 'Baked fresh daily, soft & huggable in every bite',
  'Sweet Treats': 'Classic desserts, made with love',
}

export default function ProductGrid({ products, onAddToCart, onLongPress }: Props) {
  const sections = useMemo(() => {
    const map = new Map<string, Product[]>()
    for (const p of products) {
      const list = map.get(p.category) || []
      list.push(p)
      map.set(p.category, list)
    }
    return Array.from(map.entries())
  }, [products])

  return (
    <div className="p-4 pb-24 space-y-5">
      {sections.map(([category, items]) => (
        <div key={category}>
          <div className="mb-3">
            <h3 className="text-sm font-extrabold text-brand-text">
              {category}
            </h3>
            {SECTION_DESCRIPTIONS[category] && (
              <p className="text-[11px] text-brand-text/35 font-medium mt-0.5">
                {SECTION_DESCRIPTIONS[category]}
              </p>
            )}
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
            {items.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAdd={onAddToCart}
                onLongPress={onLongPress}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
