export class StorageError extends Error {
  constructor(message, options = {}) {
    super(message)
    this.name = 'StorageError'
    this.code = options.code || 'storage_error'
    this.cause = options.cause
  }
}

export function toStorageError(error, fallbackMessage = 'Something went wrong while saving your data.') {
  if (error instanceof StorageError) return error
  const name = error?.name || ''
  if (name === 'QuotaExceededError') {
    return new StorageError('Your browser storage is full. Delete some tasks or attachments to free up space.', { code: 'quota_exceeded', cause: error })
  }
  if (name === 'InvalidStateError' || name === 'UnknownError') {
    return new StorageError('Local storage became unavailable. Reload the app to reconnect.', { code: 'unavailable', cause: error })
  }
  if (name === 'VersionError') {
    return new StorageError('A newer version of the app is open in another tab. Close it and reload.', { code: 'version_conflict', cause: error })
  }
  return new StorageError(fallbackMessage, { code: 'unknown', cause: error })
}
