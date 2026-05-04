import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase as cloud } from "@/integrations/supabase/client";

interface Ctx {
  session: Session | null;
  ready: boolean;
  savedIds: Set<string>;
  isSaved: (eventId: string | number) => boolean;
  toggleSaved: (eventId: string | number) => Promise<void>;
  signOut: () => Promise<void>;
}

const SavedEventsContext = createContext<Ctx | null>(null);

export function SavedEventsProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const { data: sub } = cloud.auth.onAuthStateChange((_e, s) => {
      setSession(s);
    });
    cloud.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) {
      setSavedIds(new Set());
      return;
    }
    let cancelled = false;
    (async () => {
      const { data } = await cloud
        .from("saved_events")
        .select("event_id")
        .eq("user_id", session.user.id);
      if (cancelled) return;
      setSavedIds(new Set((data ?? []).map((r: { event_id: string }) => r.event_id)));
    })();
    return () => {
      cancelled = true;
    };
  }, [session]);

  const toggleSaved = useCallback(
    async (eventId: string | number) => {
      if (!session) {
        window.location.assign("/auth?redirect=" + encodeURIComponent(window.location.pathname));
        return;
      }
      const id = String(eventId);
      const has = savedIds.has(id);
      // optimistic
      setSavedIds((prev) => {
        const next = new Set(prev);
        if (has) next.delete(id);
        else next.add(id);
        return next;
      });
      if (has) {
        const { error } = await cloud
          .from("saved_events")
          .delete()
          .eq("user_id", session.user.id)
          .eq("event_id", id);
        if (error) {
          setSavedIds((prev) => new Set(prev).add(id));
        }
      } else {
        const { error } = await cloud
          .from("saved_events")
          .insert({ user_id: session.user.id, event_id: id });
        if (error) {
          setSavedIds((prev) => {
            const next = new Set(prev);
            next.delete(id);
            return next;
          });
        }
      }
    },
    [session, savedIds],
  );

  const signOut = useCallback(async () => {
    await cloud.auth.signOut();
  }, []);

  const value = useMemo<Ctx>(
    () => ({
      session,
      ready,
      savedIds,
      isSaved: (id) => savedIds.has(String(id)),
      toggleSaved,
      signOut,
    }),
    [session, ready, savedIds, toggleSaved, signOut],
  );

  return <SavedEventsContext.Provider value={value}>{children}</SavedEventsContext.Provider>;
}

export function useSavedEvents() {
  const ctx = useContext(SavedEventsContext);
  if (!ctx) throw new Error("useSavedEvents must be used within SavedEventsProvider");
  return ctx;
}