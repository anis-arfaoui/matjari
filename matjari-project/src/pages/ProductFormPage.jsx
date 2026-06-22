import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ImagePlus, Plus, Trash2, X } from 'lucide-react'
import {
  createProduct,
  getProductWithDetails,
  setProductOptions,
  setProductVariants,
  updateProduct,
} from '../services/products'
import { createSlug, isValidSlug } from '../utils/slug'

const MAX_IMAGE_SIZE = 5 * 1024 * 1024
const IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp']

export function ProductFormPage({ store }) {
  const { productId } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(productId)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [slug, setSlug] = useState('')
  const [currentPrice, setCurrentPrice] = useState('')
  const [oldPrice, setOldPrice] = useState('')
  const [status, setStatus] = useState('active')
  const [mainImageFile, setMainImageFile] = useState(null)
  const [mainImagePreview, setMainImagePreview] = useState('')
  const [existingAdditionalImages, setExistingAdditionalImages] = useState([])
  const [additionalImageFiles, setAdditionalImageFiles] = useState([])
  const [additionalImagePreviews, setAdditionalImagePreviews] = useState([])
  const [removedAdditionalImagePaths, setRemovedAdditionalImagePaths] = useState([])
  const [options, setOptions] = useState([])
  const [variants, setVariants] = useState([])
  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let mounted = true

    async function loadProduct() {
      if (!isEdit || !productId) {
        return
      }

      try {
        const product = await getProductWithDetails(productId)
        if (!mounted) {
          return
        }

        setTitle(product.title || '')
        setDescription(product.description || '')
        setSlug(product.slug || '')
        setCurrentPrice(product.current_price ?? '')
        setOldPrice(product.old_price ?? '')
        setStatus(product.status || 'active')
        setMainImagePreview(product.main_image_url || '')
        setExistingAdditionalImages(Array.isArray(product.additional_images) ? product.additional_images : [])

        const loadedOptions = (product.options || []).map((option) => ({
          id: option.id,
          name: option.name,
          values: option.values || [],
        }))
        setOptions(loadedOptions)

        const loadedVariants = (product.variants || []).map((variant) => ({
          option_values: variant.option_values || {},
          current_price: variant.current_price ?? '',
          old_price: variant.old_price ?? '',
          image_url: variant.image_url || null,
          image_path: variant.image_path || null,
          imageFile: null,
          imagePreview: variant.image_url || '',
        }))
        setVariants(loadedVariants)
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

    loadProduct()

    return () => {
      mounted = false
    }
  }, [isEdit, productId])

  function handleTitleChange(event) {
    const nextTitle = event.target.value
    setTitle(nextTitle)
    if (!isEdit) {
      setSlug(createSlug(nextTitle))
    }
  }

  function handleSlugChange(event) {
    setSlug(createSlug(event.target.value))
  }

  function handleMainImageChange(event) {
    const file = event.target.files?.[0]
    setError('')

    if (!file) {
      return
    }

    if (!IMAGE_TYPES.includes(file.type)) {
      setError('Upload a PNG, JPG, or WEBP image.')
      return
    }

    if (file.size > MAX_IMAGE_SIZE) {
      setError('Image must be smaller than 5 MB.')
      return
    }

    setMainImageFile(file)
    setMainImagePreview(URL.createObjectURL(file))
  }

  function handleAdditionalImagesChange(event) {
    const files = Array.from(event.target.files || [])
    const validFiles = []
    const previews = []

    for (const file of files) {
      if (!IMAGE_TYPES.includes(file.type)) {
        setError('Upload PNG, JPG, or WEBP images only.')
        continue
      }
      if (file.size > MAX_IMAGE_SIZE) {
        setError('Each image must be smaller than 5 MB.')
        continue
      }
      validFiles.push(file)
      previews.push(URL.createObjectURL(file))
    }

    setAdditionalImageFiles((prev) => [...prev, ...validFiles])
    setAdditionalImagePreviews((prev) => [...prev, ...previews])
  }

  function removeExistingAdditionalImage(path) {
    setExistingAdditionalImages((prev) => prev.filter((item) => item.path !== path))
    setRemovedAdditionalImagePaths((prev) => [...prev, path])
  }

  function removeNewAdditionalImage(index) {
    setAdditionalImageFiles((prev) => prev.filter((_, i) => i !== index))
    setAdditionalImagePreviews((prev) => prev.filter((_, i) => i !== index))
  }

  function addOption() {
    const nextOptions = [...options, { name: '', values: [] }]
    setOptions(nextOptions)
    regenerateVariants(nextOptions, variants)
  }

  function removeOption(index) {
    const nextOptions = options.filter((_, i) => i !== index)
    setOptions(nextOptions)
    regenerateVariants(nextOptions, variants)
  }

  function updateOptionName(index, name) {
    const nextOptions = options.map((option, i) =>
      i === index ? { ...option, name } : option
    )
    setOptions(nextOptions)
    regenerateVariants(nextOptions, variants)
  }

  function addOptionValue(index, value) {
    const trimmed = value.trim()
    if (!trimmed) {
      return
    }

    const nextOptions = options.map((option, i) => {
      if (i !== index) {
        return option
      }
      if (option.values.includes(trimmed)) {
        return option
      }
      return { ...option, values: [...option.values, trimmed] }
    })
    setOptions(nextOptions)
    regenerateVariants(nextOptions, variants)
  }

  function removeOptionValue(optionIndex, valueIndex) {
    const nextOptions = options.map((option, i) => {
      if (i !== optionIndex) {
        return option
      }
      return {
        ...option,
        values: option.values.filter((_, vi) => vi !== valueIndex),
      }
    })
    setOptions(nextOptions)
    regenerateVariants(nextOptions, variants)
  }

  function regenerateVariants(nextOptions, currentVariants) {
    const combinations = generateCombinations(nextOptions)

    const nextVariants = combinations.map((combo) => {
      const existing = currentVariants.find((variant) =>
        Object.keys(combo).every(
          (key) => variant.option_values[key] === combo[key]
        )
      )

      return {
        option_values: combo,
        current_price: existing?.current_price ?? '',
        old_price: existing?.old_price ?? '',
        image_url: existing?.image_url || null,
        image_path: existing?.image_path || null,
        imageFile: existing?.imageFile || null,
        imagePreview: existing?.imagePreview || '',
      }
    })

    setVariants(nextVariants)
  }

  function updateVariant(index, updates) {
    setVariants((prev) =>
      prev.map((variant, i) => (i === index ? { ...variant, ...updates } : variant))
    )
  }

  function handleVariantImageChange(index, event) {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }

    if (!IMAGE_TYPES.includes(file.type)) {
      setError('Upload a PNG, JPG, or WEBP image for variants.')
      return
    }

    if (file.size > MAX_IMAGE_SIZE) {
      setError('Variant image must be smaller than 5 MB.')
      return
    }

    updateVariant(index, { imageFile: file, imagePreview: URL.createObjectURL(file) })
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')

    if (!title.trim()) {
      setError('Title is required.')
      return
    }

    if (!slug || !isValidSlug(slug)) {
      setError('Use a valid slug: lowercase letters, numbers, and hyphens.')
      return
    }

    if (currentPrice === '' || Number(currentPrice) < 0) {
      setError('Current price is required.')
      return
    }

    setSaving(true)

    try {
      const cleanOptions = options.filter(
        (option) => option.name.trim() && option.values.length > 0
      )

      const cleanVariants = variants.map((variant) => ({
        option_values: variant.option_values,
        current_price: variant.current_price || null,
        old_price: variant.old_price || null,
        image_url: variant.image_url,
        image_path: variant.image_path,
        imageFile: variant.imageFile,
      }))

      if (isEdit) {
        await updateProduct(productId, {
          title: title.trim(),
          description: description.trim(),
          currentPrice: Number(currentPrice),
          oldPrice: oldPrice ? Number(oldPrice) : null,
          status,
          mainImageFile,
          additionalImageFiles,
          removedAdditionalImagePaths,
        })
        await setProductOptions(productId, cleanOptions)
        await setProductVariants(productId, cleanVariants)
      } else {
        const product = await createProduct({
          storeId: store.id,
          title: title.trim(),
          description: description.trim(),
          currentPrice: Number(currentPrice),
          oldPrice: oldPrice ? Number(oldPrice) : null,
          status,
          mainImageFile,
          providedSlug: slug,
        })
        await setProductOptions(product.id, cleanOptions)
        await setProductVariants(product.id, cleanVariants)
      }

      navigate('/products')
    } catch (submitError) {
      if (submitError.code === '23505') {
        setError('This product slug is already used in your store.')
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
        Create a store before adding products.
      </div>
    )
  }

  if (loading) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-500">
        Loading product...
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#0f3d3e]">
          Products
        </p>
        <h1 className="mt-2 text-2xl font-semibold sm:text-3xl">
          {isEdit ? 'Edit product' : 'Create product'}
        </h1>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <form className="space-y-6" onSubmit={handleSubmit}>
        <section className="rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="mb-4 text-sm font-semibold text-slate-900">Basic information</h2>
          <div className="grid gap-6 lg:grid-cols-[200px_1fr]">
            <label className="flex aspect-square cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 text-center text-sm text-slate-500 transition hover:border-[#0f3d3e] hover:bg-emerald-50/60">
              {mainImagePreview ? (
                <img
                  className="h-full w-full rounded-lg object-cover"
                  src={mainImagePreview}
                  alt=""
                />
              ) : (
                <>
                  <ImagePlus className="mb-3 text-slate-400" size={34} />
                  <span className="font-medium text-slate-700">Main image</span>
                  <span className="mt-1 text-xs">PNG, JPG, WEBP</span>
                </>
              )}
              <input
                className="sr-only"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={handleMainImageChange}
              />
            </label>

            <div className="space-y-4">
              <label className="block">
                <span className="text-sm font-medium text-slate-700">Title</span>
                <input
                  className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-[#0f3d3e] focus:ring-4 focus:ring-emerald-900/10"
                  type="text"
                  value={title}
                  onChange={handleTitleChange}
                  required
                  maxLength={120}
                />
              </label>

              <label className="block">
                <span className="text-sm font-medium text-slate-700">Slug</span>
                <input
                  className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-[#0f3d3e] focus:ring-4 focus:ring-emerald-900/10"
                  type="text"
                  value={slug}
                  onChange={handleSlugChange}
                  required
                />
                <p className="mt-1 text-xs text-slate-500">
                  Auto-generated from the title. Used in the product link.
                </p>
              </label>

              <label className="block">
                <span className="text-sm font-medium text-slate-700">Description</span>
                <textarea
                  className="mt-2 min-h-[120px] w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-[#0f3d3e] focus:ring-4 focus:ring-emerald-900/10"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  rows={4}
                />
              </label>
            </div>
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="mb-4 text-sm font-semibold text-slate-900">Additional images</h2>
          <p className="mb-4 text-xs text-slate-500">
            Customers can switch between these images on the product page.
          </p>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {existingAdditionalImages.map((image) => (
              <div
                key={image.path}
                className="group relative aspect-square overflow-hidden rounded-lg border border-slate-200 bg-slate-50"
              >
                <img
                  className="h-full w-full object-cover"
                  src={image.url}
                  alt=""
                />
                <button
                  className="absolute right-2 top-2 rounded-full bg-white/90 p-1 text-red-600 shadow-sm transition hover:bg-white"
                  type="button"
                  onClick={() => removeExistingAdditionalImage(image.path)}
                >
                  <X size={14} />
                </button>
              </div>
            ))}

            {additionalImagePreviews.map((preview, index) => (
              <div
                key={preview}
                className="group relative aspect-square overflow-hidden rounded-lg border border-slate-200 bg-slate-50"
              >
                <img
                  className="h-full w-full object-cover"
                  src={preview}
                  alt=""
                />
                <button
                  className="absolute right-2 top-2 rounded-full bg-white/90 p-1 text-red-600 shadow-sm transition hover:bg-white"
                  type="button"
                  onClick={() => removeNewAdditionalImage(index)}
                >
                  <X size={14} />
                </button>
              </div>
            ))}

            <label className="flex aspect-square cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 text-center text-sm text-slate-500 transition hover:border-[#0f3d3e] hover:bg-emerald-50/60">
              <ImagePlus className="mb-2 text-slate-400" size={28} />
              <span className="text-xs font-medium">Add images</span>
              <input
                className="sr-only"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                multiple
                onChange={handleAdditionalImagesChange}
              />
            </label>
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="mb-4 text-sm font-semibold text-slate-900">Pricing</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Current price (DZD)</span>
              <input
                className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-[#0f3d3e] focus:ring-4 focus:ring-emerald-900/10"
                type="number"
                min={0}
                step={0.01}
                value={currentPrice}
                onChange={(event) => setCurrentPrice(event.target.value)}
                required
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Old price (DZD)</span>
              <input
                className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-[#0f3d3e] focus:ring-4 focus:ring-emerald-900/10"
                type="number"
                min={0}
                step={0.01}
                value={oldPrice}
                onChange={(event) => setOldPrice(event.target.value)}
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Status</span>
              <select
                className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-[#0f3d3e] focus:ring-4 focus:ring-emerald-900/10"
                value={status}
                onChange={(event) => setStatus(event.target.value)}
              >
                <option value="active">Active</option>
                <option value="draft">Draft</option>
              </select>
            </label>
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">Options</h2>
            <button
              className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-[#0f3d3e] hover:text-[#0f3d3e]"
              type="button"
              onClick={addOption}
            >
              <Plus size={14} />
              Add option
            </button>
          </div>

          {options.length === 0 ? (
            <p className="text-sm text-slate-500">
              No options. Add options like Color or Size to generate variants.
            </p>
          ) : (
            <div className="space-y-4">
              {options.map((option, optionIndex) => (
                <div
                  key={optionIndex}
                  className="rounded-md border border-slate-200 p-4"
                >
                  <div className="mb-3 flex items-center gap-3">
                    <input
                      className="min-w-0 flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-[#0f3d3e] focus:ring-4 focus:ring-emerald-900/10"
                      type="text"
                      placeholder="Option name (e.g. Color)"
                      value={option.name}
                      onChange={(event) =>
                        updateOptionName(optionIndex, event.target.value)
                      }
                    />
                    <button
                      className="inline-flex items-center gap-1 rounded-md border border-red-200 px-3 py-2 text-xs font-medium text-red-600 transition hover:bg-red-50"
                      type="button"
                      onClick={() => removeOption(optionIndex)}
                    >
                      <Trash2 size={14} />
                      <span className="hidden sm:inline">Remove</span>
                    </button>
                  </div>

                  <OptionValueInput
                    values={option.values}
                    onAdd={(value) => addOptionValue(optionIndex, value)}
                    onRemove={(valueIndex) =>
                      removeOptionValue(optionIndex, valueIndex)
                    }
                  />
                </div>
              ))}
            </div>
          )}
        </section>

        {variants.length > 0 && (
          <section className="rounded-lg border border-slate-200 bg-white p-5">
            <h2 className="mb-4 text-sm font-semibold text-slate-900">
              Variants
            </h2>
            <p className="mb-4 text-xs text-slate-500">
              Leave price empty to use the product price. Leave image empty to use the main product image.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px] text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-3 py-2 font-medium">Variant</th>
                    <th className="px-3 py-2 font-medium">Current price</th>
                    <th className="px-3 py-2 font-medium">Old price</th>
                    <th className="px-3 py-2 font-medium">Image</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {variants.map((variant, index) => (
                    <tr key={index}>
                      <td className="px-3 py-2 align-top">
                        <span className="font-medium text-slate-900">
                          {formatVariantLabel(variant.option_values)}
                        </span>
                      </td>
                      <td className="px-3 py-2 align-top">
                        <input
                          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-[#0f3d3e] focus:ring-4 focus:ring-emerald-900/10"
                          type="number"
                          min={0}
                          step={0.01}
                          placeholder={currentPrice}
                          value={variant.current_price}
                          onChange={(event) =>
                            updateVariant(index, { current_price: event.target.value })
                          }
                        />
                      </td>
                      <td className="px-3 py-2 align-top">
                        <input
                          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-[#0f3d3e] focus:ring-4 focus:ring-emerald-900/10"
                          type="number"
                          min={0}
                          step={0.01}
                          value={variant.old_price}
                          onChange={(event) =>
                            updateVariant(index, { old_price: event.target.value })
                          }
                        />
                      </td>
                      <td className="px-3 py-2 align-top">
                        <label className="flex cursor-pointer items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-xs text-slate-600 transition hover:border-[#0f3d3e] hover:text-[#0f3d3e]">
                          <ImagePlus size={14} />
                          {variant.imagePreview ? 'Replace image' : 'Add image'}
                          <input
                            className="sr-only"
                            type="file"
                            accept="image/png,image/jpeg,image/webp"
                            onChange={(event) => handleVariantImageChange(index, event)}
                          />
                        </label>
                        {variant.imagePreview && (
                          <img
                            className="mt-2 h-16 w-16 rounded-md object-cover"
                            src={variant.imagePreview}
                            alt=""
                          />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        <div className="flex items-center gap-3">
          <button
            className="rounded-md bg-[#0f3d3e] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#155153] disabled:cursor-not-allowed disabled:opacity-60"
            type="submit"
            disabled={saving}
          >
            {saving
              ? 'Saving...'
              : isEdit
                ? 'Update product'
                : 'Create product'}
          </button>
          <button
            className="rounded-md border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            type="button"
            onClick={() => navigate('/products')}
            disabled={saving}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}

function OptionValueInput({ values, onAdd, onRemove }) {
  const [inputValue, setInputValue] = useState('')

  function handleAdd() {
    onAdd(inputValue)
    setInputValue('')
  }

  function handleKeyDown(event) {
    if (event.key === 'Enter') {
      event.preventDefault()
      handleAdd()
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input
          className="min-w-0 flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-[#0f3d3e] focus:ring-4 focus:ring-emerald-900/10"
          type="text"
          placeholder="Add a value (e.g. Red)"
          value={inputValue}
          onChange={(event) => setInputValue(event.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button
          className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 transition hover:border-[#0f3d3e] hover:text-[#0f3d3e]"
          type="button"
          onClick={handleAdd}
        >
          <Plus size={14} />
          Add
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {values.map((value, index) => (
          <span
            key={index}
            className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700"
          >
            {value}
            <button
              className="text-slate-400 hover:text-slate-600"
              type="button"
              onClick={() => onRemove(index)}
            >
              <X size={12} />
            </button>
          </span>
        ))}
      </div>
    </div>
  )
}

function generateCombinations(options) {
  const activeOptions = options.filter(
    (option) => option.name.trim() && option.values.length > 0
  )

  if (activeOptions.length === 0) {
    return []
  }

  const result = []

  function combine(index, current) {
    if (index === activeOptions.length) {
      result.push({ ...current })
      return
    }

    const option = activeOptions[index]
    for (const value of option.values) {
      current[option.name] = value
      combine(index + 1, current)
    }
  }

  combine(0, {})
  return result
}

function formatVariantLabel(optionValues) {
  return Object.values(optionValues).join(' / ')
}
