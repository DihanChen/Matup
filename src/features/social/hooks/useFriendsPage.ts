"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

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

export function useFriendsPage() {
  const router = useRouter();
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

  return {
    loading,
    friends,
    receivedRequests,
    sentRequests,
    actionLoading,
    handleAccept,
    handleDecline,
    handleCancel,
    handleRemoveFriend,
    getInitials,
  };
}

export type UseFriendsPageData = ReturnType<typeof useFriendsPage>;
