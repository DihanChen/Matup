"use client";

import HeaderCard from "@/features/leagues/components/detail/HeaderCard";
import LeagueDetailSidebar from "@/features/leagues/components/detail/LeagueDetailSidebar";
import PendingReviewsCard from "@/features/leagues/components/detail/PendingReviewsCard";
import RecentResultsCard from "@/features/leagues/components/detail/RecentResultsCard";
import RunningSessionsCard from "@/features/leagues/components/detail/RunningSessionsCard";
import StandingsCard from "@/features/leagues/components/detail/StandingsCard";
import type { LeagueDetailContentProps } from "@/features/leagues/components/detail/types";
import UpcomingMatchesCard from "@/features/leagues/components/detail/UpcomingMatchesCard";

export type { LeagueDetailContentProps } from "@/features/leagues/components/detail/types";

export default function LeagueDetailContent(props: LeagueDetailContentProps) {
  return (
    <div className="grid xl:grid-cols-12 gap-6 lg:gap-8">
      <div className="xl:col-span-8 grid grid-cols-1 md:grid-cols-12 gap-6 auto-rows-min">
        <HeaderCard data={props} />
        {props.needsTeamSetup && (
          <section className="md:col-span-12 rounded-3xl border border-amber-300 bg-gradient-to-r from-amber-50 to-orange-50 p-5 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path
                      fillRule="evenodd"
                      d="M18 10A8 8 0 1 1 2 10a8 8 0 0 1 16 0Zm-8-4a.75.75 0 0 0-.75.75v4.25a.75.75 0 0 0 1.5 0V6.75A.75.75 0 0 0 10 6Zm0 8a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"
                      clipRule="evenodd"
                    />
                  </svg>
                </span>
                <div>
                  <h2 className="text-base sm:text-lg font-semibold text-amber-900">
                    Set Up Your Doubles Teams
                  </h2>
                  <p className="text-sm text-amber-800 mt-1">
                    Pair your members into fixed teams before generating the schedule.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={props.onOpenAssignedTeamsModal}
                className="inline-flex items-center justify-center px-4 py-2.5 rounded-full bg-amber-500 text-white text-sm font-medium hover:bg-amber-600 transition-colors"
              >
                Set Up Teams
              </button>
            </div>
          </section>
        )}
        <StandingsCard data={props} />
        <RecentResultsCard data={props} />
        <RunningSessionsCard data={props} />
        <PendingReviewsCard data={props} />
        <UpcomingMatchesCard data={props} />
      </div>

      <LeagueDetailSidebar data={props} />
    </div>
  );
}
