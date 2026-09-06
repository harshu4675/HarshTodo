import { STORES } from '../database.js'

export function createAttachmentRepository(storage) {
  return {
    async putBlob(id, blob) {
      await storage.put(STORES.ATTACHMENT_BLOBS, { id, blob })
    },
    async getBlob(id) {
      const row = await storage.get(STORES.ATTACHMENT_BLOBS, id)
      return row ? row.blob : null
    },
    async deleteBlobs(ids) {
      if (ids.length) await storage.deleteMany(STORES.ATTACHMENT_BLOBS, ids)
    },
  }
}
