import { supabase } from '../lib/supabase'

const STORE_LOGOS_BUCKET = 'store-logos'

export async function getMyStore() {
  const { data, error } = await supabase
    .from('stores')
    .select('*')
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

function getFileExtension(fileName) {
  const extension = fileName.split('.').pop()?.toLowerCase()

  if (!extension || extension === fileName) {
    return 'png'
  }

  return extension
}
