// Service Worker registration and sync utilities

export function registerServiceWorker() {
    if (!("serviceWorker" in navigator)) return;
    window.addEventListener("load", async () => {
        try {
            await navigator.serviceWorker.register("/sw.js");
        } catch (err) {
            console.warn("SW registration failed:", err);
        }
    });
}

export async function requestBackgroundSync() {
    if (!("serviceWorker" in navigator)) return;
    try {
        const reg = await navigator.serviceWorker.ready;
        if ("sync" in reg) {
            await reg.sync.register("sync-responses");
        } else {
            // Fallback: message the SW directly
            reg.active?.postMessage({ type: "SYNC_NOW" });
        }
    } catch {
        // Silently fail
    }
}

export function listenForSyncMessages(onSynced) {
    if (!("serviceWorker" in navigator)) return () => { };
    const handler = (event) => {
        if (event.data?.type === "RESPONSE_SYNCED" || event.data?.type === "SYNC_DONE") {
            onSynced(event.data);
        }
    };
    navigator.serviceWorker.addEventListener("message", handler);
    return () => navigator.serviceWorker.removeEventListener("message", handler);
}