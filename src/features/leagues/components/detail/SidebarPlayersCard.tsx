"use client";

import Image from "next/image";
import Link from "next/link";
import type { LeagueDetailContentProps } from "@/features/leagues/components/detail/types";
import { getInitials } from "@/lib/league-utils";

type Props = {
  data: LeagueDetailContentProps;
};

export default function SidebarPlayersCard({ data }: Props) {
  const {
    members,
    league,
    isOwnerOrAdmin,
    isMember,
    isFull,
    joining,
    leaving,
    inviteCode,
    isAuthenticated,
    currentMemberRole,
    onOpenInviteModal,
    onHandleJoin,
    onHandleLeave,
    onHandleCopyInviteLink,
  } = data;

  return (
    <div className="bg-white rounded-3xl border border-zinc-200 p-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-zinc-900">
          Players ({members.length}/{league.max_members})
        </h2>
        {isOwnerOrAdmin && (
          <button
            type="button"
            onClick={onOpenInviteModal}
            className="w-8 h-8 rounded-full bg-orange-500 text-white text-lg leading-none hover:bg-orange-600 transition-colors"
            aria-label="Invite players"
          >
            +
          </button>
        )}
      </div>

      <div className="flex items-center flex-wrap gap-2">
        {members.slice(0, 6).map((member) => (
          <Link
            key={member.id}
            href={`/users/${member.user_id}`}
            className="inline-flex items-center justify-center w-9 h-9 rounded-full overflow-hidden bg-zinc-200 ring-2 ring-white"
            title={member.name || "Anonymous"}
          >
            {member.avatar_url ? (
              <Image
                src={member.avatar_url}
                alt={member.name || "Member"}
                width={36}
                height={36}
                className="w-9 h-9 rounded-full object-cover"
              />
            ) : (
              <span className="text-xs font-semibold text-zinc-700">{getInitials(member.name)}</span>
            )}
          </Link>
        ))}
        {members.length > 6 && (
          <span className="inline-flex items-center justify-center h-9 px-2 rounded-full bg-zinc-100 border border-zinc-200 text-xs font-medium text-zinc-600">
            +{members.length - 6}
          </span>
        )}
      </div>

      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
        {!isMember && !isFull && (
          <button
            onClick={onHandleJoin}
            disabled={joining}
            className="sm:col-span-2 inline-flex items-center justify-center px-4 py-2.5 bg-zinc-900 text-white rounded-full text-sm font-semibold hover:bg-zinc-800 transition-all disabled:opacity-50"
          >
            {joining ? "Joining..." : "Join League"}
          </button>
        )}

        {isMember && currentMemberRole !== "owner" && (
          <button
            onClick={onHandleLeave}
            disabled={leaving}
            className="sm:col-span-2 inline-flex items-center justify-center px-4 py-2.5 border border-zinc-300 text-zinc-700 rounded-full text-sm font-medium hover:bg-zinc-50 transition-colors disabled:opacity-50"
          >
            {leaving ? "Leaving..." : "Leave League"}
          </button>
        )}

        {isOwnerOrAdmin && (
          <button
            type="button"
            onClick={onHandleCopyInviteLink}
            disabled={!inviteCode}
            className="inline-flex items-center justify-center px-3 py-2 border border-zinc-200 text-zinc-700 rounded-full text-sm font-medium hover:bg-zinc-50 transition-colors disabled:opacity-50"
          >
            Share Invite Link
          </button>
        )}
        {isOwnerOrAdmin && (
          <button
            type="button"
            onClick={onOpenInviteModal}
            className="inline-flex items-center justify-center px-3 py-2 border border-zinc-200 text-zinc-700 rounded-full text-sm font-medium hover:bg-zinc-50 transition-colors"
          >
            Invite by Email
          </button>
        )}
      </div>

      {!isMember && isFull && (
        <p className="text-sm text-zinc-500 mt-3">This league is full.</p>
      )}

      {!isAuthenticated && (
        <p className="text-sm text-zinc-500 mt-3">
          <Link href="/login" className="text-orange-500 hover:underline">
            Log in
          </Link>{" "}
          to join this league.
        </p>
      )}
    </div>
  );
}
