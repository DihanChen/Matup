"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

type League = {
  id: string;
  name: string;
  sport_type: string;
  scoring_format: string;
  league_type: string;
  status: string;
  max_members: number;
  created_at: string;
  creator_id: string;
  member_count: number;
};

const FORMAT_LABELS: Record<string, string> = {
  team_vs_team: "Team vs Team",
  individual_time: "Time Trial",
  individual_points: "Points",
  singles: "Singles",
  doubles: "Doubles",
};

export default function LeaguesPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isPremium, setIsPremium] = useState(false);
  const [ownedLeagues, setOwnedLeagues] = useState<League[]>([]);
  const [joinedLeagues, setJoinedLeagues] = useState<League[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    async function fetchData() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      setUser(user);

      // Check premium
      const { data: profile } = await supabase
        .from("profiles")
        .select("is_premium")
        .eq("id", user.id)
        .single();

      setIsPremium(profile?.is_premium ?? false);

      // Get all league memberships
      const { data: memberships } = await supabase
        .from("league_members")
        .select("league_id, role")
        .eq("user_id", user.id);

      if (memberships && memberships.length > 0) {
        const leagueIds = memberships.map((m) => m.league_id);

        const { data: leagues } = await supabase
          .from("leagues")
          .select("*")
          .in("id", leagueIds)
          .order("created_at", { ascending: false });

        if (leagues) {
          // Get member counts
          const { data: allMembers } = await supabase
            .from("league_members")
            .select("league_id")
            .in("league_id", leagueIds);

          const countMap: Record<string, number> = {};
          allMembers?.forEach((m) => {
            countMap[m.league_id] = (countMap[m.league_id] || 0) + 1;
          });

          const leaguesWithCount = leagues.map((l) => ({
            ...l,
            member_count: countMap[l.id] || 0,
          }));

          const owned = leaguesWithCount.filter(
            (l) => l.creator_id === user.id
          );
          const joined = leaguesWithCount.filter(
            (l) => l.creator_id !== user.id
          );

          setOwnedLeagues(owned);
          setJoinedLeagues(joined);
        }
      }

      setLoading(false);
    }

    fetchData();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="flex items-center justify-center py-20">
          <div className="text-zinc-500">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">

      <main className="max-w-[980px] mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-zinc-900 mb-2">
              My <span className="text-orange-500">Leagues</span>
            </h1>
            <p className="text-zinc-500">Create leagues, track standings, and play with your crew</p>
          </div>
          {isPremium ? (
            <Link
              href="/leagues/create"
              className="px-4 py-2.5 bg-zinc-900 text-white rounded-full text-sm font-medium hover:bg-zinc-800 transition-colors flex items-center gap-2"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Create League
            </Link>
          ) : (
            <div className="px-4 py-2.5 bg-amber-50 border border-amber-200 rounded-full text-sm font-medium text-amber-700 flex items-center gap-2">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              Premium Required
            </div>
          )}
        </div>

        {/* Leagues I Own */}
        <section className="mb-8 sm:mb-12">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h2 className="text-lg sm:text-xl font-semibold text-zinc-900">
              Leagues I Own
            </h2>
            <span className="text-xs sm:text-sm text-zinc-500">
              {ownedLeagues.length} league
              {ownedLeagues.length !== 1 ? "s" : ""}
            </span>
          </div>

          {ownedLeagues.length === 0 ? (
            <div className="bg-white rounded-2xl border border-zinc-200 p-6 sm:p-8 text-center">
              <p className="text-zinc-500 mb-4 text-sm sm:text-base">
                You haven&apos;t created any leagues yet.
              </p>
              {isPremium && (
                <Link
                  href="/leagues/create"
                  className="inline-block px-5 py-2.5 bg-zinc-900 text-white rounded-full text-sm font-medium hover:bg-zinc-800 transition-colors"
                >
                  Create Your First League
                </Link>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {ownedLeagues.map((league) => (
                <LeagueCard key={league.id} league={league} />
              ))}
            </div>
          )}
        </section>

        {/* Leagues I'm In */}
        <section>
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h2 className="text-lg sm:text-xl font-semibold text-zinc-900">
              Leagues I&apos;m In
            </h2>
            <span className="text-xs sm:text-sm text-zinc-500">
              {joinedLeagues.length} league
              {joinedLeagues.length !== 1 ? "s" : ""}
            </span>
          </div>

          {joinedLeagues.length === 0 ? (
            <div className="bg-white rounded-2xl border border-zinc-200 p-6 sm:p-8 text-center">
              <p className="text-zinc-500 text-sm sm:text-base">
                You haven&apos;t joined any leagues yet.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {joinedLeagues.map((league) => (
                <LeagueCard key={league.id} league={league} />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function LeagueCard({ league }: { league: League }) {
  return (
    <Link
      href={`/leagues/${league.id}`}
      className="block bg-white rounded-2xl border border-zinc-200 hover:border-zinc-300 hover:shadow-sm transition-all p-4 sm:p-5 min-w-0"
    >
      <div className="flex items-start justify-between gap-2 mb-2 sm:mb-3">
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap min-w-0">
          {(league.scoring_format === "singles" || league.scoring_format === "doubles") ? (
            <span className="px-2 sm:px-2.5 py-0.5 sm:py-1 bg-orange-50 text-orange-600 text-xs font-medium rounded-full">
              Tennis
            </span>
          ) : (
            <span className="px-2 sm:px-2.5 py-0.5 sm:py-1 bg-orange-50 text-orange-600 text-xs font-medium rounded-full capitalize">
              {league.sport_type}
            </span>
          )}
          <span className="px-2 sm:px-2.5 py-0.5 sm:py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full">
            {FORMAT_LABELS[league.scoring_format] || league.scoring_format}
          </span>
        </div>
        <span
          className={`px-2 sm:px-2.5 py-0.5 sm:py-1 text-xs font-medium rounded-full shrink-0 ${
            league.status === "active"
              ? "bg-orange-50 text-orange-600"
              : league.status === "completed"
              ? "bg-zinc-100 text-zinc-500"
              : "bg-zinc-100 text-zinc-400"
          }`}
        >
          {league.status}
        </span>
      </div>

      <h3 className="font-semibold text-zinc-900 mb-2 sm:mb-3 text-sm sm:text-base break-words">
        {league.name}
      </h3>

      <div className="text-xs sm:text-sm text-zinc-500 flex items-center gap-3">
        <span className="flex items-center gap-1">
          <svg
            className="w-3.5 h-3.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
            />
          </svg>
          {league.member_count}/{league.max_members}
        </span>
        <span className="capitalize">{league.league_type}</span>
      </div>
    </Link>
  );
}
