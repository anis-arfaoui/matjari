import { useEffect, useState } from 'react'
import { PackageOpen } from 'lucide-react'
import { useParams } from 'react-router-dom'
import { getStoreProducts } from '../services/products'
import { getStoreBySlug } from '../services/stores'

export function PublicStorePage() {
  const { storeSlug } = useParams()
  const [store, setStore] = useState(null)
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let mounted = true

    async function loadStore() {
      try {
        const nextStore = await getStoreBySlug(storeSlug)
        if (mounted) {
          setStore(nextStore)
        }

        if (nextStore) {
          const storeProducts = await getStoreProducts(nextStore.id)
          if (mounted) {
            setProducts(storeProducts.filter((product) => product.status === 'active'))
          }
        }
      } catch (storeError) {
        if (mounted) {
          setError(storeError.message)
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    loadStore()

    return () => {
      mounted = false
    }
  }, [storeSlug])

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-white text-slate-500">
        <div className="flex items-center gap-3">
          <span className="size-5 animate-spin rounded-full border-2 border-slate-200 border-t-[#0f3d3e]" />
          Opening store...
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="grid min-h-screen place-items-center bg-white px-4 text-center text-slate-500">
        <p className="max-w-md">Something went wrong while opening this store.</p>
      </div>
    )
  }

  if (!store) {
    return (
      <div className="grid min-h-screen place-items-center bg-white px-4 text-center">
        <div>
          <p className="text-6xl font-semibold text-slate-200">404</p>
          <h1 className="mt-4 text-2xl font-semibold text-slate-900">Store not found</h1>
          <p className="mt-2 text-slate-500">
            This store link does not exist or has been removed.
          </p>
        </div>
      </div>
    )
  }

  const storeUrl = `${window.location.origin}/s/${store.slug}`

  return (
    <div className="flex min-h-screen flex-col bg-white text-slate-900">
      <header className="sticky top-0 z-10 border-b border-slate-100 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <a className="flex items-center gap-3" href={storeUrl}>
            <span className="grid size-10 place-items-center overflow-hidden rounded-full bg-slate-100 text-lg font-semibold text-[#0f3d3e]">
              {store.logo_url ? (
                <img
                  className="h-full w-full object-cover"
                  src={store.logo_url}
                  alt=""
                />
              ) : (
                store.name.charAt(0).toUpperCase()
              )}
            </span>
            <span className="text-lg font-semibold tracking-tight">{store.name}</span>
          </a>
          <nav className="hidden items-center gap-6 text-sm font-medium text-slate-600 sm:flex">
            <a className="hover:text-[#0f3d3e]" href={storeUrl}>Home</a>
            <span className="hover:text-[#0f3d3e] cursor-pointer">Products</span>
            <span className="hover:text-[#0f3d3e] cursor-pointer">Contact</span>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <section className="bg-gradient-to-b from-slate-50 to-white px-4 py-16 text-center sm:py-24">
          <div className="mx-auto max-w-2xl">
            <span className="mx-auto mb-6 grid size-20 place-items-center overflow-hidden rounded-2xl bg-white shadow-sm text-3xl font-semibold text-[#0f3d3e]">
              {store.logo_url ? (
                <img
                  className="h-full w-full object-cover"
                  src={store.logo_url}
                  alt=""
                />
              ) : (
                store.name.charAt(0).toUpperCase()
              )}
            </span>
            <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
              {store.name}
            </h1>
            <p className="mx-auto mt-4 max-w-lg text-lg text-slate-500">
              Welcome to our store. We are getting our products ready for you.
            </p>
            <a
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#0f3d3e] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#155153]"
              href="#products"
            >
              Browse products
            </a>
          </div>
        </section>

        <section id="products" className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-[#0f3d3e]">
                Collection
              </p>
              <h2 className="mt-2 text-2xl font-semibold sm:text-3xl">Our products</h2>
            </div>
          </div>

          {products.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-12 text-center">
              <span className="mx-auto grid size-16 place-items-center rounded-full bg-white text-slate-300 shadow-sm">
                <PackageOpen size={28} />
              </span>
              <h3 className="mt-5 text-lg font-semibold text-slate-900">New arrivals coming soon</h3>
              <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
                This store is brand new. The seller will add products here soon, and each product will get its own order page.
              </p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((product) => (
                <a
                  key={product.id}
                  className="group overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:border-[#0f3d3e] hover:shadow-sm"
                  href={`/s/${store.slug}/${product.slug}`}
                >
                  <div className="aspect-[4/3] overflow-hidden bg-slate-100">
                    {product.main_image_url ? (
                      <img
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                        src={product.main_image_url}
                        alt={product.title}
                      />
                    ) : (
                      <div className="grid h-full place-items-center text-slate-300">
                        <PackageOpen size={32} />
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="truncate font-semibold text-slate-900">{product.title}</h3>
                    <div className="mt-2 flex items-baseline gap-2">
                      <span className="font-semibold text-[#0f3d3e]">
                        {formatPrice(product.current_price)}
                      </span>
                      {product.old_price && (
                        <span className="text-sm text-slate-400 line-through">
                          {formatPrice(product.old_price)}
                        </span>
                      )}
                    </div>
                  </div>
                </a>
              ))}
            </div>
          )}
        </section>

      </main>

      <footer className="border-t border-slate-100 bg-white py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 text-sm text-slate-500 sm:flex-row sm:px-6">
          <p>© {new Date().getFullYear()} {store.name}. All rights reserved.</p>
          <p>Powered by Matjari</p>
        </div>
      </footer>
    </div>
  )
}

function formatPrice(value) {
  if (value === null || value === undefined) {
    return '—'
  }
  return `${Number(value).toLocaleString()} DZD`
}
