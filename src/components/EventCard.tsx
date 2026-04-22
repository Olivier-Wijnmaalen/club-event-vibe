import type { EventRow } from "@/lib/supabase";

interface Props {
  event: EventRow;
}

function formatTime(iso: string | null): string | null {
  if (!iso) return null;
  // Extract HH:MM directly from the stored timestamp so we show the
  // event's local time (as stored), not the viewer's browser time.
  const match = iso.match(/T(\d{2}):(\d{2})/);
  if (match) return `${match[1]}:${match[2]}`;
  const spaceMatch = iso.match(/\s(\d{2}):(\d{2})/);
  if (spaceMatch) return `${spaceMatch[1]}:${spaceMatch[2]}`;
  return null;
}

export function EventCard({ event }: Props) {
  const href = event.source_url ?? event.ticket_url;
  const hasLink = Boolean(href);
  const Wrapper: React.ElementType = hasLink ? "a" : "div";
  const wrapperProps = hasLink
    ? { href: href!, target: "_blank", rel: "noopener noreferrer" }
    : {};

  const start = formatTime(event.start_datetime);
  const end = formatTime(event.end_datetime);
  const timeLabel = start && end ? `${start} – ${end}` : (start ?? end);

  return (
    <Wrapper
      {...wrapperProps}
      className="group block rounded-lg border border-border bg-card p-5 transition-all duration-200 hover:border-primary/60 hover:bg-card/80 active:scale-[0.99]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="text-xs font-medium uppercase tracking-[0.18em] text-primary/90">
            {event.club_name ?? "Unknown club"}
          </div>
          <h3 className="mt-1.5 text-xl font-bold leading-tight text-foreground sm:text-2xl">
            {event.party_name ?? "Untitled event"}
          </h3>
        </div>
        {timeLabel && (
          <span className="shrink-0 whitespace-nowrap pt-0.5 text-xs font-medium tabular-nums text-muted-foreground sm:text-sm">
            {timeLabel}
          </span>
        )}
      </div>
      {event.artist_text && (
        <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
          {event.artist_text}
        </p>
      )}
    </Wrapper>
  );
}