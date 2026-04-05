// IndexedDB helpers for offline form responses
const DB_NAME = "formflow-offline";
const STORE = "pending_responses";
const DB_VERSION = 1;

function openDB() {
    return new Promise((resolve, reject) => {
        const req = indexedDB.open(DB_NAME, DB_VERSION);
        req.onupgradeneeded = (e) => {
            e.target.result.createObjectStore(STORE, { keyPath: "localId" });
        };
        req.onsuccess = (e) => resolve(e.target.result);
        req.onerror = () => reject(req.error);
    });
}

export async function savePendingResponse(apiUrl, payload) {
    const db = await openDB();
    const localId = `pending_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, "readwrite");
        const req = tx.objectStore(STORE).put({ localId, apiUrl, payload, savedAt: Date.now() });
        req.onsuccess = () => resolve(localId);
        req.onerror = () => reject(req.error);
    });
}

export async function getPendingResponses() {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, "readonly");
        const req = tx.objectStore(STORE).getAll();
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
}

export async function deletePendingResponse(localId) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, "readwrite");
        const req = tx.objectStore(STORE).delete(localId);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
    });
}

export async function getPendingCount() {
    const pending = await getPendingResponses();
    return pending.length;
}