import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Check, Minus, PackageOpen, Plus, ShoppingCart } from 'lucide-react'
import { getProductBySlug, getProductWithDetails, createOrder } from '../services/products'
import { getStoreBySlug } from '../services/stores'
import { COMMUNES_BY_WILAYA, WILAYAS } from '../lib/algeriaLocations'

export function PublicProductPage() {
  const { storeSlug, productSlug } = useParams()
  const [store, setStore] = useState(null)
  const [product, setProduct] = useState(null)
  const [options, setOptions] = useState([])
  const [variants, setVariants] = useState([])
  const [selectedOptions, setSelectedOptions] = useState({})
  const [quantity, setQuantity] = useState(1)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  const [customerName, setCustomerName] = useState('')
  const [phone, setPhone] = useState('')
  const [wilayaCode, setWilayaCode] = useState('')
  const [baladiya, setBaladiya] = useState('')
  const [deliveryMethod, setDeliveryMethod] = useState('home')

  const wilaya = useMemo(
    () => WILAYAS.find((w) => w.code === wilayaCode),
    [wilayaCode]
  )
  const communes = useMemo(
    () => COMMUNES_BY_WILAYA[wilayaCode] || [],
    [wilayaCode]
  )

  useEffect(() => {
    let mounted = true

    async function loadData() {
      try {
        const nextStore = await getStoreBySlug(storeSlug)
        if (!mounted) {
          return
        }

        if (!nextStore) {
          setStore(null)
          setLoading(false)
          return
        }

        setStore(nextStore)

        const nextProduct = await getProductBySlug(nextStore.id, productSlug)
        if (!mounted) {
          return
        }

        if (!nextProduct) {
          setProduct(null)
          setLoading(false)
          return
        }

        setProduct(nextProduct)

        const details = await getProductWithDetails(nextProduct.id)
        if (!mounted) {
          return
        }

        setOptions(details.options || [])
        setVariants(details.variants || [])

        const initialSelection = {}
        for (const option of details.options || []) {
          if (option.values.length > 0) {
            initialSelection[option.name] = option.values[0]
          }
        }
        setSelectedOptions(initialSelection)
      } catch (dataError) {
        if (mounted) {
          setLoadError(dataError.message)
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    loadData()

    return () => {
      mounted = false
    }
  }, [storeSlug, productSlug])

  const selectedVariant = useMemo(() => {
    const optionNames = Object.keys(selectedOptions)
    if (optionNames.length === 0) {
      return variants[0] || null
    }

    return (
      variants.find((variant) =>
        optionNames.every(
          (name) => variant.option_values[name] === selectedOptions[name]
        )
      ) || null
    )
  }, [selectedOptions, variants])

  const displayPrice = useMemo(() => {
    if (selectedVariant?.current_price) {
      return selectedVariant.current_price
    }
    return product?.current_price
  }, [selectedVariant, product])

  const displayOldPrice = useMemo(() => {
    if (selectedVariant?.old_price) {
      return selectedVariant.old_price
    }
    return product?.old_price
  }, [selectedVariant, product])

  const displayImage = useMemo(() => {
    return selectedVariant?.image_url || product?.main_image_url
  }, [selectedVariant, product])

  const galleryImages = useMemo(() => {
    const images = []
    if (product?.main_image_url) {
      images.push(product.main_image_url)
    }
    for (const item of product?.additional_images || []) {
      if (item.url) {
        images.push(item.url)
      }
    }
    return images
  }, [product])

  const selectedGalleryImage = galleryImages[selectedImageIndex] || displayImage

  const totalPrice = useMemo(() => {
    const price = displayPrice || 0
    return price * quantity
  }, [displayPrice, quantity])

  const variantLabel = useMemo(() => {
    if (!selectedVariant || Object.keys(selectedVariant.option_values).length === 0) {
      return ''
    }
    return Object.values(selectedVariant.option_values).join(' / ')
  }, [selectedVariant])

  function adjustQuantity(delta) {
    setQuantity((prev) => Math.max(1, prev + delta))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setFormError('')
    setSuccess(false)

    if (!customerName.trim() || !phone.trim() || !wilayaCode || !baladiya) {
      setFormError('Please fill in all required fields.')
      return
    }

    if (!isValidAlgerianPhone(phone.trim())) {
      setFormError('Enter a valid Algerian mobile number: 10 digits starting with 05, 06, or 07.')
      return
    }

    setSubmitting(true)

    try {
      await createOrder({
        productId: product.id,
        variantId: selectedVariant?.id || null,
        customerName: customerName.trim(),
        phone: phone.trim(),
        wilayaCode,
        wilayaName: wilaya?.name || '',
        baladiya,
        deliveryMethod,
        quantity,
      })
      setSuccess(true)
    } catch (submitError) {
      setFormError(submitError.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-white text-slate-500">
        <div className="flex items-center gap-3">
          <span className="size-5 animate-spin rounded-full border-2 border-slate-200 border-t-[#0f3d3e]" />
          Loading product...
        </div>
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="grid min-h-screen place-items-center bg-white px-4 text-center">
        <div>
          <p className="text-lg font-semibold text-slate-900">Something went wrong</p>
          <p className="mt-2 max-w-md text-sm text-slate-500">{loadError}</p>
        </div>
      </div>
    )
  }

  if (!store || !product) {
    return (
      <div className="grid min-h-screen place-items-center bg-white px-4 text-center">
        <div>
          <p className="text-6xl font-semibold text-slate-200">404</p>
          <h1 className="mt-4 text-2xl font-semibold text-slate-900">
            Product not found
          </h1>
          <p className="mt-2 text-slate-500">
            This product does not exist or is not available.
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
          <a
            className="text-sm font-medium text-slate-600 hover:text-[#0f3d3e]"
            href={storeUrl}
          >
            Back to store
          </a>
        </div>
      </header>

      <main className="flex-1">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:py-16">
          <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
            <div>
              <div className="aspect-square overflow-hidden rounded-2xl bg-slate-100">
                {selectedGalleryImage ? (
                  <img
                    className="h-full w-full object-cover"
                    src={selectedGalleryImage}
                    alt={product.title}
                  />
                ) : (
                  <div className="grid h-full place-items-center text-slate-300">
                    <PackageOpen size={48} />
                  </div>
                )}
              </div>

              {galleryImages.length > 1 && (
                <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
                  {galleryImages.map((image, index) => (
                    <button
                      key={index}
                      className={[
                        'relative shrink-0 overflow-hidden rounded-lg border-2 transition',
                        index === selectedImageIndex
                          ? 'border-[#0f3d3e]'
                          : 'border-transparent hover:border-slate-300',
                      ].join(' ')}
                      type="button"
                      onClick={() => setSelectedImageIndex(index)}
                    >
                      <img
                        className="size-16 object-cover"
                        src={image}
                        alt=""
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                  {product.title}
                </h1>
                <div className="mt-4 flex items-baseline gap-3">
                  <span className="text-3xl font-semibold text-[#0f3d3e]">
                    {formatPrice(displayPrice)}
                  </span>
                  {displayOldPrice && (
                    <span className="text-xl text-slate-400 line-through">
                      {formatPrice(displayOldPrice)}
                    </span>
                  )}
                </div>
              </div>

              {product.description && (
                <p className="text-sm leading-relaxed text-slate-600">
                  {product.description}
                </p>
              )}

              {options.length > 0 && (
                <div className="space-y-4">
                  {options.map((option) => (
                    <div key={option.id}>
                      <label className="block text-sm font-medium text-slate-700">
                        {option.name}
                      </label>
                      <select
                        className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-[#0f3d3e] focus:ring-4 focus:ring-emerald-900/10"
                        value={selectedOptions[option.name] || ''}
                        onChange={(event) =>
                          setSelectedOptions((prev) => ({
                            ...prev,
                            [option.name]: event.target.value,
                          }))
                        }
                      >
                        {option.values.map((value) => (
                          <option key={value} value={value}>
                            {value}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-slate-700">Quantity</span>
                <div className="flex items-center rounded-md border border-slate-300">
                  <button
                    className="px-3 py-2 text-slate-600 hover:text-[#0f3d3e]"
                    type="button"
                    onClick={() => adjustQuantity(-1)}
                  >
                    <Minus size={16} />
                  </button>
                  <span className="min-w-[3rem] px-2 py-2 text-center text-sm font-medium">
                    {quantity}
                  </span>
                  <button
                    className="px-3 py-2 text-slate-600 hover:text-[#0f3d3e]"
                    type="button"
                    onClick={() => adjustQuantity(1)}
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>

              {success && (
                <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                  <div className="flex items-center gap-2">
                    <Check size={16} />
                    Order placed successfully. We will contact you soon.
                  </div>
                </div>
              )}

              {formError && <p className="text-sm text-red-600">{formError}</p>}

              <form className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50/50 p-5" onSubmit={handleSubmit}>
                <h2 className="flex items-center gap-2 text-lg font-semibold">
                  <ShoppingCart size={20} className="text-[#0f3d3e]" />
                  Order now
                </h2>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="text-sm font-medium text-slate-700">Full name</span>
                    <input
                      className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-[#0f3d3e] focus:ring-4 focus:ring-emerald-900/10"
                      type="text"
                      value={customerName}
                      onChange={(event) => setCustomerName(event.target.value)}
                      required
                    />
                  </label>
                  <label className="block">
                    <span className="text-sm font-medium text-slate-700">Phone number</span>
                    <input
                      className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-[#0f3d3e] focus:ring-4 focus:ring-emerald-900/10"
                      type="tel"
                      value={phone}
                      onChange={(event) => setPhone(event.target.value)}
                      required
                    />
                  </label>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="text-sm font-medium text-slate-700">Wilaya</span>
                    <select
                      className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-[#0f3d3e] focus:ring-4 focus:ring-emerald-900/10"
                      value={wilayaCode}
                      onChange={(event) => {
                        setWilayaCode(event.target.value)
                        setBaladiya('')
                      }}
                      required
                    >
                      <option value="">Select wilaya</option>
                      {WILAYAS.map((w) => (
                        <option key={w.code} value={w.code}>
                          {w.code} - {w.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block">
                    <span className="text-sm font-medium text-slate-700">Baladiya</span>
                    <select
                      className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-[#0f3d3e] focus:ring-4 focus:ring-emerald-900/10"
                      value={baladiya}
                      onChange={(event) => setBaladiya(event.target.value)}
                      required
                      disabled={!wilayaCode}
                    >
                      <option value="">Select baladiya</option>
                      {communes.map((commune) => (
                        <option key={commune.name} value={commune.name}>
                          {commune.name}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <fieldset>
                  <legend className="text-sm font-medium text-slate-700">Delivery method</legend>
                  <div className="mt-2 flex flex-wrap gap-4">
                    <label className="flex items-center gap-2 text-sm text-slate-700">
                      <input
                        className="size-4 accent-[#0f3d3e]"
                        type="radio"
                        name="deliveryMethod"
                        value="home"
                        checked={deliveryMethod === 'home'}
                        onChange={(event) => setDeliveryMethod(event.target.value)}
                      />
                      Home delivery
                    </label>
                    <label className="flex items-center gap-2 text-sm text-slate-700">
                      <input
                        className="size-4 accent-[#0f3d3e]"
                        type="radio"
                        name="deliveryMethod"
                        value="office"
                        checked={deliveryMethod === 'office'}
                        onChange={(event) => setDeliveryMethod(event.target.value)}
                      />
                      Office pickup
                    </label>
                  </div>
                </fieldset>

                <div className="rounded-md border border-slate-200 bg-white p-4 text-sm">
                  <p className="font-medium text-slate-900">Order summary</p>
                  <div className="mt-2 space-y-1 text-slate-600">
                    <p>{product.title}</p>
                    {variantLabel && <p className="text-slate-500">{variantLabel}</p>}
                    <p>Quantity: {quantity}</p>
                    <p>Unit price: {formatPrice(displayPrice)}</p>
                    <p>Delivery: {deliveryMethod === 'home' ? 'Home delivery' : 'Office pickup'}</p>
                    <p className="pt-2 text-base font-semibold text-[#0f3d3e]">
                      Total: {formatPrice(totalPrice)}
                    </p>
                  </div>
                </div>

                <button
                  className="w-full rounded-md bg-[#0f3d3e] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#155153] disabled:cursor-not-allowed disabled:opacity-60"
                  type="submit"
                  disabled={submitting}
                >
                  {submitting ? 'Placing order...' : 'Place order'}
                </button>
              </form>
            </div>
          </div>
        </div>
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

function isValidAlgerianPhone(value) {
  return /^0[5-7][0-9]{8}$/.test(value)
}

function formatPrice(value) {
  if (value === null || value === undefined) {
    return '—'
  }
  return `${Number(value).toLocaleString()} DZD`
}
