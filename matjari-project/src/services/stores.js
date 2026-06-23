import { supabase } from '../lib/supabase'

const STORE_LOGOS_BUCKET = 'store-logos'

export async function getMyStore() {
  const { data: sessionData } = await supabase.auth.getSession()
  const userId = sessionData.session?.user?.id

  const { data, error } = await supabase
    .from('stores')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) {
    throw error
  }

  return data
}

export async function getStoreBySlug(slug) {
  const { data, error } = await supabase
    .from('stores')
    .select('*')
    .eq('slug', slug)
    .maybeSingle()

  if (error) {
    throw error
  }

  return data
}

export async function createStore({ userId, name, slug, logoFile }) {
  let logoPath = null
  let logoUrl = null

  if (logoFile) {
    const extension = getFileExtension(logoFile.name)
    logoPath = `${userId}/${Date.now()}-${slug}.${extension}`

    const { error: uploadError } = await supabase.storage
      .from(STORE_LOGOS_BUCKET)
      .upload(logoPath, logoFile, {
        cacheControl: '3600',
        contentType: logoFile.type,
        upsert: false,
      })

    if (uploadError) {
      throw uploadError
    }

    const { data } = supabase.storage
      .from(STORE_LOGOS_BUCKET)
      .getPublicUrl(logoPath)

    logoUrl = data.publicUrl
  }

  const { data, error } = await supabase
    .from('stores')
    .insert({
      user_id: userId,
      name,
      slug,
      logo_url: logoUrl,
      logo_path: logoPath,
    })
    .select('*')
    .single()

  if (error) {
    throw error
  }

  return data
}

export async function updateStore({ storeId, name, description, slug, logoFile, removeLogo }) {
  const { data: sessionData } = await supabase.auth.getSession()
  const userId = sessionData.session?.user?.id

  const { data: existing } = await supabase
    .from('stores')
    .select('logo_path')
    .eq('id', storeId)
    .single()

  let logoPath = existing?.logo_path || null
  let logoUrl = null

  if (logoFile) {
    const extension = getFileExtension(logoFile.name)
    const newLogoPath = `${userId}/${Date.now()}-${slug}.${extension}`

    const { error: uploadError } = await supabase.storage
      .from(STORE_LOGOS_BUCKET)
      .upload(newLogoPath, logoFile, {
        cacheControl: '3600',
        contentType: logoFile.type,
        upsert: false,
      })

    if (uploadError) {
      throw uploadError
    }

    const { data } = supabase.storage
      .from(STORE_LOGOS_BUCKET)
      .getPublicUrl(newLogoPath)

    logoPath = newLogoPath
    logoUrl = data.publicUrl
  } else if (removeLogo) {
    logoPath = null
    logoUrl = null
  }

  const updateData = {
    name,
    description: description || null,
    slug,
    updated_at: new Date().toISOString(),
  }

  if (logoFile || removeLogo) {
    updateData.logo_url = logoUrl
    updateData.logo_path = logoPath
  }

  const { data, error } = await supabase
    .from('stores')
    .update(updateData)
    .eq('id', storeId)
    .select('*')
    .single()

  if (error) {
    if (logoFile && logoPath) {
      await supabase.storage.from(STORE_LOGOS_BUCKET).remove([logoPath])
    }
    throw error
  }

  if (logoFile && existing?.logo_path) {
    await supabase.storage.from(STORE_LOGOS_BUCKET).remove([existing.logo_path])
  }

  if (removeLogo && existing?.logo_path) {
    await supabase.storage.from(STORE_LOGOS_BUCKET).remove([existing.logo_path])
  }

  return data
}

export async function isSlugAvailable(slug, excludeStoreId) {
  let query = supabase.from('stores').select('id').eq('slug', slug)

  if (excludeStoreId) {
    query = query.neq('id', excludeStoreId)
  }

  const { data, error } = await query.maybeSingle()

  if (error) {
    throw error
  }

  return !data
}

function getFileExtension(fileName) {
  const extension = fileName.split('.').pop()?.toLowerCase()

  if (!extension || extension === fileName) {
    return 'png'
  }

  return extension
}
