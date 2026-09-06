import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Page, PageHeader } from '../components/layout/PageHeader.jsx'
import { ProjectCard } from '../components/projects/ProjectCard.jsx'
import { ProjectEditorDialog } from '../components/projects/ProjectEditorDialog.jsx'
import { EmptyState } from '../components/ui/States.jsx'
import { Button, IconButton } from '../components/ui/Button.jsx'
import { Dropdown, MenuItem, MenuSeparator } from '../components/ui/Dropdown.jsx'
import { ConfirmDialog } from '../components/ui/Modal.jsx'
import { useAppState, useAppActions } from '../store/AppStore.jsx'
import { projectProgress } from '../lib/taskQueries.js'
import { PROJECT_STATUS } from '../constants/task.js'
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'
import { useToast } from '../components/ui/Toast.jsx'
import { cn } from '../lib/cn.js'

export default function ProjectsPage() {
  useDocumentTitle('Projects')
  const { projects, tasks } = useAppState()
  const actions = useAppActions()
  const toast = useToast()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const [editing, setEditing] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [tab, setTab] = useState('active')

  useEffect(() => {
    if (params.get('new') === '1') {
      setEditing({})
      params.delete('new')
      setParams(params, { replace: true })
    }
  }, [params, setParams])

  const visible = useMemo(() => {
    const list = projects.filter((p) => (tab === 'active' ? p.status === PROJECT_STATUS.ACTIVE || p.status === PROJECT_STATUS.ON_HOLD : p.status === PROJECT_STATUS.COMPLETED || p.status === PROJECT_STATUS.ARCHIVED))
    return list.sort((a, b) => a.order - b.order).map((p) => ({ project: p, progress: projectProgress(tasks, p.id) }))
  }, [projects, tasks, tab])
  const archivedCount = projects.filter((p) => p.status === PROJECT_STATUS.COMPLETED || p.status === PROJECT_STATUS.ARCHIVED).length

  return (
    <Page width="max-w-5xl">
      <PageHeader
        title="Projects"
        subtitle="Group related tasks and track progress toward an outcome."
        actions={
          <>
            <div role="tablist" aria-label="Project status" className="inline-flex rounded-md border border-line bg-surface p-0.5">
              {[
                { id: 'active', label: 'Active' },
                { id: 'done', label: `Archived${archivedCount ? ` (${archivedCount})` : ''}` },
              ].map((t) => (
                <button key={t.id} role="tab" aria-selected={tab === t.id} type="button" onClick={() => setTab(t.id)} className={cn('h-7 px-2.5 rounded-sm text-xs font-medium transition-colors', tab === t.id ? 'bg-ink text-white' : 'text-ink-secondary hover:bg-sunken')}>
                  {t.label}
                </button>
              ))}
            </div>
            <Button variant="primary" size="sm" icon="plus" onClick={() => setEditing({})}>
              New project
            </Button>
          </>
        }
      />
      {visible.length ? (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {visible.map(({ project, progress }) => (
            <ProjectCard
              key={project.id}
              project={project}
              progress={progress}
              actions={
                <Dropdown align="end" title={project.name} trigger={({ toggle, props }) => <IconButton icon="more-horizontal" label={`Actions for ${project.name}`} size="sm" onClick={toggle} {...props} />}>
                  <MenuItem icon="pencil" onSelect={() => setEditing(project)}>Edit</MenuItem>
                  <MenuItem icon="arrow-right" onSelect={() => navigate(`/projects/${project.id}`)}>Open</MenuItem>
                  <MenuSeparator />
                  {project.status === PROJECT_STATUS.ACTIVE ? (
                    <>
                      <MenuItem icon="circle-check" onSelect={() => actions.updateProject(project.id, { status: PROJECT_STATUS.COMPLETED }).then(() => toast.success('Project completed'))}>Mark completed</MenuItem>
                      <MenuItem icon="archive" onSelect={() => actions.archiveProject(project.id).then(() => toast.success('Project archived'))}>Archive</MenuItem>
                    </>
                  ) : (
                    <MenuItem icon="archive-restore" onSelect={() => actions.updateProject(project.id, { status: PROJECT_STATUS.ACTIVE })}>Reactivate</MenuItem>
                  )}
                  <MenuItem icon="trash-2" danger onSelect={() => setDeleting(project)}>Delete</MenuItem>
                </Dropdown>
              }
            />
          ))}
        </div>
      ) : tab === 'active' ? (
        <EmptyState icon="folder-kanban" title="No projects yet" description="Projects keep related tasks together and show how close you are to finishing." action={{ label: 'Create your first project', icon: 'plus', onClick: () => setEditing({}) }} />
      ) : (
        <EmptyState icon="archive" title="No archived projects" description="Completed and archived projects are kept here for reference." />
      )}
      {editing ? <ProjectEditorDialog open onClose={() => setEditing(null)} project={editing.id ? editing : null} onSaved={(p) => !editing.id && navigate(`/projects/${p.id}`)} /> : null}
      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        title={`Delete "${deleting?.name}"?`}
        message={`Tasks in this project will be kept and moved out of the project. This cannot be undone.`}
        confirmLabel="Delete project"
        onConfirm={() => actions.deleteProject(deleting.id).then(() => { setDeleting(null); toast.success('Project deleted') })}
      />
    </Page>
  )
}
