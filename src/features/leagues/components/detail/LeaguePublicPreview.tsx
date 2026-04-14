"use client";

import Image from "next/image";
import Link from "next/link";
import StatusBadge from "@/components/leagues/StatusBadge";
import type { LeagueDetailContentProps } from "@/features/leagues/components/detail/types";
import { FORMAT_LABELS } from "@/lib/league-types";
import { getInitials } from "@/lib/league-utils";
import { getSportCoverImage } from "@/features/leagues/components/detail/sportCover";

type Props = {
  data: LeagueDetailContentProps;
};

export default function LeaguePublicPreview({ data }: Props) {
  const {
    league,
    members,
    ownerMember,
    isAuthenticated,
    isFull,
    joining,
    onHandleJoin,
  } = data;

  return (
    <div className="space-y-8">
      {/* ── Hero Banner ── */}
      <section className="relative rounded-3xl">
        <div className="absolute inset-0 overflow-hidden rounded-3xl">
          <Image
            src={getSportCoverImage(league.sport_type)}
            alt=""
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/10" />
        </div>

        <div className="relative z-10 flex min-h-[280px] flex-col justify-end p-6 sm:min-h-[340px] sm:p-8">
          {/* Top-left badges */}
          <div className="absolute left-6 top-6 flex flex-wrap items-center gap-2 sm:left-8 sm:top-8">
            <span className="inline-flex items-center rounded-full bg-white/20 px-3 py-1 text-xs font-medium capitalize text-white backdrop-blur-sm">
              {league.sport_type?.replace(/_/g, " ") || "Sport"}
            </span>
            <StatusBadge status={league.status} />
          </div>

          {/* Bottom content */}
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <h1 className="text-3xl font-bold text-white sm:text-4xl break-words">
                {league.name}
              </h1>
              {league.description && (
                <p className="mt-2 max-w-xl text-sm text-white/70 leading-relaxed line-clamp-2">
                  {league.description}
                </p>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {!isFull && isAuthenticated && (
                <button
                  type="button"
                  onClick={onHandleJoin}
                  disabled={joining}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-orange-500 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-orange-600 disabled:opacity-50"
                >
                  {joining ? "Joining..." : "Join League"}
                </button>
              )}
              {!isAuthenticated && (
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center rounded-full bg-orange-500 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-orange-600"
                >
                  Log in to Join
                </Link>
              )}
              {isFull && (
                <span className="inline-flex items-center rounded-full bg-white/15 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm">
                  League is Full
                </span>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── League Info Card ── */}
      <div className="mx-auto max-w-2xl">
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 sm:p-6">
          {/* Host */}
          {ownerMember && (
            <div className="flex items-center gap-3 mb-5">
              {ownerMember.avatar_url ? (
                <Image
                  src={ownerMember.avatar_url}
                  alt={ownerMember.name || "Host"}
                  width={44}
                  height={44}
                  className="h-11 w-11 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-zinc-200 text-sm font-semibold text-zinc-600">
                  {getInitials(ownerMember.name)}
                </div>
              )}
              <div>
                <p className="text-sm font-semibold text-zinc-900">
                  {ownerMember.name || "League Owner"}
                </p>
                <p className="text-xs text-zinc-500">League Host</p>
              </div>
            </div>
          )}

          <div className="border-t border-zinc-100 pt-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-xl bg-zinc-50 border border-zinc-100 px-3 py-2.5 text-center">
                <div className="text-[11px] uppercase tracking-wide text-zinc-500 font-medium">
                  Players
                </div>
                <div className="mt-0.5 text-sm font-semibold text-zinc-900">
                  {members.length}/{league.max_members}
                </div>
              </div>
              <div className="rounded-xl bg-zinc-50 border border-zinc-100 px-3 py-2.5 text-center">
                <div className="text-[11px] uppercase tracking-wide text-zinc-500 font-medium">
                  Format
                </div>
                <div className="mt-0.5 text-sm font-semibold text-zinc-900 break-words">
                  {FORMAT_LABELS[league.scoring_format]}
                </div>
              </div>
              <div className="rounded-xl bg-zinc-50 border border-zinc-100 px-3 py-2.5 text-center">
                <div className="text-[11px] uppercase tracking-wide text-zinc-500 font-medium">
                  Type
                </div>
                <div className="mt-0.5 text-sm font-semibold text-zinc-900 capitalize">
                  {league.league_type}
                </div>
              </div>
              <div className="rounded-xl bg-zinc-50 border border-zinc-100 px-3 py-2.5 text-center">
                <div className="text-[11px] uppercase tracking-wide text-zinc-500 font-medium">
                  Season
                </div>
                <div className="mt-0.5 text-sm font-semibold text-zinc-900">
                  {league.season_weeks ? `${league.season_weeks} weeks` : "Open"}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Locked Content Hint ── */}
      <div className="mx-auto max-w-2xl">
        <div className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 p-8 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100">
            <svg
              className="h-6 w-6 text-zinc-400"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M10 1a4.5 4.5 0 0 0-4.5 4.5V9H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2h-.5V5.5A4.5 4.5 0 0 0 10 1Zm3 8V5.5a3 3 0 1 0-6 0V9h6Z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <p className="text-sm font-medium text-zinc-600">
            Join this league to see standings, matches, and results
          </p>
          <p className="mt-1 text-xs text-zinc-400">
            Members get access to full league details and match history
          </p>
        </div>
      </div>
    </div>
  );
}
