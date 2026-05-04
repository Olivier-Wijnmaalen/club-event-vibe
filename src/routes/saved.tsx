import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase, type EventRow } from "@/lib/supabase";
import { AppLayout } from "@/components/AppLayout";
import { EventCard } from "@/components/EventCard";
import { DateHeader } from "@/components/DateHeader";
import { useSavedEvents } from "@/lib/savedEvents";

export const Route = createFileRoute("/saved")({
  component: SavedPage,
  head: () => ({
    meta: [
      { title: "Saved Events — Club Carousel" },
      { name: "description", content: "Your bookmarked club nights." },
    ],
  }),
});

function getGroupingDate(e: EventRow): Date | null {
  const raw = e.start_datetime ?? e.event_date;
  if (!raw) return null;
  const m = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return null;
  return new Date(+m[1], +m[2] - 1, +m[3]);
}

function dateKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function SavedPage() {
  const { session, ready, savedIds } = useSavedEvents();
  const [events, setEvents] = useState<EventRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ready || !session || savedIds.size === 0) {
      if (ready) setEvents([]);
      return;
    }
    let cancelled = false;
    (async () => {
      const ids = Array.from(savedIds);
      const { data, error } = await supabase
        .from("events")
        .select("id, club_name, party_name, artist_text, event_date, ticket_url, source_url, start_datetime, end_datetime")
        .in("id", ids);
      if (cancelled) return;
      if (error) {
        setError(error.message);
        setEvents([]);
        return;
      }
      setEvents(data ?? []);
    })();
    return () => {
      cancelled = true;
    };
  }, [ready, session, savedIds]);

  const groups = useMemo(() => {
    if (!events) return [];
    const map = new Map<string, { date: Date; items: EventRow[] }>();
    for (const e of events) {
      const d = getGroupingDate(e);
      if (!d) continue;
      const key = dateKey(d);
      if (!map.has(key)) map.set(key, { date: d, items: [] });
      map.get(key)!.items.push(e);
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
      .map(([key, v]) => ({ key, ...v }));
  }, [events]);

  return (
    <AppLayout>
      <div className="pb-2 pt-4">
        <h1 className="text-2xl font-black uppercase tracking-[0.18em] text-primary">
          Saved Events
        </h1>
        <p className="mt-1 text-xs uppercase tracking-[0.25em] text-muted-foreground">
          Your personal bookmarks
        </p>
      </div>

      {ready && !session && (
        <div className="mt-16 text-center">
          <p className="text-sm text-muted-foreground">Sign in to view your saved events.</p>
          <Link
            to="/auth"
            search={{ redirect: "/saved" }}
            className="mt-4 inline-block rounded-md bg-primary px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-primary-foreground"
          >
            Sign in
          </Link>
        </div>
      )}

      {session && events === null && (
        <div className="space-y-3 pt-6">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-lg border border-border bg-card/60" />
          ))}
        </div>
      )}

      {session && events !== null && groups.length === 0 && (
        <div className="mt-16 text-center">
          <p className="text-sm text-muted-foreground">
            {error ?? "You haven't saved any events yet. Tap the bookmark on an event to save it."}
          </p>
        </div>
      )}

      {groups.map((g) => (
        <section key={g.key} className="mb-6">
          <DateHeader date={g.date} />
          <div className="space-y-3 pt-3">
            {g.items.map((e) => (
              <EventCard key={String(e.id)} event={e} />
            ))}
          </div>
        </section>
      ))}
    </AppLayout>
  );
}