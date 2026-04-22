import type { EventRow } from "@/lib/supabase";

export function parseArtists(text: string | null | undefined): string[] {
  if (!text) return [];
  return text
    .split(/\s*(?:,|&|\/| x | X | vs\.? | b2b )\s*/i)
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && s.length <= 80);
}

export function artistSlug(name: string): string {
  return encodeURIComponent(name.toLowerCase());
}

export function artistFromSlug(slug: string): string {
  return decodeURIComponent(slug).toLowerCase();
}

export function eventHasArtist(event: EventRow, artistLower: string): boolean {
  return parseArtists(event.artist_text).some(
    (a) => a.toLowerCase() === artistLower,
  );
}