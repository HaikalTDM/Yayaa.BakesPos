'use client'

import { CakeSlice } from 'lucide-react'
import { useLongPress } from '@/hooks/useLongPress'
import { useCart } from '@/hooks/useCart'
import type { Product } from '@/lib/types'

type Props = {
  product: Product
  onAdd: (product: Product, e: React.PointerEvent<HTMLButtonElement>) => void
  onLongPress: (product: Product) => void
}

export default function ProductCard({ product, onAdd, onLongPress }: Props) {
  const { cart } = useCart()
  const isOutOfStock = product.stock <= 0
  const cartItem = cart.find((i) => i.product_id === product.id)
  const cartQty = cartItem?.quantity ?? 0

  const longPress = useLongPress(
    () => onLongPress(product),
    (e) => { if (!isOutOfStock) onAdd(product, e) },
    800,
  )

  const borderClass = isOutOfStock
    ? 'border-gray-200 bg-gray-100 opacity-50 cursor-not-allowed'
    : longPress.isPressing
      ? 'border-[#F89EAE] bg-pink-50 scale-[0.97]'
      : cartQty > 0
        ? 'border-[#F89EAE] bg-pink-50/50 hover:shadow-md'
        : 'border-pink-100 bg-white hover:border-[#F89EAE] hover:shadow-md'

  const baseClass = `relative border-2 shadow-sm transition-all duration-150 select-none touch-manipulation active:scale-[0.98] ${borderClass}`

  return (
    <>
      {/* MOBILE — old vertical compact style */}
      <button
        {...longPress}
        disabled={isOutOfStock}
        className={`md:hidden flex flex-col items-center justify-center rounded-2xl p-3 text-center ${baseClass}`}
        style={{ WebkitTapHighlightColor: 'transparent', WebkitUserSelect: 'none', userSelect: 'none' }}
      >
        {cartQty > 0 && (
          <span className="absolute -top-1.5 -left-1.5 bg-[#F89EAE] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none min-w-[18px] text-center">
            {cartQty}
          </span>
        )}
        {product.stock > 0 && product.stock <= 3 && (
          <span className="absolute -top-1.5 -right-1.5 bg-red-400 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">
            {product.stock}
          </span>
        )}
        {product.image_url ? (
          <img src={product.image_url} alt="" className="w-10 h-10 rounded-xl object-cover mb-1" />
        ) : (
          <CakeSlice className="w-6 h-6 text-[#F89EAE] mb-1" strokeWidth={1.5} />
        )}
        <span className="text-[13px] font-semibold text-[#333333] leading-tight">{product.name}</span>
        <span className="text-xs text-[#F89EAE] font-bold mt-0.5">RM {product.price.toFixed(2)}</span>
        {isOutOfStock ? (
          <span className="text-[10px] text-red-400 font-medium mt-0.5">Sold out</span>
        ) : (
          <span className={`text-[10px] font-medium mt-0.5 ${product.stock <= 3 ? 'text-red-400' : 'text-[#333333]/30'}`}>
            {product.stock} pcs
          </span>
        )}
      </button>

      {/* TABLET+ — chunky horizontal tiles */}
      <button
        {...longPress}
        disabled={isOutOfStock}
        className={`hidden md:flex items-center gap-3 rounded-2xl px-4 py-3 text-left w-full ${baseClass}`}
        style={{ WebkitTapHighlightColor: 'transparent', WebkitUserSelect: 'none', userSelect: 'none' }}
      >
        {cartQty > 0 && (
          <span className="absolute -top-2 -left-2 bg-[#F89EAE] text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center shadow-sm">
            {cartQty}
          </span>
        )}
        <div className="shrink-0">
          {product.image_url ? (
            <img src={product.image_url} alt="" className="w-12 h-12 rounded-xl object-cover" />
          ) : (
            <div className="w-12 h-12 rounded-xl bg-pink-50 flex items-center justify-center">
              <CakeSlice className="w-6 h-6 text-[#F89EAE]" strokeWidth={1.5} />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm sm:text-base font-bold text-[#333333] truncate leading-tight">{product.name}</p>
          <p className="text-sm font-extrabold text-[#F89EAE] mt-0.5">RM {product.price.toFixed(2)}</p>
        </div>
        <div className="shrink-0 flex flex-col items-end gap-1.5">
          {isOutOfStock ? (
            <span className="bg-red-100 text-red-500 text-[11px] px-2 py-0.5 rounded-full font-semibold">Sold out</span>
          ) : (
            <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${product.stock <= 3 ? 'bg-red-50 text-red-500' : 'bg-pink-50 text-[#F89EAE]'}`}>
              {product.stock} pcs
            </span>
          )}
          {product.stock > 0 && product.stock <= 3 && (
            <span className="text-[10px] text-red-400 font-bold">Low stock</span>
          )}
        </div>
      </button>
    </>
  )
}