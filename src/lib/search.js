function tokenize(query) {
  return query.toLowerCase().split(/\s+/).filter(Boolean)
}

function scoreField(text, tokens, weight) {
  if (!text) return -1
  const lower = text.toLowerCase()
  let score = 0
  for (const token of tokens) {
    const idx = lower.indexOf(token)
    if (idx === -1) return -1
    score += weight
    if (idx === 0) score += weight * 0.5
    else if (/\s/.test(lower[idx - 1])) score += weight * 0.25
  }
  return score
}

function bestScore(fields, tokens) {
  let best = -1
  for (const [text, weight] of fields) {
    const s = scoreField(text, tokens, weight)
    if (s > best) best = s
  }
  if (best >= 0) return best
  const combined = fields.map(([t]) => t || '').join('\n')
  const s = scoreField(combined, tokens, 1)
  return s
}

export function searchTasks(tasks, query, options = {}) {
  const tokens = tokenize(query)
  if (!tokens.length) return []
  const limit = options.limit ?? 50
  const results = []
  for (const task of tasks) {
    if (task.deletedAt && !options.includeTrash) continue
    const score = bestScore(
      [
        [task.title, 10],
        [task.description, 4],
        [task.notes, 3],
        [task.location, 2],
      ],
      tokens,
    )
    if (score >= 0) results.push({ task, score })
  }
  results.sort((a, b) => b.score - a.score || a.task.title.localeCompare(b.task.title))
  return results.slice(0, limit)
}

export function searchNamed(items, query, limit = 8) {
  const tokens = tokenize(query)
  if (!tokens.length) return []
  const results = []
  for (const item of items) {
    const score = scoreField(item.name, tokens, 10)
    if (score >= 0) results.push({ item, score })
  }
  return results
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((r) => r.item)
}

export function highlightRanges(text, query) {
  const tokens = tokenize(query)
  if (!text || !tokens.length) return [{ text, match: false }]
  const lower = text.toLowerCase()
  const marks = new Array(text.length).fill(false)
  for (const token of tokens) {
    let idx = lower.indexOf(token)
    while (idx !== -1) {
      for (let i = idx; i < idx + token.length; i += 1) marks[i] = true
      idx = lower.indexOf(token, idx + token.length)
    }
  }
  const parts = []
  let current = ''
  let currentMatch = marks[0]
  for (let i = 0; i < text.length; i += 1) {
    if (marks[i] !== currentMatch) {
      parts.push({ text: current, match: currentMatch })
      current = ''
      currentMatch = marks[i]
    }
    current += text[i]
  }
  if (current) parts.push({ text: current, match: currentMatch })
  return parts
}
