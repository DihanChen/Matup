"use client";

import Image from "next/image";
import type {
  FriendProfile,
} from "@/features/leagues/components/create/types";

type Props = {
  loadingFriends: boolean;
  friends: FriendProfile[];
  selectedFriends: Set<string>;
  onToggleFriend: (friendId: string) => void;
  getInitials: (name: string | null) => string;
};

export default function InviteFriendsStep({
  loadingFriends,
  friends,
  selectedFriends,
  onToggleFriend,
  getInitials,
}: Props) {
  return (
    <div className="animate-fadeIn">
      <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-zinc-900 text-center mb-10">
        Invite <span className="text-orange-500">friends</span>
      </h1>

      {loadingFriends ? (
        <div className="text-center py-8 text-zinc-400">
          Loading friends...
        </div>
      ) : friends.length === 0 ? (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
            </svg>
          </div>
          <p className="text-zinc-500 mb-1">No friends yet</p>
          <p className="text-sm text-zinc-400">
            You can add members after creating the league.
          </p>
        </div>
      ) : (
        <div className="space-y-2 max-w-md mx-auto">
          {selectedFriends.size > 0 && (
            <p className="text-sm text-orange-500 font-medium mb-3 text-center">
              {selectedFriends.size} friend
              {selectedFriends.size !== 1 ? "s" : ""} selected
            </p>
          )}
          {friends.map((friend) => {
            const isSelected = selectedFriends.has(friend.id);
            return (
              <button
                key={friend.id}
                type="button"
                onClick={() => onToggleFriend(friend.id)}
                className={`w-full flex items-center gap-3 p-4 rounded-2xl transition-all text-left ${
                  isSelected
                    ? "bg-orange-50 border-2 border-orange-500"
                    : "bg-zinc-100 border-2 border-transparent hover:bg-zinc-200"
                }`}
              >
                {friend.avatar_url ? (
                  <Image
                    src={friend.avatar_url}
                    alt={friend.name || "Friend"}
                    width={40}
                    height={40}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-zinc-900 text-white flex items-center justify-center font-medium">
                    {getInitials(friend.name)}
                  </div>
                )}
                <span className="font-medium text-zinc-900 flex-1">
                  {friend.name || "Anonymous"}
                </span>
                <div
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                    isSelected
                      ? "bg-zinc-900 border-zinc-900"
                      : "border-zinc-300"
                  }`}
                >
                  {isSelected && (
                    <svg
                      className="w-4 h-4 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
