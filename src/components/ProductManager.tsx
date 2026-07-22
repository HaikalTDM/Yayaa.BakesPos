'use client'

import { useState, useRef } from 'react'
import { Pencil, Trash2, Plus, Check, X, Package, Camera } from 'lucide-react'
import { addProduct, updateProduct, deleteProduct } from '@/lib/db'
import { compressImage } from '@/lib/image'
import type { Product } from '@/lib/types'

type Props = {
  products: Product[]
  onRefresh: () => void
  showToast: (msg: string) => void
}

export default function ProductManager({ products, onRefresh, showToast }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editPrice, setEditPrice] = useState('')
  const [editStock, setEditStock] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [newName, setNewName] = useState('')
  const [newPrice, setNewPrice] = useState('')
  const [newStock, setNewStock] = useState('')
  const [newCategory, setNewCategory] = useState('')
  const [newImage, setNewImage] = useState<string | null>(null)
  const [editImage, setEditImage] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const newFileRef = useRef<HTMLInputElement>(null)
  const editFileRef = useRef<HTMLInputElement>(null)

  const startEdit = (p: Product) => {
    setEditingId(p.id)
    setEditName(p.name)
    setEditPrice(p.price.toString())
    setEditStock(p.stock.toString())
    setEditImage(p.image_url)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditImage(null)
  }

  const saveEdit = async (id: string) => {
    const price = parseFloat(editPrice)
    const stock = parseInt(editStock)
    if (!editName.trim() || isNaN(price) || price < 0 || isNaN(stock) || stock < 0) return
    const ok = await updateProduct(id, { name: editName.trim(), price, stock, image_url: editImage })
    if (ok) {
      showToast('Product updated')
      onRefresh()
      setEditingId(null)
    } else {
      showToast('Update failed')
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return
    const ok = await deleteProduct(id)
    if (ok) {
      showToast(`${name} deleted`)
      onRefresh()
    } else {
      showToast('Delete failed')
    }
  }

  const handleAdd = async () => {
    const price = parseFloat(newPrice)
    const stock = parseInt(newStock) || 0
    if (!newName.trim() || isNaN(price) || price < 0) return
    const product = await addProduct(newName.trim(), price, stock, newCategory.trim() || 'Dessert', newImage ?? undefined)
    if (product) {
      showToast('Product added')
      onRefresh()
      setShowAdd(false)
      setNewName('')
      setNewPrice('')
      setNewStock('')
      setNewCategory('')
      setNewImage(null)
    } else {
      showToast('Add failed')
    }
  }

  const handleImagePick = async (e: React.ChangeEvent<HTMLInputElement>, isNew: boolean) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const compressed = await compressImage(file)
    if (compressed) {
      if (isNew) setNewImage(compressed)
      else setEditImage(compressed)
    }
    setUploading(false)
    if (e.target) e.target.value = ''
  }

  return (
    <div className="p-4 pb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-extrabold text-brand-text">
          Manage Products
        </h2>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-pink text-white text-sm font-bold active:bg-brand-pink/80 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" strokeWidth={2.5} />
          Add Item
        </button>
      </div>

      {showAdd && (
        <div className="bg-white rounded-2xl border-2 border-brand-pink/30 p-4 mb-4 space-y-3">
          <p className="text-sm font-bold text-brand-text">New Product</p>
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Product name"
            className="w-full px-3 py-2.5 rounded-xl border-2 border-brand-pink/20 bg-brand-bg text-sm font-medium text-brand-text placeholder:text-brand-text/30 focus:outline-none focus:border-brand-pink"
          />
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-[10px] font-semibold text-brand-text/50 block mb-1">Price</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-brand-text/40">RM</span>
                <input
                  type="number"
                  inputMode="decimal"
                  value={newPrice}
                  onChange={(e) => setNewPrice(e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-10 pr-3 py-2.5 rounded-xl border-2 border-brand-pink/20 bg-brand-bg text-sm font-medium text-brand-text placeholder:text-brand-text/30 focus:outline-none focus:border-brand-pink"
                />
              </div>
            </div>
            <div className="flex-1">
              <label className="text-[10px] font-semibold text-brand-text/50 block mb-1">Stock</label>
              <div className="relative">
                <input
                  type="number"
                  inputMode="numeric"
                  value={newStock}
                  onChange={(e) => setNewStock(e.target.value)}
                  placeholder="0"
                  className="w-full pr-12 pl-3 py-2.5 rounded-xl border-2 border-brand-pink/20 bg-brand-bg text-sm font-medium text-brand-text placeholder:text-brand-text/30 focus:outline-none focus:border-brand-pink"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-brand-text/40">pcs</span>
              </div>
            </div>
          </div>
          <input
            type="text"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            placeholder="Category (e.g. Tarts)"
            className="w-full px-3 py-2.5 rounded-xl border-2 border-brand-pink/20 bg-brand-bg text-sm font-medium text-brand-text placeholder:text-brand-text/30 focus:outline-none focus:border-brand-pink"
          />

          <input
            ref={newFileRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={(e) => handleImagePick(e, true)}
            className="hidden"
          />
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => newFileRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border-2 border-dashed border-brand-pink/30 text-brand-pink text-xs font-semibold active:bg-brand-pink/5 transition-colors disabled:opacity-50"
            >
              <Camera className="w-4 h-4" strokeWidth={1.5} />
              {uploading ? 'Compressing...' : newImage ? 'Change Photo' : 'Add Photo'}
            </button>
            {newImage && (
              <div className="relative">
                <img src={newImage} alt="Preview" className="w-10 h-10 rounded-lg object-cover" />
                <button
                  type="button"
                  onClick={() => setNewImage(null)}
                  className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-400 text-white rounded-full flex items-center justify-center"
                >
                  <X className="w-2.5 h-2.5" strokeWidth={3} />
                </button>
              </div>
            )}
          </div>

          <div className="flex gap-2 pt-1">
            <button
              onClick={() => setShowAdd(false)}
              className="flex-1 py-2.5 rounded-xl border-2 border-brand-pink/20 text-brand-text/50 font-semibold text-sm active:bg-brand-bg"
            >
              Cancel
            </button>
            <button
              onClick={handleAdd}
              className="flex-1 py-2.5 rounded-xl bg-brand-pink text-white font-bold text-sm active:bg-brand-pink/80"
            >
              Save Product
            </button>
          </div>
        </div>
      )}

      {products.length === 0 ? (
        <div className="text-center py-12">
          <Package className="w-10 h-10 text-brand-pink/20 mx-auto mb-3" strokeWidth={1.5} />
          <p className="text-sm text-brand-text/40 font-medium">No products yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {products.map((product) => (
            <div
              key={product.id}
              className="bg-white rounded-2xl border border-brand-pink/10 px-4 py-3"
            >
              {editingId === product.id ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    {editImage ? (
                      <img src={editImage} alt="" className="w-12 h-12 rounded-xl object-cover" />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-brand-bg flex items-center justify-center">
                        <Camera className="w-5 h-5 text-brand-text/20" strokeWidth={1.5} />
                      </div>
                    )}
                    <input
                      ref={editFileRef}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={(e) => handleImagePick(e, false)}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => editFileRef.current?.click()}
                      disabled={uploading}
                      className="text-xs font-semibold text-brand-pink active:opacity-70 disabled:opacity-50"
                    >
                      {uploading ? 'Compressing...' : editImage ? 'Change' : 'Add photo'}
                    </button>
                  </div>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border-2 border-brand-pink/30 bg-brand-bg text-sm font-semibold text-brand-text focus:outline-none focus:border-brand-pink"
                  />
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-brand-text/40">RM</span>
                      <input
                        type="number"
                        inputMode="decimal"
                        value={editPrice}
                        onChange={(e) => setEditPrice(e.target.value)}
                        className="w-full pl-10 pr-3 py-2 rounded-xl border-2 border-brand-pink/20 bg-brand-bg text-sm font-medium text-brand-text focus:outline-none focus:border-brand-pink"
                        placeholder="Price"
                      />
                    </div>
                    <div className="relative w-24">
                      <input
                        type="number"
                        inputMode="numeric"
                        value={editStock}
                        onChange={(e) => setEditStock(e.target.value)}
                        className="w-full pr-11 pl-3 py-2 rounded-xl border-2 border-brand-pink/20 bg-brand-bg text-sm font-medium text-brand-text focus:outline-none focus:border-brand-pink"
                        placeholder="Stock"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-brand-text/40">pcs</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={cancelEdit}
                      className="flex-1 py-2 rounded-xl border-2 border-red-200 text-red-500 font-semibold text-xs flex items-center justify-center gap-1 active:bg-red-50"
                    >
                      <X className="w-3.5 h-3.5" strokeWidth={2.5} />
                      Cancel
                    </button>
                    <button
                      onClick={() => saveEdit(product.id)}
                      className="flex-1 py-2 rounded-xl bg-brand-pink text-white font-bold text-xs flex items-center justify-center gap-1 active:bg-brand-pink/80"
                    >
                      <Check className="w-3.5 h-3.5" strokeWidth={2.5} />
                      Save
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {product.image_url ? (
                      <img src={product.image_url} alt="" className="w-9 h-9 rounded-lg object-cover shrink-0" />
                    ) : (
                      <div className="w-9 h-9 rounded-lg bg-brand-bg flex items-center justify-center shrink-0">
                        <Camera className="w-4 h-4 text-brand-text/15" strokeWidth={1.5} />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-brand-text truncate">
                        {product.name}
                      </p>
                      <p className="text-xs text-brand-text/40">
                        RM {product.price.toFixed(2)} &middot; {product.stock} pcs &middot; {product.category}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 ml-3">
                    <button
                      onClick={() => startEdit(product)}
                      className="w-8 h-8 rounded-lg bg-brand-bg text-brand-text/50 flex items-center justify-center active:bg-brand-pink/20 active:text-brand-pink transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5" strokeWidth={2} />
                    </button>
                    <button
                      onClick={() => handleDelete(product.id, product.name)}
                      className="w-8 h-8 rounded-lg bg-red-50 text-red-400 flex items-center justify-center active:bg-red-100 active:text-red-600 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" strokeWidth={2} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
