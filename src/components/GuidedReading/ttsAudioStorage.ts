const DB_NAME = 'tocfl-guided-tts-audio';
const STORE_NAME = 'audio';
const DB_VERSION = 1;

interface StoredTtsAudio {
  cacheKey: string;
  blob: Blob;
  createdAt: string;
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) {
        request.result.createObjectStore(STORE_NAME, { keyPath: 'cacheKey' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('TTS cache is unavailable.'));
  });
}

export async function loadTtsAudio(cacheKey: string): Promise<Blob | null> {
  const database = await openDatabase();
  const transaction = database.transaction(STORE_NAME, 'readonly');
  const request = transaction.objectStore(STORE_NAME).get(cacheKey);
  const item = await new Promise<StoredTtsAudio | undefined>((resolve, reject) => {
    request.onsuccess = () => resolve(request.result as StoredTtsAudio | undefined);
    request.onerror = () => reject(request.error ?? new Error('Could not read TTS cache.'));
  });
  database.close();
  return item?.blob ?? null;
}

export async function saveTtsAudio(cacheKey: string, blob: Blob): Promise<void> {
  const database = await openDatabase();
  const transaction = database.transaction(STORE_NAME, 'readwrite');
  transaction.objectStore(STORE_NAME).put({
    cacheKey,
    blob,
    createdAt: new Date().toISOString(),
  } satisfies StoredTtsAudio);
  await new Promise<void>((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error('Could not save TTS cache.'));
    transaction.onabort = () => reject(transaction.error ?? new Error('TTS cache write was cancelled.'));
  });
  database.close();
}
