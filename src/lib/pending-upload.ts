const DB_NAME = 'audeflow-pending'
const DB_VERSION = 1
const STORE = 'files'
const KEY = 'invoice-pdf'

type StoredPdf = {
  blob: Blob
  name: string
  type: string
  savedAt: number
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE)
      }
    }
  })
}

function txComplete(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
    tx.onabort = () => reject(tx.error)
  })
}

export async function savePendingPdf(file: File): Promise<boolean> {
  try {
    const db = await openDb()
    const tx = db.transaction(STORE, 'readwrite')
    const record: StoredPdf = {
      blob: file,
      name: file.name,
      type: file.type || 'application/pdf',
      savedAt: Date.now(),
    }
    tx.objectStore(STORE).put(record, KEY)
    await txComplete(tx)
    db.close()
    return true
  } catch {
    return false
  }
}

export async function hasPendingPdf(): Promise<boolean> {
  try {
    const db = await openDb()
    const tx = db.transaction(STORE, 'readonly')
    const req = tx.objectStore(STORE).get(KEY)
    const result = await new Promise<StoredPdf | undefined>((resolve, reject) => {
      req.onsuccess = () => resolve(req.result as StoredPdf | undefined)
      req.onerror = () => reject(req.error)
    })
    db.close()
    return !!result?.blob
  } catch {
    return false
  }
}

export async function takePendingPdf(): Promise<File | null> {
  try {
    const db = await openDb()
    const tx = db.transaction(STORE, 'readwrite')
    const store = tx.objectStore(STORE)
    const req = store.get(KEY)
    const record = await new Promise<StoredPdf | undefined>((resolve, reject) => {
      req.onsuccess = () => resolve(req.result as StoredPdf | undefined)
      req.onerror = () => reject(req.error)
    })
    if (!record?.blob) {
      db.close()
      return null
    }
    store.delete(KEY)
    await txComplete(tx)
    db.close()
    return new File([record.blob], record.name, { type: record.type })
  } catch {
    return null
  }
}

export async function clearPendingPdf(): Promise<void> {
  try {
    const db = await openDb()
    const tx = db.transaction(STORE, 'readwrite')
    tx.objectStore(STORE).delete(KEY)
    await txComplete(tx)
    db.close()
  } catch {
    // ignore
  }
}

export function getPostAuthUploadPath(): string {
  return '/faktury/upload?auto=1'
}
