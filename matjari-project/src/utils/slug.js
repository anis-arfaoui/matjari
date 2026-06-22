export function createSlug(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-')
}

export function isValidSlug(value) {
  return /^[a-z0-9]+(-[a-z0-9]+)*$/.test(value)
}
