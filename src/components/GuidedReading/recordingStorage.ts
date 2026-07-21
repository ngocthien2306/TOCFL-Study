export interface GuidedAudioRecording {
  articleId: string;
  blob: Blob;
  createdAt: string;
}

const DB_NAME = 'tocfl-guided-reading-audio';
const STORE_NAME = 'recordings';
const DB_VERSION = 1;

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME, { keyPath: 'articleId' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('IndexedDB is unavailable.'));
  });
}

function completeTransaction(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error('Could not save the recording.'));
    transaction.onabort = () => reject(transaction.error ?? new Error('Recording storage was cancelled.'));
  });
}

export async function saveGuidedRecording(articleId: string, blob: Blob): Promise<GuidedAudioRecording> {
  const database = await openDatabase();
  const value: GuidedAudioRecording = { articleId, blob, createdAt: new Date().toISOString() };
  const transaction = database.transaction(STORE_NAME, 'readwrite');
  transaction.objectStore(STORE_NAME).put(value);
  await completeTransaction(transaction);
  database.close();
  return value;
}

export async function loadGuidedRecording(articleId: string): Promise<GuidedAudioRecording | undefined> {
  const database = await openDatabase();
  const transaction = database.transaction(STORE_NAME, 'readonly');
  const request = transaction.objectStore(STORE_NAME).get(articleId);
  const value = await new Promise<GuidedAudioRecording | undefined>((resolve, reject) => {
    request.onsuccess = () => resolve(request.result as GuidedAudioRecording | undefined);
    request.onerror = () => reject(request.error ?? new Error('Could not load the recording.'));
  });
  database.close();
  return value;
}

export async function deleteGuidedRecording(articleId: string): Promise<void> {
  const database = await openDatabase();
  const transaction = database.transaction(STORE_NAME, 'readwrite');
  transaction.objectStore(STORE_NAME).delete(articleId);
  await completeTransaction(transaction);
  database.close();
}
