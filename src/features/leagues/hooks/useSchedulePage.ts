"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { getApiBaseUrl } from "@/lib/api";
import type {
  ApiFixture,
  League,
  LeagueMatch,
  LeagueMember,
} from "@/lib/league-types";
import { mapFixturesToMatches } from "@/lib/league-types";

export type ScheduleLeague = Pick<
  League,
  "id" | "name" | "sport_type" | "scoring_format" | "league_type" | "season_weeks"
>;

export type ScheduleMember = Pick<LeagueMember, "user_id" | "role" | "name" | "avatar_url">;

export function useSchedulePage() {
  const params = useParams();
  const router = useRouter();
  const leagueId = params.id as string;

  const [league, setLeague] = useState<ScheduleLeague | null>(null);
  const [members, setMembers] = useState<ScheduleMember[]>([]);
  const [matches, setMatches] = useState<LeagueMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isOwnerOrAdmin, setIsOwnerOrAdmin] = useState(false);

  useEffect(() => {
    async function fetchData() {
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      setCurrentUserId(user.id);

      const { data: leagueData } = await supabase
        .from("leagues")
        .select("id, name, sport_type, scoring_format, league_type, season_weeks")
        .eq("id", leagueId)
        .single();

      if (!leagueData) {
        router.push("/leagues");
        return;
      }

      setLeague(leagueData);

      // Check membership (all members can view schedule)
      const { data: membersData } = await supabase
        .from("league_members")
        .select("user_id, role")
        .eq("league_id", leagueId);

      const currentMember = membersData?.find((m) => m.user_id === user.id);
      if (!currentMember) {
        router.push(`/leagues/${leagueId}`);
        return;
      }

      setIsOwnerOrAdmin(currentMember.role === "owner" || currentMember.role === "admin");

      // Get member profiles
      if (membersData && membersData.length > 0) {
        const userIds = membersData.map((m) => m.user_id);
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, name, avatar_url")
          .in("id", userIds);

        const membersWithInfo: ScheduleMember[] = membersData.map((m) => ({
          user_id: m.user_id,
          role: m.role,
          name: profiles?.find((p) => p.id === m.user_id)?.name ?? null,
          avatar_url: profiles?.find((p) => p.id === m.user_id)?.avatar_url ?? null,
        }));

        setMembers(membersWithInfo);
      }

      // Fetch fixtures via backend API
      let allMatches: LeagueMatch[] = [];

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.access_token) {
        try {
          const response = await fetch(
            `${getApiBaseUrl()}/api/leagues/${leagueId}/fixtures`,
            {
              headers: {
                Authorization: `Bearer ${session.access_token}`,
              },
            }
          );

          if (response.ok) {
            const data = (await response.json()) as { fixtures?: ApiFixture[] };
            if (data.fixtures && data.fixtures.length > 0) {
              allMatches = mapFixturesToMatches(
                data.fixtures.filter((f) => f.status !== "cancelled")
              );
            }
          }
        } catch {
          // Silently handle fixture fetch failures
        }
      }

      setMatches(allMatches);
      setLoading(false);
    }

    fetchData();
  }, [leagueId, router]);

  return {
    leagueId,
    league,
    members,
    matches,
    loading,
    currentUserId,
    isOwnerOrAdmin,
  };
}
