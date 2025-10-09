import { useCallback, useState } from "react";

const STORAGE_KEYS = {
  ACTIVE_SESSION_ID: "activeSessionId",
};

const saveToLocalStorage = (key: string, value: any) => {
  try {
    localStorage.setItem(key, typeof value === "string" ? value : JSON.stringify(value));
  } catch {}
};

export function useSessionId(): [string | null, (id: string | null) => void] {
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(() =>
    typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEYS.ACTIVE_SESSION_ID) : null
  );

  const updateSessionId = useCallback((id: string | null) => {
    setCurrentSessionId(id);
    if (id) {
      saveToLocalStorage(STORAGE_KEYS.ACTIVE_SESSION_ID, id);
    } else {
      try { localStorage.removeItem(STORAGE_KEYS.ACTIVE_SESSION_ID); } catch {}
    }
  }, []);

  return [currentSessionId, updateSessionId];
}


