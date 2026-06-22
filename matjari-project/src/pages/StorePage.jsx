import { useMemo, useState } from 'react'
import { ExternalLink, ImagePlus, Lock } from 'lucide-react'
import { createStore } from '../services/stores'
import { createSlug, isValidSlug } from '../utils/slug'

const MAX_LOGO_SIZE = 2 * 1024 * 1024
const LOGO_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']

export function StorePage({ onStoreCreated, store, storeLoading, user }) {
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [logoFile, setLogoFile] = useState(null)
  const [logoPreview, setLogoPreview] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const storeUrl = useMemo(() => {
    if (!store?.slug) {
      return ''
    }

    return `${window.location.origin}/s/${store.slug}`
  }, [store?.slug])

  function handleNameChange(event) {
    const nextName = event.target.value
    setName(nextName)
    setSlug(createSlug(nextName))
  }

  function handleSlugChange(event) {
    setSlug(createSlug(event.target.value))
  }

  function handleLogoChange(event) {
    const file = event.target.files?.[0]
    setError('')

    if (!file) {
      setLogoFile(null)
      setLogoPreview('')
      return
    }

    if (!LOGO_TYPES.includes(file.type)) {
      setError('Upload a PNG, JPG, WEBP, or SVG logo.')
      return
    }

    if (file.size > MAX_LOGO_SIZE) {
      setError('Logo must be smaller than 2 MB.')
      return
    }

    setLogoFile(file)
    setLogoPreview(URL.createObjectURL(file))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')

    if (!isValidSlug(slug)) {
      setError('Use lowercase letters, numbers, and hyphens for the store link.')
      return
    }

    setSubmitting(true)

    try {
      const nextStore = await createStore({
        userId: user.id,
        name: name.trim(),
        slug,
        logoFile,
      })
      onStoreCreated(nextStore)
    } catch (storeError) {
      if (storeError.code === '23505') {
        setError('This store link is already taken.')
      } else {
        setError(storeError.message)
      }
    } finally {
      setSubmitting(false)
    }
  }

  if (storeLoading) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-500">
        Loading store...
      </div>
    )
  }

  if (store) {
    return (
      <div className="space-y-6">
        <PageHeader eyebrow="Store" title={store.name} description={storeUrl}>
          <a
            className="inline-flex items-center gap-2 rounded-md bg-[#0f3d3e] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#155153]"
            href={storeUrl}
            target="_blank"
            rel="noreferrer"
          >
            <ExternalLink size={16} />
            View store
          </a>
        </PageHeader>
        <section className="grid gap-4 lg:grid-cols-[320px_1fr]">
          <div className="rounded-lg border border-slate-200 bg-white p-5">
            <StoreLogo logoUrl={store.logo_url} name={store.name} />
            <div className="mt-5 text-center">
              <h2 className="text-lg font-semibold">{store.name}</h2>
              <p className="mt-1 break-all text-sm text-slate-500">
                {storeUrl}
              </p>
            </div>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-5">
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-lg bg-slate-100 text-slate-500">
                <Lock size={18} />
              </span>
              <div>
                <h2 className="font-semibold">Store details are locked</h2>
                <p className="text-sm text-slate-500">
                  Products and orders will use this store identity.
                </p>
              </div>
            </div>
            <dl className="mt-6 grid gap-4 text-sm sm:grid-cols-2">
              <StoreDetail label="Store name" value={store.name} />
              <StoreDetail label="Store link" value={store.slug} />
              <StoreDetail label="Created" value={formatDate(store.created_at)} />
            </dl>
          </div>
        </section>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Store setup"
        title="Create your store"
        description="This identity will appear in your sidebar and on future product pages."
      />
      <form
        className="grid gap-6 rounded-lg border border-slate-200 bg-white p-5 lg:grid-cols-[260px_1fr]"
        onSubmit={handleSubmit}
      >
        <div>
          <label className="flex aspect-square cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 text-center text-sm text-slate-500 transition hover:border-[#0f3d3e] hover:bg-emerald-50/60">
            {logoPreview ? (
              <img
                className="h-full w-full rounded-lg object-cover"
                src={logoPreview}
                alt=""
              />
            ) : (
              <>
                <ImagePlus className="mb-3 text-slate-400" size={34} />
                <span className="font-medium text-slate-700">Upload logo</span>
                <span className="mt-1 text-xs">PNG, JPG, WEBP, SVG</span>
              </>
            )}
            <input
              className="sr-only"
              type="file"
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              onChange={handleLogoChange}
            />
          </label>
        </div>

        <div className="space-y-4">
          <label className="block">
            <span className="text-sm font-medium text-slate-700">
              Store name
            </span>
            <input
              className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-[#0f3d3e] focus:ring-4 focus:ring-emerald-900/10"
              type="text"
              value={name}
              minLength={2}
              maxLength={80}
              onChange={handleNameChange}
              required
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-slate-700">
              Store link
            </span>
            <div className="mt-2 flex rounded-md border border-slate-300 focus-within:border-[#0f3d3e] focus-within:ring-4 focus-within:ring-emerald-900/10">
              <span className="hidden items-center border-r border-slate-200 bg-slate-50 px-3 text-sm text-slate-500 sm:flex">
                {window.location.origin}/
              </span>
              <input
                className="min-w-0 flex-1 rounded-md px-3 py-2.5 text-sm outline-none"
                type="text"
                value={slug}
                onChange={handleSlugChange}
                required
              />
            </div>
          </label>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            className="rounded-md bg-[#0f3d3e] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#155153] disabled:cursor-not-allowed disabled:opacity-60"
            type="submit"
            disabled={submitting}
          >
            {submitting ? 'Creating store...' : 'Create store'}
          </button>
        </div>
      </form>
    </div>
  )
}

function StoreLogo({ logoUrl, name }) {
  return (
    <div className="mx-auto grid size-28 place-items-center overflow-hidden rounded-lg bg-emerald-50 text-3xl font-semibold text-[#0f3d3e]">
      {logoUrl ? (
        <img className="h-full w-full object-cover" src={logoUrl} alt="" />
      ) : (
        name.charAt(0).toUpperCase()
      )}
    </div>
  )
}

function StoreDetail({ label, value }) {
  return (
    <div className="rounded-md bg-slate-50 p-4">
      <dt className="font-medium text-slate-500">{label}</dt>
      <dd className="mt-1 break-all font-semibold text-slate-950">{value}</dd>
    </div>
  )
}

function PageHeader({ eyebrow, title, description, children }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#0f3d3e]">
          {eyebrow}
        </p>
        <h1 className="mt-2 text-2xl font-semibold sm:text-3xl">{title}</h1>
        <p className="mt-2 max-w-2xl break-all text-sm text-slate-500">
          {description}
        </p>
      </div>
      {children && <div className="shrink-0">{children}</div>}
    </div>
  )
}

function formatDate(value) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
  }).format(new Date(value))
}
