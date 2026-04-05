import React, { useState, useEffect } from "react";
import { WifiOff, Wifi, RefreshCw, CloudOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getPendingCount } from "@/lib/offlineDB";
import { requestBackgroundSync } from "@/lib/serviceWorker";

export default function OfflineBanner() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingCount, setPendingCount] = useState(0);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    const goOnline = async () => {
      setIsOnline(true);
      const count = await getPendingCount();
      if (count > 0) {
        setSyncing(true);
        await requestBackgroundSync();
        setTimeout(async () => {
          const remaining = await getPendingCount();
          setPendingCount(remaining);
          setSyncing(false);
        }, 3000);
      }
    };
    const goOffline = () => setIsOnline(false);

    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);

    // Check initial pending count
    getPendingCount().then(setPendingCount);

    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  const handleManualSync = async () => {
    setSyncing(true);
    await requestBackgroundSync();
    setTimeout(async () => {
      const remaining = await getPendingCount();
      setPendingCount(remaining);
      setSyncing(false);
    }, 3000);
  };

  if (isOnline && pendingCount === 0) return null;

  if (!isOnline) {
    return (
      <div className="w-full bg-yellow-50 border-b border-yellow-200 px-4 py-2.5 flex items-center justify-center gap-2 text-sm text-yellow-800">
        <WifiOff className="w-4 h-4 flex-shrink-0" />
        <span>You're offline. Your response will be saved and submitted when you reconnect.</span>
      </div>
    );
  }

  if (isOnline && pendingCount > 0) {
    return (
      <div className="w-full bg-blue-50 border-b border-blue-200 px-4 py-2.5 flex items-center justify-center gap-2 text-sm text-blue-800">
        {syncing ? (
          <><RefreshCw className="w-4 h-4 animate-spin flex-shrink-0" /><span>Syncing {pendingCount} offline response{pendingCount > 1 ? "s" : ""}…</ span></>
        ) : (
          <>
            <CloudOff className="w-4 h-4 flex-shrink-0" />
            <span>{pendingCount} response{pendingCount > 1 ? "s" : ""} waiting to sync.</span>
            <Button size="sm" variant="outline" className="h-6 px-2 text-xs border-blue-300 text-blue-800 hover:bg-blue-100" onClick={handleManualSync}>
              Sync now
            </Button>
          </>
        )}
      </div>
    );
  }

  return null;
}