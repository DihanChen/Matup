"use client";

import Link from "next/link";
import Image from "next/image";
import { useFriendsPage } from "@/features/social/hooks/useFriendsPage";

export default function FriendsPageClient() {
  const {
    loading,
    friends,
    receivedRequests,
    sentRequests,
    actionLoading,
    searchQuery,
    setSearchQuery,
    searchResults,
    searching,
    searchError,
    searchNotice,
    getRelationshipStatus,
    handleAccept,
    handleDecline,
    handleCancel,
    handleRemoveFriend,
    handleSendFriendRequest,
    getInitials,
  } = useFriendsPage();

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <main className="max-w-[980px] mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-6 animate-pulse">
          <div className="space-y-3">
            <div className="h-9 w-56 bg-zinc-200 rounded-xl" />
            <div className="h-4 w-72 bg-zinc-100 rounded" />
          </div>
          <div className="space-y-3">
            {[1, 2, 3, 4].map((item) => (
              <div key={`friends-skeleton-row-${item}`} className="rounded-2xl border border-zinc-200 p-4 flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-zinc-100" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-40 bg-zinc-200 rounded" />
                  <div className="h-3 w-24 bg-zinc-100 rounded" />
                </div>
                <div className="h-8 w-20 rounded-full bg-zinc-100" />
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
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-zinc-900 mb-2">
            My <span className="text-orange-500">Friends</span>
          </h1>
          <p className="text-zinc-500">Manage requests and stay connected with your crew</p>
        </div>

        <section className="mb-8">
          <div className="relative mb-3">
            <svg
              className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search by name..."
              className="w-full rounded-full border border-zinc-300 bg-white py-2.5 pl-10 pr-4 text-sm text-zinc-900 placeholder-zinc-400 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          {searchError ? (
            <p className="mb-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">{searchError}</p>
          ) : null}
          {searchNotice ? (
            <p className="mb-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{searchNotice}</p>
          ) : null}

          {searchQuery.trim().length >= 2 ? (
            searching ? (
              <div className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-500">
                Searching...
              </div>
            ) : searchResults.length === 0 ? (
              <div className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-500">
                No users found.
              </div>
            ) : (
              <div className="space-y-3">
                {searchResults.map((result) => {
                  const relationship = getRelationshipStatus(result.id);
                  return (
                    <div key={result.id} className="flex items-center gap-3 rounded-2xl border border-zinc-200 bg-white p-4">
                      <Link href={`/users/${result.id}`} className="flex items-center gap-3 flex-1 hover:opacity-80 transition-opacity">
                        {result.avatar_url ? (
                          <Image src={result.avatar_url} alt={result.name || "User"} width={44} height={44} className="w-11 h-11 rounded-full object-cover" />
                        ) : (
                          <div className="w-11 h-11 rounded-full bg-zinc-300 text-white flex items-center justify-center font-medium">
                            {getInitials(result.name)}
                          </div>
                        )}
                        <p className="font-medium text-zinc-900">{result.name || "Anonymous"}</p>
                      </Link>

                      {relationship === "none" ? (
                        <button
                          onClick={() => handleSendFriendRequest(result)}
                          disabled={actionLoading === `add-${result.id}`}
                          className="px-4 py-2 bg-orange-500 text-white text-sm font-medium rounded-full hover:bg-orange-600 transition-colors disabled:opacity-50"
                        >
                          {actionLoading === `add-${result.id}` ? "..." : "Add Friend"}
                        </button>
                      ) : relationship === "friends" ? (
                        <span className="px-3 py-1 text-xs font-medium rounded-full bg-zinc-100 text-zinc-600">Friends</span>
                      ) : relationship === "sent" ? (
                        <span className="px-3 py-1 text-xs font-medium rounded-full bg-orange-50 text-orange-600">Requested</span>
                      ) : (
                        <span className="px-3 py-1 text-xs font-medium rounded-full bg-zinc-100 text-zinc-600">Requested You</span>
                      )}
                    </div>
                  );
                })}
              </div>
            )
          ) : null}
        </section>

        {receivedRequests.length > 0 && (
          <section className="mb-8">
            <h2 className="text-lg font-semibold text-zinc-900 mb-4 flex items-center gap-2">
              Received Requests
              <span className="text-xs font-medium text-white bg-orange-500 rounded-full px-2 py-0.5">
                {receivedRequests.length}
              </span>
            </h2>
            <div className="space-y-3">
              {receivedRequests.map((entry) => (
                <div key={entry.friendship.id} className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-zinc-200">
                  <Link href={`/users/${entry.user.id}`} className="flex items-center gap-3 flex-1 hover:opacity-80 transition-opacity">
                    {entry.user.avatar_url ? (
                      <Image src={entry.user.avatar_url} alt={entry.user.name || "User"} width={44} height={44} className="w-11 h-11 rounded-full object-cover" />
                    ) : (
                      <div className="w-11 h-11 rounded-full bg-zinc-300 text-white flex items-center justify-center font-medium">
                        {getInitials(entry.user.name)}
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-zinc-900">{entry.user.name || "Anonymous"}</p>
                      <p className="text-xs text-zinc-400">
                        Sent {new Date(entry.friendship.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </p>
                    </div>
                  </Link>
                  <div className="flex gap-2 flex-shrink-0">
                    <button onClick={() => handleAccept(entry.friendship.id)} disabled={actionLoading === entry.friendship.id} className="px-4 py-2 bg-orange-500 text-white text-sm font-medium rounded-full hover:bg-orange-600 transition-colors disabled:opacity-50">
                      {actionLoading === entry.friendship.id ? "..." : "Accept"}
                    </button>
                    <button onClick={() => handleDecline(entry.friendship.id)} disabled={actionLoading === entry.friendship.id} className="px-4 py-2 border border-zinc-300 text-zinc-700 text-sm font-medium rounded-full hover:bg-zinc-50 transition-colors disabled:opacity-50">
                      Decline
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="mb-8">
          <h2 className="text-lg font-semibold text-zinc-900 mb-4">
            Friends <span className="text-sm font-normal text-zinc-400">({friends.length})</span>
          </h2>
          {friends.length === 0 ? (
            <div className="bg-white rounded-2xl border border-zinc-200 p-8 text-center">
              <div className="text-4xl mb-3">👋</div>
              <p className="text-zinc-500 mb-2">No friends yet</p>
              <p className="text-sm text-zinc-400">Join events to meet people and add them as friends!</p>
              <Link href="/events" className="inline-block mt-4 px-4 py-2 bg-orange-500 text-white text-sm font-medium rounded-full hover:bg-orange-600 transition-colors">
                Browse Events
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {friends.map((entry) => (
                <div key={entry.friendship.id} className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-zinc-200">
                  <Link href={`/users/${entry.user.id}`} className="flex items-center gap-3 flex-1 hover:opacity-80 transition-opacity">
                    {entry.user.avatar_url ? (
                      <Image src={entry.user.avatar_url} alt={entry.user.name || "User"} width={44} height={44} className="w-11 h-11 rounded-full object-cover" />
                    ) : (
                      <div className="w-11 h-11 rounded-full bg-zinc-300 text-white flex items-center justify-center font-medium">
                        {getInitials(entry.user.name)}
                      </div>
                    )}
                    <p className="font-medium text-zinc-900">{entry.user.name || "Anonymous"}</p>
                  </Link>
                  <button onClick={() => handleRemoveFriend(entry.friendship.id)} disabled={actionLoading === entry.friendship.id} className="text-xs text-zinc-400 hover:text-red-500 px-3 py-1 border border-zinc-200 rounded-full hover:border-red-300 transition-colors disabled:opacity-50">
                    {actionLoading === entry.friendship.id ? "..." : "Remove"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {sentRequests.length > 0 && (
          <section className="mb-8">
            <h2 className="text-lg font-semibold text-zinc-900 mb-4">
              Sent Requests <span className="text-sm font-normal text-zinc-400">({sentRequests.length})</span>
            </h2>
            <div className="space-y-3">
              {sentRequests.map((entry) => (
                <div key={entry.friendship.id} className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-zinc-200">
                  <Link href={`/users/${entry.user.id}`} className="flex items-center gap-3 flex-1 hover:opacity-80 transition-opacity">
                    {entry.user.avatar_url ? (
                      <Image src={entry.user.avatar_url} alt={entry.user.name || "User"} width={44} height={44} className="w-11 h-11 rounded-full object-cover" />
                    ) : (
                      <div className="w-11 h-11 rounded-full bg-zinc-300 text-white flex items-center justify-center font-medium">
                        {getInitials(entry.user.name)}
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-zinc-900">{entry.user.name || "Anonymous"}</p>
                      <p className="text-xs text-zinc-400">
                        Sent {new Date(entry.friendship.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </p>
                    </div>
                  </Link>
                  <button onClick={() => handleCancel(entry.friendship.id)} disabled={actionLoading === entry.friendship.id} className="text-xs text-zinc-400 hover:text-red-500 px-3 py-1 border border-zinc-200 rounded-full hover:border-red-300 transition-colors disabled:opacity-50">
                    {actionLoading === entry.friendship.id ? "..." : "Cancel"}
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
