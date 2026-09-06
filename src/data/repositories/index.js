import { STORES } from '../database.js'
import {
  normalizeProject,
  createProject,
  normalizeList,
  createList,
  normalizeTag,
  createTag,
  normalizeSavedFilter,
  createSavedFilter,
  normalizeFocusSession,
  createFocusSession,
} from '../models.js'
import { createTaskRepository } from './taskRepository.js'
import { createEntityRepository } from './entityRepository.js'
import { createSettingsRepository } from './settingsRepository.js'
import { createAttachmentRepository } from './attachmentRepository.js'

export function createRepositories(storage) {
  return {
    storage,
    tasks: createTaskRepository(storage),
    projects: createEntityRepository(storage, STORES.PROJECTS, { normalize: normalizeProject, create: createProject }),
    lists: createEntityRepository(storage, STORES.LISTS, { normalize: normalizeList, create: createList }),
    tags: createEntityRepository(storage, STORES.TAGS, { normalize: normalizeTag, create: createTag }),
    savedFilters: createEntityRepository(storage, STORES.SAVED_FILTERS, { normalize: normalizeSavedFilter, create: createSavedFilter }),
    focusSessions: createEntityRepository(storage, STORES.FOCUS_SESSIONS, { normalize: normalizeFocusSession, create: createFocusSession }),
    settings: createSettingsRepository(storage),
    attachments: createAttachmentRepository(storage),
  }
}
