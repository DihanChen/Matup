import { SupabaseClient } from "@supabase/supabase-js";

type EventRow = {
  id: string;
  title: string;
  description: string | null;
  sport_type: string;
  location: string;
  datetime: string;
  max_participants: number;
  creator_id: string;
  created_at: string;
  latitude: number | null;
  longitude: number | null;
  skill_level: string;
  cover_url?: string | null;
};

type ProfileRow = {
  id: string;
  name: string | null;
};

type ParticipantRow = {
  event_id: string;
};

export type EventWithMetadata = EventRow & {
  participant_count: number;
  creator_name: string;
};

export async function getCurrentUserId(
  supabase: SupabaseClient
): Promise<string | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

export async function getUpcomingEventsWithMetadata(
  supabase: SupabaseClient,
  sportFilter: string
): Promise<EventWithMetadata[]> {
  let query = supabase
    .from("events")
    .select("*")
    .gte("datetime", new Date().toISOString())
    .order("datetime", { ascending: true });

  if (sportFilter) {
    query = query.eq("sport_type", sportFilter);
  }

  const { data: eventsData, error } = await query;
  if (error || !eventsData || eventsData.length === 0) {
    return [];
  }

  const eventIds = eventsData.map((event) => event.id);
  const creatorIds = [...new Set(eventsData.map((event) => event.creator_id))];

  const [{ data: participantsData }, { data: profilesData }] = await Promise.all([
    supabase.from("event_participants").select("event_id").in("event_id", eventIds),
    supabase.from("profiles").select("id, name").in("id", creatorIds),
  ]);

  const counts: Record<string, number> = {};
  (participantsData as ParticipantRow[] | null)?.forEach((participant) => {
    counts[participant.event_id] = (counts[participant.event_id] || 0) + 1;
  });

  const creatorNames: Record<string, string> = {};
  (profilesData as ProfileRow[] | null)?.forEach((profile) => {
    creatorNames[profile.id] = profile.name || "Anonymous";
  });

  return eventsData.map((event) => ({
    ...(event as EventRow),
    participant_count: counts[event.id] || 0,
    creator_name: creatorNames[event.creator_id] || "Anonymous",
  }));
}
