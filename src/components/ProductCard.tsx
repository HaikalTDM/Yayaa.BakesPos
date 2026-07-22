'use client'

import { CakeSlice } from 'lucide-react'
import { useLongPress } from '@/hooks/useLongPress'
import { useCart } from '@/hooks/useCart'
import type { Product } from '@/lib/types'

type Props = {
  product: Product
  onAdd: (product: Product) => void
  onLongPress: (product: Product) => void
}

export default function ProductCard({ product, onAdd, onLongPress }: Props) {
  const { cart } = useCart()
  const isOutOfStock = product.stock <= 0

  const cartItem = cart.find((i) => i.product_id === product.id)
  const cartQty = cartItem?.quantity ?? 0

  const longPress = useLongPress(
    () => onLongPress(product),
    () => {
      if (!isOutOfStock) onAdd(product)
    },
    800,
  )

  return (
    <button
      {...longPress}
      disabled={isOutOfStock}
      className={`
        relative flex flex-col items-center justify-center rounded-2xl
        p-3 text-center transition-all duration-150 select-none
        touch-manipulation active:scale-95
        border-2
        ${isOutOfStock
          ? 'border-gray-200 bg-gray-100 opacity-50 cursor-not-allowed'
          : longPress.isPressing
            ? 'border-brand-pink bg-brand-pink/15 scale-[0.97]'
            : cartQty > 0
              ? 'border-brand-pink bg-brand-pink/5'
              : 'border-brand-pink/20 bg-white hover:border-brand-pink/50 active:bg-brand-pink/10'
        }
      `}
      style={{
        WebkitTapHighlightColor: 'transparent',
        WebkitUserSelect: 'none',
        userSelect: 'none',
      }}
    >
      {cartQty > 0 && (
        <span className="absolute -top-1.5 -left-1.5 bg-brand-pink text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none min-w-[18px] text-center">
          {cartQty}
        </span>
      )}
      {product.stock > 0 && product.stock <= 3 && (
        <span className="absolute -top-1.5 -right-1.5 bg-red-400 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">
          {product.stock}
        </span>
      )}

      {product.image_url ? (
        <img
          src={product.image_url}
          alt={product.name}
          className="w-10 h-10 rounded-xl object-cover mb-1"
        />
      ) : (
        <CakeSlice className="w-6 h-6 text-brand-pink mb-1" strokeWidth={1.5} />
      )}

      <span className="text-[13px] font-semibold text-brand-text leading-tight">
        {product.name}
      </span>

      <span className="text-xs text-brand-pink font-bold mt-0.5">
        RM {product.price.toFixed(2)}
      </span>

      {isOutOfStock ? (
        <span className="text-[10px] text-red-400 font-medium mt-0.5">
          Sold out
        </span>
      ) : (
        <span className={`text-[10px] font-medium mt-0.5 ${product.stock <= 3 ? 'text-red-400' : 'text-brand-text/30'}`}>
          {product.stock} pcs
        </span>
      )}
    </button>
  )
}
