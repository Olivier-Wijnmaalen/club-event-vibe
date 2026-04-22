import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://trucalgoqvyetsywtcix.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_9hJnNVSmxUb1LG8pqWsWPQ_jDVhi4Ss";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

export type EventRow = {
  id: string | number;
  club_name: string | null;
  party_name: string | null;
  artist_text: string | null;
  event_date: string | null;
  ticket_url: string | null;
  source_url: string | null;
  start_datetime: string | null;
  end_datetime: string | null;
};