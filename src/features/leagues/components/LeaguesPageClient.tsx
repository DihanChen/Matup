"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import StatusBadge from "@/components/leagues/StatusBadge";
import { ActivityIcon } from "@/components/create-event/ActivityCard";
import {
  getLeagueListData,
  type LeagueWithCount,
} from "@/lib/queries/leagues";

type League = LeagueWithCount;

type MembershipView = "all" | "owned" | "joined";
type LeagueWithRole = League & { membershipRole: "owner" | "member" };

const FORMAT_LABELS: Record<string, string> = {
  team_vs_team: "Team vs Team",
  individual_time: "Time Trial",
  individual_points: "Points",
  singles: "Singles",
  doubles: "Doubles",
};

function getSportKey(league: League): "tennis" | "pickleball" | "running" | "other" {
  if (league.sport_type === "pickleball") {
    return "pickleball";
  }
  if (league.sport_type === "tennis") {
    return "tennis";
  }
  if (league.sport_type === "running" || league.scoring_format === "individual_time") {
    return "running";
  }
  if (league.scoring_format === "singles" || league.scoring_format === "doubles") {
    return "tennis";
  }
  return "other";
}

function getSportLabel(league: League): string {
  const sport = getSportKey(league);
  if (sport === "tennis") return "Tennis";
  if (sport === "pickleball") return "Pickleball";
  if (sport === "running") return "Running";
  return league.sport_type;
}

function getSeasonProgress(league: League): { label: string; percent: number } | null {
  const totalWeeks = league.season_weeks ?? null;
  if (!totalWeeks || totalWeeks < 1) return null;
  if (!league.start_date) return { label: `Week 1 of ${totalWeeks}`, percent: 0 };

  const start = new Date(league.start_date);
  const now = new Date();
  if (Number.isNaN(start.getTime())) return { label: `Week 1 of ${totalWeeks}`, percent: 0 };

  if (start > now) {
    return { label: `Starts ${start.toLocaleDateString()}`, percent: 0 };
  }

  const msInWeek = 1000 * 60 * 60 * 24 * 7;
  const elapsedWeeks = Math.floor((now.getTime() - start.getTime()) / msInWeek) + 1;
  const currentWeek = Math.min(Math.max(elapsedWeeks, 1), totalWeeks);
  const percent = Math.round((currentWeek / totalWeeks) * 100);

  return {
    label: `Week ${currentWeek} of ${totalWeeks}`,
    percent: Math.min(Math.max(percent, 0), 100),
  };
}

export default function LeaguesPage() {
  const router = useRouter();
  const [isPremium, setIsPremium] = useState(false);
  const [ownedLeagues, setOwnedLeagues] = useState<League[]>([]);
  const [joinedLeagues, setJoinedLeagues] = useState<League[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [view, setView] = useState<MembershipView>("all");

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

      const leagueData = await getLeagueListData(supabase, user.id);
      setIsPremium(leagueData.isPremium);
      setOwnedLeagues(leagueData.ownedLeagues);
      setJoinedLeagues(leagueData.joinedLeagues);

      setLoading(false);
    }

    fetchData();
  }, [router]);

  const allLeagues = useMemo<LeagueWithRole[]>(
    () =>
      [
        ...ownedLeagues.map((league) => ({ ...league, membershipRole: "owner" as const })),
        ...joinedLeagues.map((league) => ({ ...league, membershipRole: "member" as const })),
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
    [ownedLeagues, joinedLeagues]
  );

  const visibleLeagues = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const byView =
      view === "owned"
        ? allLeagues.filter((league) => league.membershipRole === "owner")
        : view === "joined"
          ? allLeagues.filter((league) => league.membershipRole === "member")
          : allLeagues;

    if (!query) return byView;

    return byView.filter((league) => {
      const sportLabel = getSportLabel(league).toLowerCase();
      return (
        league.name.toLowerCase().includes(query) ||
        sportLabel.includes(query) ||
        league.scoring_format.toLowerCase().includes(query) ||
        league.league_type.toLowerCase().includes(query)
      );
    });
  }, [allLeagues, searchQuery, view]);

  const viewCounts = {
    all: allLeagues.length,
    owned: ownedLeagues.length,
    joined: joinedLeagues.length,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <main className="max-w-[980px] mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-6 animate-pulse">
          <div className="h-10 w-64 bg-zinc-200 rounded-xl" />
          <div className="h-12 w-full bg-zinc-100 rounded-full" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {[1, 2, 3, 4, 5, 6].map((card) => (
              <div key={`league-skeleton-card-${card}`} className="rounded-2xl border border-zinc-200 p-5">
                <div className="h-4 w-24 bg-zinc-200 rounded mb-3" />
                <div className="h-5 w-3/4 bg-zinc-200 rounded mb-3" />
                <div className="h-3 w-2/3 bg-zinc-100 rounded mb-2" />
                <div className="h-2 w-full bg-zinc-100 rounded" />
              </div>
            ))}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <main className="max-w-[980px] mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-zinc-900 mb-2">
              My <span className="text-orange-500">Leagues</span>
            </h1>
            <p className="text-zinc-500">Simple view of all your leagues in one place.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/leagues/join"
              className="flex-1 sm:flex-none text-center px-4 py-2.5 border border-zinc-200 text-zinc-700 rounded-full text-sm font-medium hover:bg-zinc-50 transition-colors"
            >
              Join by Code
            </Link>
            {isPremium ? (
              <Link
                href="/leagues/create"
                className="flex-1 sm:flex-none text-center px-4 py-2.5 bg-zinc-900 text-white rounded-full text-sm font-medium hover:bg-zinc-800 transition-colors"
              >
                Create League
              </Link>
            ) : (
              <div className="w-full sm:w-auto text-center px-4 py-2.5 bg-amber-50 border border-amber-200 rounded-full text-sm font-medium text-amber-700">
                Premium Required
              </div>
            )}
          </div>
        </div>

        <div className="mb-6 rounded-2xl border border-zinc-200 bg-white p-4 sm:p-5">
          <div className="relative mb-4">
            <svg
              className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400 pointer-events-none"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search leagues..."
              className="w-full pl-12 pr-4 py-3 rounded-full bg-zinc-100 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-300 focus:bg-white transition-all"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <ViewChip
              active={view === "all"}
              label={`All (${viewCounts.all})`}
              onClick={() => setView("all")}
            />
            <ViewChip
              active={view === "owned"}
              label={`Owned (${viewCounts.owned})`}
              onClick={() => setView("owned")}
            />
            <ViewChip
              active={view === "joined"}
              label={`Joined (${viewCounts.joined})`}
              onClick={() => setView("joined")}
            />
          </div>
        </div>

        {visibleLeagues.length === 0 ? (
          <EmptyLeaguesState
            title={
              searchQuery
                ? "No leagues match your search."
                : view === "owned"
                  ? "You have not created any leagues yet."
                  : view === "joined"
                    ? "You have not joined any leagues yet."
                    : "You have no leagues yet."
            }
            action={
              view !== "owned" ? (
                <Link
                  href="/leagues/join"
                  className="inline-flex items-center gap-2 px-5 py-2.5 border border-zinc-200 text-zinc-700 rounded-full text-sm font-medium hover:bg-zinc-50 transition-colors"
                >
                  Join League
                </Link>
              ) : isPremium ? (
                <Link
                  href="/leagues/create"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-zinc-900 text-white rounded-full text-sm font-medium hover:bg-zinc-800 transition-colors"
                >
                  Create League
                </Link>
              ) : null
            }
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {visibleLeagues.map((league) => (
              <LeagueCard key={league.id} league={league} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function ViewChip({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
        active ? "bg-orange-500 text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
      }`}
    >
      {label}
    </button>
  );
}

function EmptyLeaguesState({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-zinc-200 p-6 sm:p-8 text-center">
      <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-zinc-100 flex items-center justify-center">
        <svg className="w-5 h-5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>
      <p className="text-zinc-600 mb-4 text-sm sm:text-base">{title}</p>
      {action}
    </div>
  );
}

function LeagueCard({ league }: { league: LeagueWithRole }) {
  const seasonProgress = getSeasonProgress(league);
  const sportLabel = getSportLabel(league);
  const sport = getSportKey(league);

  return (
    <Link
      href={`/leagues/${league.id}`}
      className="group block bg-white rounded-2xl border border-zinc-200 hover:border-zinc-300 hover:shadow-sm transition-all p-4 sm:p-5 min-w-0"
    >
      <div className="h-1.5 rounded-full bg-gradient-to-r from-orange-500/80 to-amber-400/80 mb-3" />

      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-full bg-zinc-100 text-zinc-600 flex items-center justify-center shrink-0">
            {sport === "other" ? (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M12 4v16m8-8H4" />
              </svg>
            ) : (
              <ActivityIcon id={sport} className="w-4 h-4" />
            )}
          </div>

          <div className="flex items-center gap-1.5 flex-wrap min-w-0">
            <span className="px-2 py-0.5 bg-orange-50 text-orange-600 text-xs font-medium rounded-full capitalize">
              {sportLabel}
            </span>
            <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs font-medium rounded-full">
              {FORMAT_LABELS[league.scoring_format] || league.scoring_format}
            </span>
          </div>
        </div>
        <span
          className={`px-2 py-0.5 text-xs font-medium rounded-full ${
            league.membershipRole === "owner" ? "bg-amber-50 text-amber-700" : "bg-zinc-100 text-zinc-600"
          }`}
        >
          {league.membershipRole === "owner" ? "Owner" : "Member"}
        </span>
      </div>

      <h3 className="font-semibold text-zinc-900 mb-3 text-sm sm:text-base break-words group-hover:text-zinc-700">
        {league.name}
      </h3>

      <div className="text-xs sm:text-sm text-zinc-500 flex items-center gap-3 mb-3">
        <span className="flex items-center gap-1">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19.1a9.4 9.4 0 0 0 2.6.4 9.3 9.3 0 0 0 4.1-1 4.1 4.1 0 0 0-7.5-2.5M15 19.1v.1A12.3 12.3 0 0 1 8.6 21a12.4 12.4 0 0 1-6.4-1.8v-.1a6.4 6.4 0 0 1 12-3.1M12 6.4a3.4 3.4 0 1 1-6.8 0 3.4 3.4 0 0 1 6.8 0Zm8.3 2.2a2.6 2.6 0 1 1-5.2 0 2.6 2.6 0 0 1 5.2 0Z" />
          </svg>
          {league.member_count}/{league.max_members}
        </span>
        <span className="capitalize">{league.league_type}</span>
      </div>

      <div className="flex items-center justify-between gap-2">
        <StatusBadge status={league.status} />
        {seasonProgress ? (
          <span className="text-xs text-zinc-500">{seasonProgress.label}</span>
        ) : (
          <span className="text-xs text-zinc-400">No season timeline</span>
        )}
      </div>
    </Link>
  );
}
