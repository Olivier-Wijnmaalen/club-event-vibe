import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

const STORAGE_KEY = "club-carousel:saved-events";

interface Ctx {
  ready: boolean;
  savedIds: Set<string>;
  isSaved: (eventId: string | number) => boolean;
  toggleSaved: (eventId: string | number) => void;
}

const SavedEventsContext = createContext<Ctx | null>(null);

function readStorage(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    if (Array.isArray(arr)) return new Set(arr.map(String));
  } catch {
    /* ignore */
  }
  return new Set();
}

function writeStorage(ids: Set<string>) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(ids)));
  } catch {
    /* ignore */
  }
}

export function SavedEventsProvider({ children }: { children: ReactNode }) {
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setSavedIds(readStorage());
    setReady(true);
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setSavedIds(readStorage());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const toggleSaved = useCallback((eventId: string | number) => {
    const id = String(eventId);
    setSavedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      writeStorage(next);
      return next;
    });
  }, []);

  const value = useMemo<Ctx>(
    () => ({
      ready,
      savedIds,
      isSaved: (id) => savedIds.has(String(id)),
      toggleSaved,
    }),
    [ready, savedIds, toggleSaved],
  );

  return <SavedEventsContext.Provider value={value}>{children}</SavedEventsContext.Provider>;
}

export function useSavedEvents() {
  const ctx = useContext(SavedEventsContext);
  if (!ctx) throw new Error("useSavedEvents must be used within SavedEventsProvider");
  return ctx;
}
