import type { EventRow } from "@/lib/supabase";

interface Props {
  event: EventRow;
}

export function EventCard({ event }: Props) {
  const href = event.source_url ?? event.ticket_url;
  const hasLink = Boolean(href);
  const Wrapper: React.ElementType = hasLink ? "a" : "div";
  const wrapperProps = hasLink
    ? { href: href!, target: "_blank", rel: "noopener noreferrer" }
    : {};

  return (
    <Wrapper
      {...wrapperProps}
      className="group block rounded-lg border border-border bg-card p-5 transition-all duration-200 hover:border-primary/60 hover:bg-card/80 active:scale-[0.99]"
    >
      <div className="text-xs font-medium uppercase tracking-[0.18em] text-primary/90">
        {event.club_name ?? "Unknown club"}
      </div>
      <h3 className="mt-1.5 text-xl font-bold leading-tight text-foreground sm:text-2xl">
        {event.party_name ?? "Untitled event"}
      </h3>
      {event.artist_text && (
        <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
          {event.artist_text}
        </p>
      )}
    </Wrapper>
  );
}