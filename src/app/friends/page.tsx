"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

type Friendship = {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: "pending" | "accepted" | "declined";
  created_at: string;
};

type FriendEntry = {
  friendship: Friendship;
  user: {
    id: string;
    name: string | null;
    avatar_url: string | null;
  };
};

export default function FriendsPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [friends, setFriends] = useState<FriendEntry[]>([]);
  const [receivedRequests, setReceivedRequests] = useState<FriendEntry[]>([]);
  const [sentRequests, setSentRequests] = useState<FriendEntry[]>([]);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      setUser(user);

      // Get all friendships involving this user
      const { data: friendshipsData } = await supabase
        .from("friendships")
        .select("id, requester_id, addressee_id, status, created_at")
        .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
        .order("created_at", { ascending: false });

      if (!friendshipsData || friendshipsData.length === 0) {
        setLoading(false);
        return;
      }

      // Collect all other user IDs
      const otherUserIds = friendshipsData.map((f) =>
        f.requester_id === user.id ? f.addressee_id : f.requester_id
      );

      // Fetch profiles for all other users
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, name, avatar_url")
        .in("id", otherUserIds);

      const profileMap = new Map(
        (profiles || []).map((p) => [p.id, p])
      );

      const acceptedList: FriendEntry[] = [];
      const receivedList: FriendEntry[] = [];
      const sentList: FriendEntry[] = [];

      for (const f of friendshipsData) {
        const otherUserId =
          f.requester_id === user.id ? f.addressee_id : f.requester_id;
        const profile = profileMap.get(otherUserId) || {
          id: otherUserId,
          name: null,
          avatar_url: null,
        };

        const entry: FriendEntry = { friendship: f, user: profile };

        if (f.status === "accepted") {
          acceptedList.push(entry);
        } else if (f.status === "pending") {
          if (f.addressee_id === user.id) {
            receivedList.push(entry);
          } else {
            sentList.push(entry);
          }
        }
      }

      setFriends(acceptedList);
      setReceivedRequests(receivedList);
      setSentRequests(sentList);
      setLoading(false);
    }

    fetchData();
  }, [router]);

  async function handleAccept(friendshipId: string) {
    setActionLoading(friendshipId);
    const supabase = createClient();

    const { error } = await supabase
      .from("friendships")
      .update({ status: "accepted", updated_at: new Date().toISOString() })
      .eq("id", friendshipId);

    if (!error) {
      const accepted = receivedRequests.find(
        (r) => r.friendship.id === friendshipId
      );
      if (accepted) {
        setReceivedRequests((prev) =>
          prev.filter((r) => r.friendship.id !== friendshipId)
        );
        setFriends((prev) => [
          {
            ...accepted,
            friendship: { ...accepted.friendship, status: "accepted" },
          },
          ...prev,
        ]);
      }
    }
    setActionLoading(null);
  }

  async function handleDecline(friendshipId: string) {
    setActionLoading(friendshipId);
    const supabase = createClient();

    const { error } = await supabase
      .from("friendships")
      .update({ status: "declined", updated_at: new Date().toISOString() })
      .eq("id", friendshipId);

    if (!error) {
      setReceivedRequests((prev) =>
        prev.filter((r) => r.friendship.id !== friendshipId)
      );
    }
    setActionLoading(null);
  }

  async function handleCancel(friendshipId: string) {
    setActionLoading(friendshipId);
    const supabase = createClient();

    const { error } = await supabase
      .from("friendships")
      .delete()
      .eq("id", friendshipId);

    if (!error) {
      setSentRequests((prev) =>
        prev.filter((r) => r.friendship.id !== friendshipId)
      );
    }
    setActionLoading(null);
  }

  async function handleRemoveFriend(friendshipId: string) {
    setActionLoading(friendshipId);
    const supabase = createClient();

    const { error } = await supabase
      .from("friendships")
      .delete()
      .eq("id", friendshipId);

    if (!error) {
      setFriends((prev) =>
        prev.filter((f) => f.friendship.id !== friendshipId)
      );
    }
    setActionLoading(null);
  }

  const getInitials = (name: string | null) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

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
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-zinc-900 mb-2">
            My <span className="text-orange-500">Friends</span>
          </h1>
          <p className="text-zinc-500">Manage requests and stay connected with your crew</p>
        </div>

        {/* Received Requests */}
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
                <div
                  key={entry.friendship.id}
                  className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-zinc-200"
                >
                  <Link
                    href={`/users/${entry.user.id}`}
                    className="flex items-center gap-3 flex-1 hover:opacity-80 transition-opacity"
                  >
                    {entry.user.avatar_url ? (
                      <Image
                        src={entry.user.avatar_url}
                        alt={entry.user.name || "User"}
                        width={44}
                        height={44}
                        className="w-11 h-11 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-11 h-11 rounded-full bg-zinc-300 text-white flex items-center justify-center font-medium">
                        {getInitials(entry.user.name)}
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-zinc-900">
                        {entry.user.name || "Anonymous"}
                      </p>
                      <p className="text-xs text-zinc-400">
                        Sent{" "}
                        {new Date(entry.friendship.created_at).toLocaleDateString(
                          "en-US",
                          { month: "short", day: "numeric" }
                        )}
                      </p>
                    </div>
                  </Link>
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleAccept(entry.friendship.id)}
                      disabled={actionLoading === entry.friendship.id}
                      className="px-4 py-2 bg-orange-500 text-white text-sm font-medium rounded-full hover:bg-orange-600 transition-colors disabled:opacity-50"
                    >
                      {actionLoading === entry.friendship.id
                        ? "..."
                        : "Accept"}
                    </button>
                    <button
                      onClick={() => handleDecline(entry.friendship.id)}
                      disabled={actionLoading === entry.friendship.id}
                      className="px-4 py-2 border border-zinc-300 text-zinc-700 text-sm font-medium rounded-full hover:bg-zinc-50 transition-colors disabled:opacity-50"
                    >
                      Decline
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Friends List */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-zinc-900 mb-4">
            Friends{" "}
            <span className="text-sm font-normal text-zinc-400">
              ({friends.length})
            </span>
          </h2>
          {friends.length === 0 ? (
            <div className="bg-white rounded-2xl border border-zinc-200 p-8 text-center">
              <div className="text-4xl mb-3">👋</div>
              <p className="text-zinc-500 mb-2">No friends yet</p>
              <p className="text-sm text-zinc-400">
                Join events to meet people and add them as friends!
              </p>
              <Link
                href="/events"
                className="inline-block mt-4 px-4 py-2 bg-orange-500 text-white text-sm font-medium rounded-full hover:bg-orange-600 transition-colors"
              >
                Browse Events
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {friends.map((entry) => (
                <div
                  key={entry.friendship.id}
                  className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-zinc-200"
                >
                  <Link
                    href={`/users/${entry.user.id}`}
                    className="flex items-center gap-3 flex-1 hover:opacity-80 transition-opacity"
                  >
                    {entry.user.avatar_url ? (
                      <Image
                        src={entry.user.avatar_url}
                        alt={entry.user.name || "User"}
                        width={44}
                        height={44}
                        className="w-11 h-11 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-11 h-11 rounded-full bg-zinc-300 text-white flex items-center justify-center font-medium">
                        {getInitials(entry.user.name)}
                      </div>
                    )}
                    <p className="font-medium text-zinc-900">
                      {entry.user.name || "Anonymous"}
                    </p>
                  </Link>
                  <button
                    onClick={() => handleRemoveFriend(entry.friendship.id)}
                    disabled={actionLoading === entry.friendship.id}
                    className="text-xs text-zinc-400 hover:text-red-500 px-3 py-1 border border-zinc-200 rounded-full hover:border-red-300 transition-colors disabled:opacity-50"
                  >
                    {actionLoading === entry.friendship.id
                      ? "..."
                      : "Remove"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Sent Requests */}
        {sentRequests.length > 0 && (
          <section className="mb-8">
            <h2 className="text-lg font-semibold text-zinc-900 mb-4">
              Sent Requests{" "}
              <span className="text-sm font-normal text-zinc-400">
                ({sentRequests.length})
              </span>
            </h2>
            <div className="space-y-3">
              {sentRequests.map((entry) => (
                <div
                  key={entry.friendship.id}
                  className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-zinc-200"
                >
                  <Link
                    href={`/users/${entry.user.id}`}
                    className="flex items-center gap-3 flex-1 hover:opacity-80 transition-opacity"
                  >
                    {entry.user.avatar_url ? (
                      <Image
                        src={entry.user.avatar_url}
                        alt={entry.user.name || "User"}
                        width={44}
                        height={44}
                        className="w-11 h-11 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-11 h-11 rounded-full bg-zinc-300 text-white flex items-center justify-center font-medium">
                        {getInitials(entry.user.name)}
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-zinc-900">
                        {entry.user.name || "Anonymous"}
                      </p>
                      <p className="text-xs text-zinc-400">
                        Sent{" "}
                        {new Date(entry.friendship.created_at).toLocaleDateString(
                          "en-US",
                          { month: "short", day: "numeric" }
                        )}
                      </p>
                    </div>
                  </Link>
                  <button
                    onClick={() => handleCancel(entry.friendship.id)}
                    disabled={actionLoading === entry.friendship.id}
                    className="text-xs text-zinc-400 hover:text-red-500 px-3 py-1 border border-zinc-200 rounded-full hover:border-red-300 transition-colors disabled:opacity-50"
                  >
                    {actionLoading === entry.friendship.id
                      ? "..."
                      : "Cancel"}
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
