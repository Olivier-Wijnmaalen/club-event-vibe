import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "@tanstack/react-router";
import { supabase, type EventRow } from "@/lib/supabase";
import { EventCard } from "@/components/EventCard";
import { DateHeader } from "@/components/DateHeader";
import { AppLayout } from "@/components/AppLayout";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "Club Carousel — Club agenda" },
      {
        name: "description",
        content: "The agenda of upcoming club nights, parties and artists.",
      },
    ],
  }),
});

function getGroupingDate(e: EventRow): Date | null {
  const raw = e.start_datetime ?? e.event_date;
  if (!raw) return null;
  // Extract Y-M-D directly from the stored string to avoid timezone shifts
  // (e.g. "2026-04-23 23:00:00+00" should group under Apr 23, not Apr 24
  // in browsers east of UTC).
  const m = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return null;
  return new Date(+m[1], +m[2] - 1, +m[3]);
}

function dateKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function Index() {
  const [events, setEvents] = useState<EventRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const nowIso = new Date().toISOString();
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayDate = today.toISOString().slice(0, 10);

      const { data, error } = await supabase
        .from("events")
        .select(
          "id, club_name, party_name, artist_text, event_date, ticket_url, source_url, start_datetime, end_datetime",
        )
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

  const groups = useMemo(() => {
    if (!events) return [];
    const map = new Map<string, { date: Date; items: EventRow[] }>();
    for (const e of events) {
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
  }, [events]);

  // Scroll to the date section indicated by the URL hash (#date-YYYY-MM-DD)
  useEffect(() => {
    if (!events || groups.length === 0) return;
    const hash =
      typeof window !== "undefined" ? window.location.hash.replace(/^#/, "") : "";
    if (!hash.startsWith("date-")) return;
    const target = hash.slice("date-".length);
    // Find the first group on or after the target date
    const match =
      groups.find((g) => g.key === target) ??
      groups.find((g) => g.key >= target);
    if (!match) return;
    requestAnimationFrame(() => {
      const el = document.getElementById(`date-${match.key}`);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, [events, groups, router.state.location.hash]);

  return (
    <AppLayout>
      {events === null && <LoadingState />}
      {events !== null && groups.length === 0 && <EmptyState error={error} />}
      {groups.map((g) => (
        <section key={g.key} id={`date-${g.key}`} className="mb-6 scroll-mt-24">
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

function LoadingState() {
  return (
    <div className="space-y-3 pt-6">
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className="h-28 animate-pulse rounded-lg border border-border bg-card/60"
        />
      ))}
    </div>
  );
}

function EmptyState({ error }: { error: string | null }) {
  return (
    <div className="mt-20 text-center">
      <div className="text-sm font-bold uppercase tracking-[0.25em] text-primary">
        {error ? "Couldn't load events" : "No upcoming events"}
      </div>
      <p className="mt-2 text-sm text-muted-foreground">
        {error ?? "Check back soon — the dancefloor never sleeps for long."}
      </p>
    </div>
  );
}
