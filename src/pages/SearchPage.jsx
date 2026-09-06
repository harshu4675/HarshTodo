import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Page, PageHeader } from '../components/layout/PageHeader.jsx'
import { Input } from '../components/ui/Input.jsx'
import { Button } from '../components/ui/Button.jsx'
import { EmptyState } from '../components/ui/States.jsx'
import { FilterBar } from '../components/tasks/FilterBar.jsx'
import { TaskList } from '../components/tasks/TaskList.jsx'
import { ColorDot } from '../components/ui/Badge.jsx'
import { Highlight } from '../components/search/CommandPalette.jsx'
import { useAppState } from '../store/AppStore.jsx'
import { searchTasks, searchNamed } from '../lib/search.js'
import { applyFilter, EMPTY_FILTER } from '../lib/filters.js'
import { useRecentSearches } from '../hooks/useRecentSearches.js'
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'
import { useDebouncedValue } from '../hooks/useDebouncedValue.js'

export default function SearchPage() {
  useDocumentTitle('Search')
  const { tasks, projects, tags } = useAppState()
  const [params, setParams] = useSearchParams()
  const [query, setQuery] = useState(params.get('q') || '')
  const [filter, setFilter] = useState({ ...EMPTY_FILTER, completion: 'all' })
  const { recent, remember, clear } = useRecentSearches()
  const debounced = useDebouncedValue(query, 120)
  const inputRef = useRef(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    const next = new URLSearchParams(params)
    if (debounced) next.set('q', debounced)
    else next.delete('q')
    if (next.toString() !== params.toString()) setParams(next, { replace: true })
    if (debounced.trim().length >= 3) remember(debounced)
  }, [debounced, params, setParams, remember])

  const results = useMemo(() => {
    const q = debounced.trim()
    if (!q) return null
    const scoped = applyFilter(tasks, { ...filter, query: '' })
    const taskHits = searchTasks(scoped, q, { limit: 200 }).map((r) => r.task)
    return { tasks: taskHits, projects: searchNamed(projects, q, 6), tags: searchNamed(tags, q, 6) }
  }, [debounced, tasks, projects, tags, filter])

  return (
    <Page width="max-w-4xl">
      <PageHeader title="Search" subtitle="Search titles, descriptions, notes, projects and tags. Works offline." />
      <Input ref={inputRef} icon="search" size="lg" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search everything" aria-label="Search" autoComplete="off" className="mb-3 text-base" />
      <FilterBar filter={filter} onChange={setFilter} showSearch={false} className="mb-5" allowSave={false} />
      {!results ? (
        recent.length ? (
          <section>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Recent searches</h2>
              <button type="button" onClick={clear} className="text-xs text-ink-muted hover:text-ink">
                Clear
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {recent.map((r) => (
                <Button key={r} size="sm" variant="secondary" icon="clock" onClick={() => setQuery(r)}>
                  {r}
                </Button>
              ))}
            </div>
          </section>
        ) : (
          <EmptyState icon="search" title="Find anything you have written down" description="Try a keyword from a task title, a note, a project or a tag name." />
        )
      ) : (
        <div className="flex flex-col gap-6">
          {results.projects.length || results.tags.length ? (
            <div className="flex flex-wrap gap-1.5">
              {results.projects.map((p) => (
                <Link key={p.id} to={`/projects/${p.id}`} className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-md border border-line bg-surface text-sm hover:border-line-strong">
                  <ColorDot color={p.color} />
                  <Highlight text={p.name} query={debounced} />
                  <span className="text-xs text-ink-muted">Project</span>
                </Link>
              ))}
              {results.tags.map((t) => (
                <Link key={t.id} to={`/tags/${t.id}`} className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-md border border-line bg-surface text-sm hover:border-line-strong">
                  <ColorDot color={t.color} />
                  <Highlight text={t.name} query={debounced} />
                  <span className="text-xs text-ink-muted">Tag</span>
                </Link>
              ))}
            </div>
          ) : null}
          <TaskList
            tasks={results.tasks}
            ariaLabel="Search results"
            emptyState={<EmptyState icon="search" title={`No results for "${debounced}"`} description="Check the spelling, try fewer words, or widen the filters above." action={{ label: 'Clear filters', onClick: () => setFilter({ ...EMPTY_FILTER, completion: 'all' }) }} />}
          />
        </div>
      )}
    </Page>
  )
}
