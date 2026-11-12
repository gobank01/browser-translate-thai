/**
 * Dub audio kept on disk (IndexedDB, in the background), so a video watched
 * again — or a page reloaded, or a scrub backwards — costs no ElevenLabs
 * credits twice.
 *
 * ponytail: eviction is "drop the oldest-written when over MAX_CLIPS", checked
 * every PRUNE_EVERY writes. Good enough for one person; an LRU on read would be
 * the upgrade if the cap starts biting.
 */
const DB = 'bt-dub-audio';
const STORE = 'clips';
/** ~50 KB a clip → roughly 250 MB at the cap. */
const MAX_CLIPS = 5000;
const PRUNE_EVERY = 100;

interface Row { key: string; url: string; at: number }

let dbPromise: Promise<IDBDatabase> | null = null;
let writes = 0;

function open(): Promise<IDBDatabase> {
  dbPromise ??= new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => {
      const store = req.result.createObjectStore(STORE, { keyPath: 'key' });
      store.createIndex('at', 'at');
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => { dbPromise = null; reject(req.error); };
  });
  return dbPromise;
}

function done<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

/** One key per voice, model and exact text. */
export function clipKey(voiceId: string, model: string, text: string): string {
  return `${voiceId}|${model}|${text}`;
}

export async function getClip(key: string): Promise<string | undefined> {
  try {
    const db = await open();
    const row = await done(db.transaction(STORE).objectStore(STORE).get(key)) as Row | undefined;
    return row?.url;
  } catch {
    return undefined; // a cache that fails is just a miss
  }
}

export async function putClip(key: string, url: string): Promise<void> {
  try {
    const db = await open();
    await done(db.transaction(STORE, 'readwrite').objectStore(STORE).put({ key, url, at: Date.now() } satisfies Row));
    if (++writes % PRUNE_EVERY === 0) await prune(db);
  } catch {
    // Not cached this time; the clip still plays.
  }
}

async function prune(db: IDBDatabase): Promise<void> {
  const store = db.transaction(STORE, 'readwrite').objectStore(STORE);
  const excess = (await done(store.count())) - MAX_CLIPS;
  if (excess <= 0) return;
  let left = excess;
  const cursor = store.index('at').openCursor();
  await new Promise<void>((resolve) => {
    cursor.onsuccess = () => {
      const c = cursor.result;
      if (!c || left-- <= 0) { resolve(); return; }
      c.delete();
      c.continue();
    };
    cursor.onerror = () => resolve();
  });
}
