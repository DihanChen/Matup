"use client";

import Image from "next/image";
import Link from "next/link";
import type { LeagueDetailContentProps } from "@/features/leagues/components/detail/types";
import { getInitials } from "@/lib/league-utils";

type Props = {
  data: LeagueDetailContentProps;
};

export default function SidebarMembersDirectoryCard({ data }: Props) {
  const { members, currentUserId } = data;

  return (
    <div className="bg-white rounded-3xl border border-zinc-200 p-5">
      <h2 className="text-sm font-semibold text-zinc-900 mb-3">
        Members Directory
      </h2>
      <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
        {members.map((member) => (
          <Link
            key={member.id}
            href={`/users/${member.user_id}`}
            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
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
              <div className="w-9 h-9 rounded-full bg-zinc-300 text-white flex items-center justify-center font-medium text-sm">
                {getInitials(member.name)}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-medium text-zinc-900 text-sm truncate">
                {member.name || "Anonymous"}
                {member.user_id === currentUserId && (
                  <span className="ml-1 text-xs text-orange-500">(You)</span>
                )}
              </p>
            </div>
            {member.role !== "member" && (
              <span
                className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                  member.role === "owner"
                    ? "bg-amber-50 text-amber-700"
                    : "bg-blue-50 text-blue-700"
                }`}
              >
                {member.role}
              </span>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
