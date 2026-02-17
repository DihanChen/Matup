"use client";

import Image from "next/image";
import Link from "next/link";
import type { LeagueDetailContentProps } from "@/features/leagues/components/detail/types";
import { getInitials } from "@/lib/league-utils";

type Props = {
  data: LeagueDetailContentProps;
};

export default function SidebarHostCard({ data }: Props) {
  const {
    ownerMember,
    completedMatches,
    pendingReviewMatches,
    members,
    league,
  } = data;

  if (!ownerMember) return null;

  return (
    <div className="bg-zinc-50 rounded-3xl border border-zinc-200 p-5">
      <h2 className="text-xs font-semibold tracking-wide uppercase text-zinc-500 mb-3">Hosted by</h2>
      <Link href={`/users/${ownerMember.user_id}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
        {ownerMember.avatar_url ? (
          <Image
            src={ownerMember.avatar_url}
            alt={ownerMember.name || "Host"}
            width={44}
            height={44}
            className="w-11 h-11 rounded-full object-cover"
          />
        ) : (
          <div className="w-11 h-11 rounded-full bg-zinc-300 text-white flex items-center justify-center font-semibold text-sm">
            {getInitials(ownerMember.name)}
          </div>
        )}
        <div>
          <p className="font-semibold text-zinc-900">{ownerMember.name || "League Owner"}</p>
          <p className="text-xs text-zinc-500 capitalize">{ownerMember.role}</p>
        </div>
      </Link>
      <div className="grid grid-cols-3 gap-2 mt-4 text-center">
        <div className="bg-white border border-zinc-200 rounded-2xl px-2 py-2">
          <div className="text-xs text-zinc-500">Results</div>
          <div className="text-sm font-semibold text-zinc-900">{completedMatches.length}</div>
        </div>
        <div className="bg-white border border-zinc-200 rounded-2xl px-2 py-2">
          <div className="text-xs text-zinc-500">Pending</div>
          <div className="text-sm font-semibold text-zinc-900">{pendingReviewMatches.length}</div>
        </div>
        <div className="bg-white border border-zinc-200 rounded-2xl px-2 py-2">
          <div className="text-xs text-zinc-500">Capacity</div>
          <div className="text-sm font-semibold text-zinc-900">{members.length}/{league.max_members}</div>
        </div>
      </div>
    </div>
  );
}
