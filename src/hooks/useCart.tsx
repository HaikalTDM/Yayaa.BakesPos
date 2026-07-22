'use client'

import { createContext, useContext, useReducer, type Dispatch } from 'react'
import type { CartItem, CartAction, Product } from '@/lib/types'

function cartReducer(state: CartItem[], action: CartAction): CartItem[] {
  switch (action.type) {
    case 'ADD_ITEM': {
      const existing = state.find((i) => i.product_id === action.product.id)
      if (existing) {
        if (existing.quantity >= existing.stock) return state
        return state.map((i) =>
          i.product_id === action.product.id
            ? { ...i, quantity: i.quantity + 1 }
            : i,
        )
      }
      return [
        ...state,
        {
          product_id: action.product.id,
          name: action.product.name,
          price: action.product.price,
          quantity: 1,
          stock: action.product.stock,
        },
      ]
    }
    case 'REMOVE_ITEM':
      return state.filter((i) => i.product_id !== action.product_id)
    case 'INCREMENT':
      return state.map((i) =>
        i.product_id === action.product_id
          ? i.quantity < i.stock
            ? { ...i, quantity: i.quantity + 1 }
            : i
          : i,
      )
    case 'DECREMENT':
      return state
        .map((i) =>
          i.product_id === action.product_id
            ? { ...i, quantity: i.quantity - 1 }
            : i,
        )
        .filter((i) => i.quantity > 0)
    case 'CLEAR':
      return []
    default:
      return state
  }
}

const CartContext = createContext<{
  cart: CartItem[]
  dispatch: Dispatch<CartAction>
} | null>(null)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, dispatch] = useReducer(cartReducer, [])

  return (
    <CartContext.Provider value={{ cart, dispatch }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
