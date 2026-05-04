import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ChevronLeft } from "lucide-react";
import { supabase, type EventRow } from "@/lib/supabase";
import { AppLayout } from "@/components/AppLayout";
import { EventCard } from "@/components/EventCard";
import { DateHeader } from "@/components/DateHeader";
import { artistFromSlug, eventHasArtist, parseArtists } from "@/lib/artists";

export const Route = createFileRoute("/artists/$slug")({
  component: ArtistDetail,
  head: () => ({
    meta: [
      { title: "Artist — Club Carousel" },
      { name: "description", content: "All upcoming events for this artist." },
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

function ArtistDetail() {
  const { slug } = Route.useParams();
  const artistLower = artistFromSlug(slug);

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
        .or(`start_datetime.gte.${nowIso},event_date.gte.${todayDate}`)
        .order("start_datetime", { ascending: true, nullsFirst: false })
        .order("event_date", { ascending: true, nullsFirst: false });

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

  const filtered = useMemo(
    () => (events ?? []).filter((e) => eventHasArtist(e, artistLower)),
    [events, artistLower],
  );

  const displayName = useMemo(() => {
    for (const e of filtered) {
      const match = parseArtists(e.artist_text).find(
        (a) => a.toLowerCase() === artistLower,
      );
      if (match) return match;
    }
    return artistLower;
  }, [filtered, artistLower]);

  const groups = useMemo(() => {
    const map = new Map<string, { date: Date; items: EventRow[] }>();
    for (const e of filtered) {
      const d = getGroupingDate(e);
      if (!d) continue;
      const key = dateKey(d);
      const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      if (!map.has(key)) map.set(key, { date: dayStart, items: [] });
      map.get(key)!.items.push(e);
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
      .map(([key, value]) => ({ key, ...value }));
  }, [filtered]);

  return (
    <AppLayout>
      <div className="pb-2 pt-4">
        <Link
          to="/artists"
          className="inline-flex items-center gap-1 text-xs uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:text-primary"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          All artists
        </Link>
        <h1 className="mt-2 text-2xl font-black uppercase tracking-[0.12em] text-primary sm:text-3xl">
          {displayName}
        </h1>
        <p className="mt-1 text-xs uppercase tracking-[0.25em] text-muted-foreground">
          {events === null
            ? "Loading…"
            : filtered.length === 0
              ? "No upcoming shows"
              : `${filtered.length} upcoming ${filtered.length === 1 ? "show" : "shows"}`}
        </p>
      </div>

      {events === null && (
        <div className="space-y-3 pt-6">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-lg border border-border bg-card/60" />
          ))}
        </div>
      )}

      {events !== null && filtered.length === 0 && (
        <div className="mt-16 text-center">
          <p className="text-sm text-muted-foreground">
            {error ?? "This artist has no upcoming shows."}
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