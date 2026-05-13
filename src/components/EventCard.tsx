import type { EventRow } from "@/lib/supabase";
import { Bookmark } from "lucide-react";
import { useSavedEvents } from "@/lib/savedEvents";
import radioRadioLogo from "@/assets/clubs/radioradio.png";
import skatecafeLogo from "@/assets/clubs/skatecafe.png";
import tillatecLogo from "@/assets/clubs/tillatec.png";
import garageNoordLogo from "@/assets/clubs/garagenoord.jpeg";
import nachbarLogo from "@/assets/clubs/nachbar.jpeg";

const CLUB_LOGOS: Record<string, string> = {
  "radio radio": radioRadioLogo,
  skatecafe: skatecafeLogo,
  tillatec: tillatecLogo,
  "garage noord": garageNoordLogo,
  nachbar: nachbarLogo,
};

function clubLogo(name: string | null): string | null {
  if (!name) return null;
  return CLUB_LOGOS[name.trim().toLowerCase()] ?? null;
}

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
  const { isSaved, toggleSaved } = useSavedEvents();
  const saved = isSaved(event.id);
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
      className="group relative block rounded-lg border border-border/60 bg-card/70 p-5 pb-12 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.8)] backdrop-blur-md transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/60 hover:bg-card/80 hover:shadow-[0_20px_40px_-12px_rgba(220,38,38,0.45)] active:scale-[0.99]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-[0.18em] text-primary/90">
            {clubLogo(event.club_name) && (
              <img
                src={clubLogo(event.club_name)!}
                alt=""
                aria-hidden="true"
                className="h-3 w-3 shrink-0 rounded-sm object-cover"
              />
            )}
            <span>{event.club_name ?? "Unknown club"}</span>
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
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          toggleSaved(event.id);
        }}
        aria-label={saved ? "Unsave event" : "Save event"}
        aria-pressed={saved}
        className={`absolute bottom-3 right-3 inline-flex h-9 w-9 items-center justify-center rounded-full transition-colors ${
          saved
            ? "text-primary hover:bg-primary/10"
            : "text-muted-foreground hover:bg-card hover:text-primary"
        }`}
      >
        <Bookmark className="h-5 w-5" fill={saved ? "currentColor" : "none"} />
      </button>
    </Wrapper>
  );
}