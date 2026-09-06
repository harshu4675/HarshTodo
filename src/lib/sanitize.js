const SAFE_PROTOCOLS = ['http:', 'https:', 'mailto:', 'tel:']

export function sanitizeUrl(value) {
  if (!value || typeof value !== 'string') return null
  const trimmed = value.trim()
  if (!trimmed) return null
  try {
    const url = new URL(trimmed, 'https://placeholder.invalid')
    if (!SAFE_PROTOCOLS.includes(url.protocol)) return null
    if (url.hostname === 'placeholder.invalid' && !/^https?:\/\//i.test(trimmed)) {
      return `https://${trimmed}`
    }
    return url.href
  } catch {
    return null
  }
}

export function stripControlCharacters(value) {
  if (typeof value !== 'string') return ''
  return value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
}

export function normalizeText(value, maxLength = 10000) {
  return stripControlCharacters(value).slice(0, maxLength)
}
