"use client";

import StatusBadge from "@/components/leagues/StatusBadge";
import type { LeagueDetailContentProps } from "@/features/leagues/components/detail/types";

type Props = {
  data: LeagueDetailContentProps;
};

export default function SidebarInviteConsoleCard({ data }: Props) {
  const {
    isOwnerOrAdmin,
    inviteCode,
    inviteError,
    inviteSuccess,
    leagueInvites,
    onHandleCopyInviteCode,
  } = data;

  if (!isOwnerOrAdmin) return null;

  return (
    <div className="bg-white rounded-3xl border border-zinc-200 p-5 space-y-4">
      <h2 className="text-sm font-semibold text-zinc-900">Invite Console</h2>

      <div className="flex items-center gap-2">
        <div className="flex-1 px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-semibold text-zinc-900 tracking-wide">
          {inviteCode ? (
            inviteCode
          ) : (
            <span className="block h-5 w-24 bg-zinc-200 rounded animate-pulse" />
          )}
        </div>
        <button
          type="button"
          onClick={onHandleCopyInviteCode}
          disabled={!inviteCode}
          className="px-3 py-2 border border-zinc-200 text-zinc-700 rounded-xl text-sm font-medium hover:bg-zinc-50 transition-colors disabled:opacity-50"
        >
          Copy Code
        </button>
      </div>

      {inviteError && <p className="text-xs text-red-500">{inviteError}</p>}
      {inviteSuccess && <p className="text-xs text-emerald-600">{inviteSuccess}</p>}

      {leagueInvites.length > 0 && (
        <div className="border-t border-zinc-100 pt-3">
          <h3 className="text-xs font-medium text-zinc-500 mb-2">Recent invites</h3>
          <div className="space-y-2">
            {leagueInvites.slice(0, 5).map((invite) => (
              <div key={invite.id} className="flex items-center justify-between gap-2 text-xs">
                <span className="text-zinc-700 truncate">{invite.email}</span>
                <StatusBadge status={invite.status} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
