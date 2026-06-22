import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { PackageOpen, Plus, Trash2, Pencil } from 'lucide-react'
import { deleteProduct, getStoreProducts } from '../services/products'

export function ProductsPage({ store }) {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let mounted = true

    async function loadProducts() {
      if (!store) {
        setLoading(false)
        return
      }

      try {
        setError('')
        const data = await getStoreProducts(store.id)
        if (mounted) {
          setProducts(data)
        }
      } catch (productError) {
        if (mounted) {
          setError(productError.message)
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    loadProducts()

    return () => {
      mounted = false
    }
  }, [store])

  async function handleDelete(productId) {
    if (!window.confirm('Delete this product? This cannot be undone.')) {
      return
    }

    try {
      await deleteProduct(productId)
      setProducts((prev) => prev.filter((product) => product.id !== productId))
    } catch (deleteError) {
      setError(deleteError.message)
    }
  }

  if (!store) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-500">
        Create a store before adding products.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#0f3d3e]">
            Products
          </p>
          <h1 className="mt-2 text-2xl font-semibold sm:text-3xl">Products</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-500">
            Manage your store catalog, prices, and visibility.
          </p>
        </div>
        <Link
          className="inline-flex items-center justify-center gap-2 rounded-md bg-[#0f3d3e] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#155153]"
          to="/products/new"
        >
          <Plus size={18} />
          Create product
        </Link>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {loading ? (
        <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-500">
          Loading products...
        </div>
      ) : products.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <span className="mx-auto grid size-16 place-items-center rounded-full bg-slate-50 text-slate-300 shadow-sm">
            <PackageOpen size={28} />
          </span>
          <h3 className="mt-5 text-lg font-semibold text-slate-900">No products yet</h3>
          <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
            Add your first product to start receiving orders.
          </p>
          <Link
            className="mt-5 inline-flex items-center gap-2 rounded-md bg-[#0f3d3e] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#155153]"
            to="/products/new"
          >
            <Plus size={18} />
            Create product
          </Link>
        </div>
      ) : (
        <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="hidden lg:block">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-4 py-3 font-medium">Product</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Price</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.map((product) => (
                  <tr key={product.id}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className="grid size-12 shrink-0 place-items-center overflow-hidden rounded-md bg-slate-100 text-slate-400">
                          {product.main_image_url ? (
                            <img
                              className="h-full w-full object-cover"
                              src={product.main_image_url}
                              alt=""
                            />
                          ) : (
                            product.title.charAt(0).toUpperCase()
                          )}
                        </span>
                        <span className="font-medium text-slate-900">{product.title}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={product.status} />
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {formatPrice(product.current_price)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <Link
                          className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-[#0f3d3e] hover:text-[#0f3d3e]"
                          to={`/products/${product.id}/edit`}
                        >
                          <Pencil size={14} />
                          Edit
                        </Link>
                        <button
                          className="inline-flex items-center gap-1 rounded-md border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50"
                          type="button"
                          onClick={() => handleDelete(product.id)}
                        >
                          <Trash2 size={14} />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="divide-y divide-slate-100 lg:hidden">
            {products.map((product) => (
              <div key={product.id} className="flex items-center gap-3 p-4">
                <span className="grid size-14 shrink-0 place-items-center overflow-hidden rounded-md bg-slate-100 text-slate-400">
                  {product.main_image_url ? (
                    <img
                      className="h-full w-full object-cover"
                      src={product.main_image_url}
                      alt=""
                    />
                  ) : (
                    product.title.charAt(0).toUpperCase()
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-slate-900">{product.title}</p>
                  <div className="mt-1 flex items-center gap-2">
                    <StatusBadge status={product.status} />
                    <span className="text-sm font-medium text-slate-900">
                      {formatPrice(product.current_price)}
                    </span>
                  </div>
                </div>
                <div className="flex shrink-0 flex-col gap-2">
                  <Link
                    className="inline-flex items-center justify-center rounded-md border border-slate-200 p-2 text-slate-700 transition hover:border-[#0f3d3e] hover:text-[#0f3d3e]"
                    to={`/products/${product.id}/edit`}
                  >
                    <Pencil size={16} />
                  </Link>
                  <button
                    className="inline-flex items-center justify-center rounded-md border border-red-200 p-2 text-red-600 transition hover:bg-red-50"
                    type="button"
                    onClick={() => handleDelete(product.id)}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function StatusBadge({ status }) {
  const isActive = status === 'active'
  return (
    <span
      className={[
        'inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium',
        isActive
          ? 'bg-emerald-100 text-emerald-700'
          : 'bg-slate-100 text-slate-600',
      ].join(' ')}
    >
      {isActive ? 'Active' : 'Draft'}
    </span>
  )
}

function formatPrice(value) {
  if (value === null || value === undefined) {
    return '—'
  }

  return `${Number(value).toLocaleString()} DZD`
}
