import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Search, X } from "lucide-react";
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
  const [query, setQuery] = useState("");

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

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return artists;
    return artists.filter((a) => a.name.toLowerCase().includes(q));
  }, [artists, query]);

  const groups = useMemo(() => {
    const map = new Map<string, { name: string; count: number }[]>();
    for (const a of filtered) {
      const first = a.name.charAt(0).toUpperCase();
      const letter = /[A-Z]/.test(first) ? first : "#";
      if (!map.has(letter)) map.set(letter, []);
      map.get(letter)!.push(a);
    }
    return Array.from(map.entries()).sort(([a], [b]) => {
      if (a === "#") return 1;
      if (b === "#") return -1;
      return a < b ? -1 : a > b ? 1 : 0;
    });
  }, [filtered]);

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

      <div className="sticky top-[60px] z-20 -mx-4 border-b border-border bg-background/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/80 sm:top-[68px]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search artists"
            className="w-full rounded-md border border-border bg-card py-2.5 pl-9 pr-9 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Clear search"
              className="absolute right-2 top-1/2 inline-flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {events === null && (
        <div className="space-y-2 pt-4">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-12 animate-pulse rounded-md border border-border bg-card/60" />
          ))}
        </div>
      )}

      {events !== null && filtered.length === 0 && (
        <div className="mt-20 text-center">
          <div className="text-sm font-bold uppercase tracking-[0.25em] text-primary">
            {error ? "Couldn't load artists" : query ? "No matches" : "No artists yet"}
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            {error ?? (query ? "Try a different search." : "Check back soon.")}
          </p>
        </div>
      )}

      <div className="mt-4">
        {groups.map(([letter, items]) => (
          <section key={letter} className="mb-4">
            <div className="sticky top-[124px] z-10 -mx-4 border-y border-border bg-background/95 px-4 py-1.5 backdrop-blur supports-[backdrop-filter]:bg-background/80 sm:top-[132px]">
              <span className="text-xs font-black uppercase tracking-[0.25em] text-primary">
                {letter}
              </span>
            </div>
            <ul className="divide-y divide-border overflow-hidden border-x border-b border-border bg-card">
              {items.map((a) => (
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
          </section>
        ))}
      </div>
    </AppLayout>
  );
}