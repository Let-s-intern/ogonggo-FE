/**
 * 자유 요소 이미지를 이 브라우저의 IndexedDB 에 남긴다. 편집본(localStorage, 약 5MB)에는 이미지 id 만
 * 두고 data URL 은 여기 둔다 — 붙여 넣은 이미지 몇 장이면 localStorage 한도를 넘긴다.
 *
 * IndexedDB 를 못 쓰면(사생활 보호 창, 막힌 저장소) 저장하지 않고 넘어간다. 그 이미지는 이번 화면에서만
 * 쓰이고 새로고침하면 사라진다.
 */
const DB_NAME = 'ogonggo.card-news.images';
const STORE = 'images';

let dbPromise: Promise<IDBDatabase | null> | null = null;

function openDb(): Promise<IDBDatabase | null> {
  dbPromise ??= new Promise((resolve) => {
    try {
      const request = indexedDB.open(DB_NAME, 1);
      request.onupgradeneeded = () => request.result.createObjectStore(STORE);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
  return dbPromise;
}

/** 이미지를 남긴다. 남기지 못하면 `false`. */
export async function putImage(id: string, dataUrl: string): Promise<boolean> {
  const db = await openDb();
  if (!db) {
    return false;
  }
  return new Promise((resolve) => {
    try {
      const transaction = db.transaction(STORE, 'readwrite');
      transaction.objectStore(STORE).put(dataUrl, id);
      transaction.oncomplete = () => resolve(true);
      transaction.onerror = () => resolve(false);
    } catch {
      resolve(false);
    }
  });
}

/** 남긴 이미지. 없거나 못 읽으면 `null`. */
export async function getImage(id: string): Promise<string | null> {
  const db = await openDb();
  if (!db) {
    return null;
  }
  return new Promise((resolve) => {
    try {
      const request = db.transaction(STORE, 'readonly').objectStore(STORE).get(id);
      request.onsuccess = () => resolve(typeof request.result === 'string' ? request.result : null);
      request.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}
