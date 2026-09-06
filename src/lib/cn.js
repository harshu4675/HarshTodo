export function cn(...values) {
  const out = []
  for (const value of values) {
    if (!value) continue
    if (typeof value === 'string') out.push(value)
    else if (Array.isArray(value)) out.push(cn(...value))
    else if (typeof value === 'object') {
      for (const key of Object.keys(value)) if (value[key]) out.push(key)
    }
  }
  return out.join(' ')
}
