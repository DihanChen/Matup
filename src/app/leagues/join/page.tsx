"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { getApiBaseUrl } from "@/lib/api";

type LeaguePreview = {
  id: string;
  name: string;
  sport_type: string;
  scoring_format: string;
};

export default function JoinLeaguePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialLeagueId = searchParams.get("leagueId") || "";
  const initialCode = searchParams.get("code") || "";
  const initialInviteToken = searchParams.get("inviteToken") || "";
  const hasPrefilledLeagueId = initialLeagueId.trim().length > 0;
  const canAutoJoinFromLink =
    hasPrefilledLeagueId && (initialCode.trim().length > 0 || initialInviteToken.trim().length > 0);

  const [leagueId, setLeagueId] = useState(initialLeagueId);
  const [inviteCode, setInviteCode] = useState(initialCode.toUpperCase());
  const [inviteToken, setInviteToken] = useState(initialInviteToken);
  const [ready, setReady] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [leaguePreview, setLeaguePreview] = useState<LeaguePreview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const autoJoinAttemptedRef = useRef(false);

  const sportLabel = useMemo(() => {
    if (!leaguePreview) return null;
    if (leaguePreview.sport_type === "pickleball") return "Pickleball";
    if (leaguePreview.sport_type === "tennis") return "Tennis";
    if (leaguePreview.scoring_format === "singles" || leaguePreview.scoring_format === "doubles") {
      return "Tennis";
    }
    if (leaguePreview.sport_type === "running") return "Running";
    return leaguePreview.sport_type;
  }, [leaguePreview]);

  useEffect(() => {
    async function loadUser() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setLoggedIn(!!user);
      setReady(true);
    }

    loadUser();
  }, []);

  const handleJoin = useCallback(async () => {
    if (!leagueId || (!inviteCode && !inviteToken)) {
      setError("League ID and invite code (or invite token) are required.");
      return;
    }

    setJoining(true);
    setError(null);

    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      setError("Please log in first.");
      setJoining(false);
      return;
    }

    try {
      const response = await fetch(`${getApiBaseUrl()}/api/leagues/${leagueId}/join`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inviteCode: inviteCode || undefined,
          inviteToken: inviteToken || undefined,
        }),
      });

      const data = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        setError(data?.error || "Failed to join league.");
        setJoining(false);
        return;
      }

      router.push(`/leagues/${leagueId}`);
    } catch (joinError) {
      setError(joinError instanceof Error ? joinError.message : "Failed to join league.");
      setJoining(false);
    }
  }, [inviteCode, inviteToken, leagueId, router]);

  useEffect(() => {
    async function fetchLeaguePreview() {
      if (!leagueId || !ready || !loggedIn) {
        setLeaguePreview(null);
        return;
      }

      setPreviewLoading(true);
      const supabase = createClient();
      const { data } = await supabase
        .from("leagues")
        .select("id, name, sport_type, scoring_format")
        .eq("id", leagueId)
        .maybeSingle();

      setLeaguePreview(data ?? null);
      setPreviewLoading(false);
    }

    fetchLeaguePreview();
  }, [leagueId, ready, loggedIn]);

  useEffect(() => {
    if (!ready || !loggedIn || !canAutoJoinFromLink || autoJoinAttemptedRef.current) return;
    autoJoinAttemptedRef.current = true;
    const timeout = window.setTimeout(() => {
      void handleJoin();
    }, 0);
    return () => window.clearTimeout(timeout);
  }, [canAutoJoinFromLink, handleJoin, loggedIn, ready]);

  if (!ready) {
    return (
      <div className="min-h-screen bg-white">
        <main className="max-w-md mx-auto px-4 py-12 sm:py-16 space-y-4 animate-pulse">
          <div className="h-5 w-28 bg-zinc-200 rounded" />
          <div className="bg-white rounded-2xl border border-zinc-200 p-6 space-y-4">
            <div className="h-7 w-48 bg-zinc-200 rounded" />
            <div className="h-4 w-56 bg-zinc-100 rounded" />
            <div className="space-y-2">
              <div className="h-3 w-20 bg-zinc-200 rounded" />
              <div className="h-12 w-full bg-zinc-100 rounded-xl" />
            </div>
            <div className="h-12 w-full bg-zinc-200 rounded-full" />
          </div>
        </main>
      </div>
    );
  }

  if (!loggedIn) {
    return (
      <div className="min-h-screen bg-white">
        <main className="max-w-md mx-auto px-4 py-20 text-center">
          <h1 className="text-3xl font-bold text-zinc-900 mb-3">
            Join <span className="text-orange-500">League</span>
          </h1>
          <p className="text-zinc-500 mb-6">You need an account to join this league.</p>
          <div className="flex gap-3 justify-center">
            <Link href="/login" className="px-5 py-2.5 bg-zinc-900 text-white rounded-full text-sm font-medium hover:bg-zinc-800 transition-colors">
              Log In
            </Link>
            <Link href="/signup" className="px-5 py-2.5 border border-zinc-200 text-zinc-700 rounded-full text-sm font-medium hover:bg-zinc-50 transition-colors">
              Create Account
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <main className="max-w-md mx-auto px-4 py-12 sm:py-16">
        <Link href="/leagues" className="inline-flex items-center text-zinc-600 hover:text-orange-500 mb-6 font-medium">
          ← Back to leagues
        </Link>

        <div className="bg-white rounded-2xl border border-zinc-200 p-6 space-y-4">
          <h1 className="text-2xl font-bold text-zinc-900">
            Join <span className="text-orange-500">League</span>
          </h1>
          <p className="text-sm text-zinc-500">
            {canAutoJoinFromLink
              ? "Invite link detected. We can auto-join with the details below."
              : "Paste the league ID and invite code from the organizer."}
          </p>

          {hasPrefilledLeagueId ? (
            <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl space-y-1">
              <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">League ID</p>
              <p className="text-sm font-medium text-zinc-800 break-all">{leagueId}</p>
              {previewLoading ? (
                <p className="text-xs text-zinc-500">Loading league details...</p>
              ) : leaguePreview ? (
                <p className="text-xs text-zinc-600">
                  Joining <span className="font-medium text-zinc-800">{leaguePreview.name}</span>
                  {sportLabel ? ` · ${sportLabel}` : ""}
                </p>
              ) : (
                <p className="text-xs text-zinc-500">League details unavailable until join.</p>
              )}
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1.5">League ID</label>
              <input
                value={leagueId}
                onChange={(event) => setLeagueId(event.target.value.trim())}
                placeholder="league UUID"
                className="w-full px-4 py-3 border border-zinc-200 rounded-xl bg-zinc-50 text-zinc-900 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">Invite Code</label>
            <input
              value={inviteCode}
              onChange={(event) => setInviteCode(event.target.value.toUpperCase())}
              placeholder={inviteToken ? "Optional when invite token exists" : "e.g. A1B2C3D4"}
              className="w-full px-4 py-3 border border-zinc-200 rounded-xl bg-zinc-50 text-zinc-900 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">Invite Token (optional)</label>
            <input
              value={inviteToken}
              onChange={(event) => setInviteToken(event.target.value.trim())}
              placeholder="auto-filled from invite email"
              className="w-full px-4 py-3 border border-zinc-200 rounded-xl bg-zinc-50 text-zinc-900 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">{error}</div>
          )}

          <button
            type="button"
            onClick={() => void handleJoin()}
            disabled={joining}
            className="w-full py-3 bg-zinc-900 text-white rounded-full font-medium hover:bg-zinc-800 transition-colors disabled:opacity-50"
          >
            {joining ? "Joining..." : canAutoJoinFromLink ? "Join from Invite Link" : "Join League"}
          </button>
        </div>
      </main>
    </div>
  );
}
