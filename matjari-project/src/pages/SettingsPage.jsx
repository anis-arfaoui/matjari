import { useState } from 'react'
import { Globe, Trash2, Upload } from 'lucide-react'
import { isSlugAvailable, updateStore } from '../services/stores'
import { createSlug, isValidSlug } from '../utils/slug'

const MAX_LOGO_SIZE = 2 * 1024 * 1024
const LOGO_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']

const TABS = [
  { id: 'profile', label: 'Profile' },
  { id: 'domains', label: 'Domains' },
]

export function SettingsPage({ store, onStoreUpdated }) {
  const [activeTab, setActiveTab] = useState('profile')
  const [name, setName] = useState(store?.name || '')
  const [description, setDescription] = useState(store?.description || '')
  const [slug, setSlug] = useState(store?.slug || '')
  const [logoFile, setLogoFile] = useState(null)
  const [logoPreview, setLogoPreview] = useState(store?.logo_url || '')
  const [removeLogo, setRemoveLogo] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  function handleLogoChange(event) {
    const file = event.target.files?.[0]
    setError('')
    setMessage('')

    if (!file) {
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
    setRemoveLogo(false)
  }

  function handleRemoveLogo() {
    setLogoFile(null)
    setLogoPreview('')
    setRemoveLogo(true)
  }

  function handleNameChange(event) {
    setName(event.target.value)
  }

  function handleSlugChange(event) {
    setSlug(createSlug(event.target.value))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setMessage('')

    if (!store) {
      setError('Create a store before updating settings.')
      return
    }

    if (!name.trim()) {
      setError('Store name is required.')
      return
    }

    if (!isValidSlug(slug)) {
      setError('Use lowercase letters, numbers, and hyphens for the store link.')
      return
    }

    if (slug !== store.slug) {
      const available = await isSlugAvailable(slug, store.id)
      if (!available) {
        setError('This store link is already taken.')
        return
      }
    }

    setSaving(true)

    try {
      const updated = await updateStore({
        storeId: store.id,
        name: name.trim(),
        description: description.trim(),
        slug,
        logoFile,
        removeLogo,
      })

      onStoreUpdated(updated)
      setLogoFile(null)
      setRemoveLogo(false)
      setLogoPreview(updated.logo_url || '')
      setMessage('Store settings saved successfully.')
    } catch (submitError) {
      if (submitError.code === '23505') {
        setError('This store link is already taken.')
      } else {
        setError(submitError.message)
      }
    } finally {
      setSaving(false)
    }
  }

  if (!store) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-500">
        Create a store before opening settings.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#0f3d3e]">
          Settings
        </p>
        <h1 className="mt-2 text-2xl font-semibold sm:text-3xl">Store Settings</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-500">
          Manage your store identity, link, and future domain options.
        </p>
      </div>

      <div className="border-b border-slate-200">
        <nav className="-mb-px flex gap-6">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              className={[
                'border-b-2 px-1 pb-3 text-sm font-medium transition',
                activeTab === tab.id
                  ? 'border-[#0f3d3e] text-[#0f3d3e]'
                  : 'border-transparent text-slate-500 hover:text-slate-700',
              ].join(' ')}
              type="button"
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {message && (
        <p className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {message}
        </p>
      )}

      {activeTab === 'profile' && (
        <form className="space-y-6" onSubmit={handleSubmit}>
          <section className="rounded-lg border border-slate-200 bg-white p-5">
            <h2 className="mb-4 text-sm font-semibold text-slate-900">Store Identity</h2>

            <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
              <div className="shrink-0">
                <div className="relative">
                  <div className="grid size-28 place-items-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50 text-2xl font-semibold text-[#0f3d3e]">
                    {logoPreview ? (
                      <img
                        className="h-full w-full object-cover"
                        src={logoPreview}
                        alt=""
                      />
                    ) : (
                      name.charAt(0).toUpperCase() || 'M'
                    )}
                  </div>
                  {logoPreview && (
                    <button
                      className="absolute -right-2 -top-2 rounded-full bg-white p-1.5 text-red-600 shadow-sm transition hover:bg-red-50"
                      type="button"
                      onClick={handleRemoveLogo}
                      title="Remove logo"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
                <label className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-[#0f3d3e] hover:text-[#0f3d3e]">
                  <Upload size={16} />
                  Upload logo
                  <input
                    className="sr-only"
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/svg+xml"
                    onChange={handleLogoChange}
                  />
                </label>
                <p className="mt-2 text-xs text-slate-500">Recommended: 200x200px, PNG or JPG</p>
              </div>

              <div className="min-w-0 flex-1 space-y-4">
                <label className="block">
                  <span className="text-sm font-medium text-slate-700">Store Name</span>
                  <input
                    className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-[#0f3d3e] focus:ring-4 focus:ring-emerald-900/10"
                    type="text"
                    value={name}
                    onChange={handleNameChange}
                    minLength={2}
                    maxLength={80}
                    required
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-medium text-slate-700">Description</span>
                  <textarea
                    className="mt-2 min-h-[120px] w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-[#0f3d3e] focus:ring-4 focus:ring-emerald-900/10"
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    placeholder="Describe your store"
                    rows={4}
                    maxLength={500}
                  />
                  <p className="mt-1 text-xs text-slate-500">
                    Shown on your public store page. Optional.
                  </p>
                </label>
              </div>
            </div>
          </section>

          <div className="flex items-center gap-3">
            <button
              className="rounded-md bg-[#0f3d3e] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#155153] disabled:cursor-not-allowed disabled:opacity-60"
              type="submit"
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save changes'}
            </button>
          </div>
        </form>
      )}

      {activeTab === 'domains' && (
        <div className="space-y-6">
          <section className="rounded-lg border border-slate-200 bg-white p-5">
            <h2 className="mb-4 text-sm font-semibold text-slate-900">Store Subdomain</h2>
            <div className="flex items-center gap-3">
              <div className="flex flex-1 rounded-md border border-slate-300 focus-within:border-[#0f3d3e] focus-within:ring-4 focus-within:ring-emerald-900/10">
                <span className="hidden items-center border-r border-slate-200 bg-slate-50 px-3 text-sm text-slate-500 sm:flex">
                  {window.location.origin}/s/
                </span>
                <input
                  className="min-w-0 flex-1 rounded-md px-3 py-2.5 text-sm outline-none"
                  type="text"
                  value={slug}
                  onChange={handleSlugChange}
                />
              </div>
            </div>
            <p className="mt-2 text-xs text-slate-500">
              You can change it, but your old address stops working right away.
            </p>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5">
            <h2 className="mb-4 text-sm font-semibold text-slate-900">Custom domains</h2>
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/50 p-12 text-center">
              <span className="mx-auto grid size-16 place-items-center rounded-full bg-white text-slate-300 shadow-sm">
                <Globe size={28} />
              </span>
              <h3 className="mt-5 text-lg font-semibold text-slate-900">No custom domains yet</h3>
              <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
                Connect a domain you already own, like mystore.com. This feature is coming soon.
              </p>
            </div>
          </section>

          <div className="flex items-center gap-3">
            <button
              className="rounded-md bg-[#0f3d3e] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#155153] disabled:cursor-not-allowed disabled:opacity-60"
              type="button"
              disabled={saving}
              onClick={handleSubmit}
            >
              {saving ? 'Saving...' : 'Save changes'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
