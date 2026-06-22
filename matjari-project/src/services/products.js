import { supabase } from '../lib/supabase'
import { createSlug } from '../utils/slug'

const PRODUCT_IMAGES_BUCKET = 'product-images'

export async function getStoreProducts(storeId) {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('store_id', storeId)
    .order('created_at', { ascending: false })

  if (error) {
    throw error
  }

  return data || []
}

export async function getProductBySlug(storeId, slug) {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('store_id', storeId)
    .eq('slug', slug)
    .eq('status', 'active')
    .maybeSingle()

  if (error) {
    throw error
  }

  return data
}

export async function getProductWithDetails(productId) {
  const { data: product, error: productError } = await supabase
    .from('products')
    .select('*')
    .eq('id', productId)
    .single()

  if (productError) {
    throw productError
  }

  const { data: options, error: optionsError } = await supabase
    .from('product_options')
    .select('*')
    .eq('product_id', productId)
    .order('created_at', { ascending: true })

  if (optionsError) {
    throw optionsError
  }

  const { data: variants, error: variantsError } = await supabase
    .from('product_variants')
    .select('*')
    .eq('product_id', productId)
    .order('created_at', { ascending: true })

  if (variantsError) {
    throw variantsError
  }

  return {
    ...product,
    options: options || [],
    variants: variants || [],
  }
}

export async function createProduct({
  storeId,
  title,
  description,
  currentPrice,
  oldPrice,
  status,
  mainImageFile,
  providedSlug,
}) {
  const slug = await generateUniqueSlug(storeId, providedSlug || createSlug(title))
  const image = mainImageFile ? await uploadProductImage(mainImageFile) : null

  const { data, error } = await supabase
    .from('products')
    .insert({
      store_id: storeId,
      title,
      description,
      slug,
      current_price: currentPrice,
      old_price: oldPrice || null,
      main_image_url: image?.url || null,
      main_image_path: image?.path || null,
      status,
    })
    .select('*')
    .single()

  if (error) {
    if (image?.path) {
      await deleteImageByPath(image.path)
    }
    throw error
  }

  return data
}

export async function updateProduct(
  productId,
  {
    title,
    description,
    currentPrice,
    oldPrice,
    status,
    mainImageFile,
    removeMainImage,
  }
) {
  const { data: existing } = await supabase
    .from('products')
    .select('main_image_path')
    .eq('id', productId)
    .single()

  let image = null
  if (mainImageFile) {
    image = await uploadProductImage(mainImageFile)
  }

  const updateData = {
    title,
    description,
    current_price: currentPrice,
    old_price: oldPrice || null,
    status,
  }

  if (image) {
    updateData.main_image_url = image.url
    updateData.main_image_path = image.path
  } else if (removeMainImage) {
    updateData.main_image_url = null
    updateData.main_image_path = null
  }

  const { data, error } = await supabase
    .from('products')
    .update(updateData)
    .eq('id', productId)
    .select('*')
    .single()

  if (error) {
    if (image?.path) {
      await deleteImageByPath(image.path)
    }
    throw error
  }

  if (image && existing?.main_image_path) {
    await deleteImageByPath(existing.main_image_path)
  }

  if (removeMainImage && existing?.main_image_path) {
    await deleteImageByPath(existing.main_image_path)
  }

  return data
}

export async function deleteProduct(productId) {
  const { data: product } = await supabase
    .from('products')
    .select('main_image_path')
    .eq('id', productId)
    .single()

  const { data: variants } = await supabase
    .from('product_variants')
    .select('image_path')
    .eq('product_id', productId)

  const { error } = await supabase.from('products').delete().eq('id', productId)

  if (error) {
    throw error
  }

  if (product?.main_image_path) {
    await deleteImageByPath(product.main_image_path)
  }

  for (const variant of variants || []) {
    if (variant.image_path) {
      await deleteImageByPath(variant.image_path)
    }
  }
}

export async function setProductOptions(productId, options) {
  await supabase.from('product_options').delete().eq('product_id', productId)

  if (!options || options.length === 0) {
    return []
  }

  const inserts = options
    .filter((option) => option.name.trim() && option.values.length > 0)
    .map((option) => ({
      product_id: productId,
      name: option.name.trim(),
      values: option.values,
    }))

  if (inserts.length === 0) {
    return []
  }

  const { data, error } = await supabase
    .from('product_options')
    .insert(inserts)
    .select('*')

  if (error) {
    throw error
  }

  return data || []
}

export async function setProductVariants(productId, variants) {
  const { data: existingVariants } = await supabase
    .from('product_variants')
    .select('image_path')
    .eq('product_id', productId)

  await supabase.from('product_variants').delete().eq('product_id', productId)

  if (!variants || variants.length === 0) {
    for (const variant of existingVariants || []) {
      if (variant.image_path) {
        await deleteImageByPath(variant.image_path)
      }
    }
    return []
  }

  for (const variant of variants) {
    if (variant.imageFile) {
      const uploaded = await uploadProductImage(variant.imageFile)
      variant.image_url = uploaded.url
      variant.image_path = uploaded.path
    }
  }

  const inserts = variants.map((variant) => ({
    product_id: productId,
    option_values: variant.option_values || {},
    current_price: variant.current_price || null,
    old_price: variant.old_price || null,
    image_url: variant.image_url || null,
    image_path: variant.image_path || null,
  }))

  const { data, error } = await supabase
    .from('product_variants')
    .insert(inserts)
    .select('*')

  if (error) {
    throw error
  }

  for (const variant of existingVariants || []) {
    const stillUsed = inserts.some((insert) => insert.image_path === variant.image_path)
    if (!stillUsed && variant.image_path) {
      await deleteImageByPath(variant.image_path)
    }
  }

  return data || []
}

export async function createOrder({
  productId,
  variantId,
  customerName,
  phone,
  wilayaCode,
  wilayaName,
  baladiya,
  deliveryMethod,
  quantity,
}) {
  const { data, error } = await supabase
    .from('orders')
    .insert({
      product_id: productId,
      variant_id: variantId || null,
      customer_name: customerName,
      phone,
      wilaya_code: wilayaCode,
      wilaya_name: wilayaName,
      baladiya,
      delivery_method: deliveryMethod,
      quantity,
    })
    .select('*')
    .single()

  if (error) {
    throw error
  }

  return data
}

export async function getStoreOrders(storeId) {
  const { data: products, error: productsError } = await supabase
    .from('products')
    .select('id')
    .eq('store_id', storeId)

  if (productsError) {
    throw productsError
  }

  const productIds = (products || []).map((product) => product.id)

  if (productIds.length === 0) {
    return []
  }

  const { data, error } = await supabase
    .from('orders')
    .select('*, products(title, slug, main_image_url)')
    .in('product_id', productIds)
    .order('created_at', { ascending: false })

  if (error) {
    throw error
  }

  return data || []
}

export async function updateOrderStatus(orderId, status) {
  const { data, error } = await supabase
    .from('orders')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', orderId)
    .select('*')
    .single()

  if (error) {
    throw error
  }

  return data
}

export async function getOrderStats(storeId) {
  const { data: products, error: productsError } = await supabase
    .from('products')
    .select('id')
    .eq('store_id', storeId)

  if (productsError) {
    throw productsError
  }

  const productIds = (products || []).map((product) => product.id)

  if (productIds.length === 0) {
    return { total: 0, new: 0, delivered: 0 }
  }

  const { data, error } = await supabase
    .from('orders')
    .select('status')
    .in('product_id', productIds)

  if (error) {
    throw error
  }

  const counts = {
    total: data.length,
    new: 0,
    delivered: 0,
  }

  for (const row of data) {
    if (row.status === 'new') {
      counts.new += 1
    }
    if (row.status === 'delivered') {
      counts.delivered += 1
    }
  }

  return counts
}

export async function uploadProductImage(file) {
  const { data: sessionData } = await supabase.auth.getSession()
  const userId = sessionData.session?.user?.id

  if (!userId) {
    throw new Error('You must be signed in to upload images.')
  }

  const extension = getFileExtension(file.name)
  const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extension}`

  const { error: uploadError } = await supabase.storage
    .from(PRODUCT_IMAGES_BUCKET)
    .upload(path, file, {
      cacheControl: '3600',
      contentType: file.type,
      upsert: false,
    })

  if (uploadError) {
    throw uploadError
  }

  const { data } = supabase.storage.from(PRODUCT_IMAGES_BUCKET).getPublicUrl(path)

  return { url: data.publicUrl, path }
}

async function deleteImageByPath(path) {
  await supabase.storage.from(PRODUCT_IMAGES_BUCKET).remove([path])
}

async function generateUniqueSlug(storeId, baseSlug) {
  let slug = baseSlug
  let counter = 1

  while (true) {
    const { data, error } = await supabase
      .from('products')
      .select('id')
      .eq('store_id', storeId)
      .eq('slug', slug)
      .maybeSingle()

    if (error) {
      throw error
    }

    if (!data) {
      return slug
    }

    slug = `${baseSlug}-${counter}`
    counter += 1
  }
}

function getFileExtension(fileName) {
  const extension = fileName.split('.').pop()?.toLowerCase()

  if (!extension || extension === fileName) {
    return 'png'
  }

  return extension
}
