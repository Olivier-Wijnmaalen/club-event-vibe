import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase, type EventRow } from "@/lib/supabase";
import { AppLayout } from "@/components/AppLayout";
import { parseArtists, artistSlug } from "@/lib/artists";

export const Route = createFileRoute("/artists/")({
  component: ArtistsIndex,
  head: () => ({
    meta: [
      { title: "Artists — Club Carousel" },
      { name: "description", content: "Browse all artists playing in upcoming club nights." },
    ],
  }),
});

function ArtistsIndex() {
  const [events, setEvents] = useState<EventRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const nowIso = new Date().toISOString();
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayDate = today.toISOString().slice(0, 10);

      const { data, error } = await supabase
        .from("events")
        .select("id, club_name, party_name, artist_text, event_date, ticket_url, source_url, start_datetime, end_datetime")
        .or(`start_datetime.gte.${nowIso},event_date.gte.${todayDate}`);

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
  }, []);

  const artists = useMemo(() => {
    if (!events) return [];
    const map = new Map<string, { name: string; count: number }>();
    for (const e of events) {
      for (const a of parseArtists(e.artist_text)) {
        const key = a.toLowerCase();
        const existing = map.get(key);
        if (existing) existing.count += 1;
        else map.set(key, { name: a, count: 1 });
      }
    }
    return Array.from(map.values()).sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { sensitivity: "base" }),
    );
  }, [events]);

  return (
    <AppLayout>
      <div className="pb-2 pt-4">
        <h1 className="text-2xl font-black uppercase tracking-[0.18em] text-primary">
          Artists
        </h1>
        <p className="mt-1 text-xs uppercase tracking-[0.25em] text-muted-foreground">
          {artists.length > 0 ? `${artists.length} playing soon` : "Upcoming lineup"}
        </p>
      </div>

      {events === null && (
        <div className="space-y-2 pt-4">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-12 animate-pulse rounded-md border border-border bg-card/60" />
          ))}
        </div>
      )}

      {events !== null && artists.length === 0 && (
        <div className="mt-20 text-center">
          <div className="text-sm font-bold uppercase tracking-[0.25em] text-primary">
            {error ? "Couldn't load artists" : "No artists yet"}
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            {error ?? "Check back soon."}
          </p>
        </div>
      )}

      <ul className="mt-4 divide-y divide-border overflow-hidden rounded-lg border border-border bg-card">
        {artists.map((a) => (
          <li key={a.name.toLowerCase()}>
            <Link
              to="/artists/$slug"
              params={{ slug: artistSlug(a.name) }}
              className="flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-background/40 active:bg-background/60"
            >
              <span className="truncate text-sm font-medium text-foreground">{a.name}</span>
              <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                {a.count} {a.count === 1 ? "show" : "shows"}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </AppLayout>
  );
}