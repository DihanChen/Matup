"use client";

import Link from "next/link";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { getApiBaseUrl } from "@/lib/api";

type LeaguePreview = {
  id: string;
  name: string;
  sport_type: string;
  scoring_format: string;
};

function normalizeInviteCode(value: string): string {
  return value.toUpperCase().replace(/[^A-F0-9]/g, "").slice(0, 8);
}

function JoinLeagueContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const legacyLeagueId = (searchParams.get("leagueId") || "").trim();
  const inviteToken = (searchParams.get("inviteToken") || "").trim();
  const [inviteCode, setInviteCode] = useState(
    normalizeInviteCode(searchParams.get("code") || "")
  );
  const hasLegacyLeagueId = legacyLeagueId.length > 0;

  const [ready, setReady] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [leaguePreview, setLeaguePreview] = useState<LeaguePreview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  const sportLabel = useMemo<string | null>(() => {
    if (!leaguePreview) return null;
    if (leaguePreview.sport_type === "pickleball") return "Pickleball";
    if (leaguePreview.sport_type === "tennis") return "Tennis";
    if (leaguePreview.scoring_format === "singles" || leaguePreview.scoring_format === "doubles") {
      return "Tennis";
    }
    if (leaguePreview.sport_type === "running") return "Running";
    return leaguePreview.sport_type;
  }, [leaguePreview]);

  const formatLabel = useMemo<string | null>(() => {
    if (!leaguePreview) return null;
    if (leaguePreview.scoring_format === "singles") return "Singles";
    if (leaguePreview.scoring_format === "doubles") return "Doubles";
    if (leaguePreview.scoring_format === "team_vs_team") return "Team vs Team";
    return leaguePreview.scoring_format;
  }, [leaguePreview]);

  const joinLeagueId = hasLegacyLeagueId ? legacyLeagueId : leaguePreview?.id || "";
  const canJoin = !joining && !!joinLeagueId && (!!inviteToken || inviteCode.length > 0);

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

  useEffect(() => {
    if (!ready || !loggedIn || hasLegacyLeagueId) {
      setPreviewLoading(false);
      setPreviewError(null);
      setLeaguePreview(null);
      return;
    }

    if (inviteCode.length !== 8) {
      setPreviewLoading(false);
      setPreviewError(null);
      setLeaguePreview(null);
      return;
    }

    let cancelled = false;
    const timeout = window.setTimeout(() => {
      void (async () => {
        if (cancelled) return;
        setPreviewLoading(true);
        setPreviewError(null);

        const supabase = createClient();
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session?.access_token) {
          if (cancelled) return;
          setPreviewLoading(false);
          setPreviewError("Please log in first.");
          setLeaguePreview(null);
          return;
        }

        try {
          const response = await fetch(
            `${getApiBaseUrl()}/api/leagues/preview-by-code/${inviteCode}`,
            {
              headers: {
                Authorization: `Bearer ${session.access_token}`,
              },
            }
          );

          const data = (await response.json().catch(() => null)) as
            | LeaguePreview
            | { error?: string }
            | null;

          if (!response.ok) {
            if (cancelled) return;
            setLeaguePreview(null);
            if (response.status === 404) {
              setPreviewError("No league found for this invite code.");
            } else {
              setPreviewError((data as { error?: string } | null)?.error || "Failed to load league preview.");
            }
            return;
          }

          if (cancelled) return;
          setLeaguePreview(data as LeaguePreview);
        } catch (previewLoadError) {
          if (cancelled) return;
          setLeaguePreview(null);
          setPreviewError(
            previewLoadError instanceof Error
              ? previewLoadError.message
              : "Failed to load league preview."
          );
        } finally {
          if (cancelled) return;
          setPreviewLoading(false);
        }
      })();
    }, 300);

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, [hasLegacyLeagueId, inviteCode, loggedIn, ready]);

  const handleJoin = useCallback(async () => {
    if (!joinLeagueId || (!inviteCode && !inviteToken)) {
      setError("Enter a valid invite code to find your league.");
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
      const response = await fetch(`${getApiBaseUrl()}/api/leagues/${joinLeagueId}/join`, {
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

      router.push(`/leagues/${joinLeagueId}`);
    } catch (joinError) {
      setError(joinError instanceof Error ? joinError.message : "Failed to join league.");
      setJoining(false);
    }
  }, [inviteCode, inviteToken, joinLeagueId, router]);

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
        <Link href="/leagues" className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 hover:border-zinc-300 transition-colors text-sm font-medium mb-4 sm:mb-6">
          ← Back to leagues
        </Link>

        <div className="bg-white rounded-2xl border border-zinc-200 p-6 space-y-4">
          <h1 className="text-2xl font-bold text-zinc-900">
            Join <span className="text-orange-500">League</span>
          </h1>
          <p className="text-sm text-zinc-500">
            Enter the 8-character invite code from your organizer.
          </p>

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">Invite Code</label>
            <input
              value={inviteCode}
              onChange={(event) => {
                setInviteCode(normalizeInviteCode(event.target.value));
                setError(null);
              }}
              inputMode="text"
              autoCapitalize="characters"
              autoCorrect="off"
              maxLength={8}
              placeholder="e.g. A1B2C3D4"
              className="w-full px-4 py-3 border border-zinc-200 rounded-xl bg-zinc-50 text-zinc-900 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>

          {hasLegacyLeagueId && (
            <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-600">
              Legacy invite link detected. This link includes a league ID, so preview lookup is skipped.
            </div>
          )}

          {!hasLegacyLeagueId && previewLoading && (
            <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-600">
              Loading league details...
            </div>
          )}

          {!hasLegacyLeagueId && leaguePreview && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1">
              <p className="text-[11px] font-medium uppercase tracking-wide text-emerald-700">
                League Found
              </p>
              <p className="text-sm font-semibold text-zinc-900">{leaguePreview.name}</p>
              <p className="text-xs text-zinc-600">
                {[sportLabel, formatLabel].filter(Boolean).join(" · ")}
              </p>
            </div>
          )}

          {!hasLegacyLeagueId && previewError && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700">
              {previewError}
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">{error}</div>
          )}

          <button
            type="button"
            onClick={() => void handleJoin()}
            disabled={!canJoin}
            className="w-full py-3 bg-zinc-900 text-white rounded-full font-medium hover:bg-zinc-800 transition-colors disabled:opacity-50"
          >
            {joining ? "Joining..." : "Join League"}
          </button>
        </div>
      </main>
    </div>
  );
}

export default function JoinLeaguePage() {
  return (
    <Suspense
      fallback={
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
      }
    >
      <JoinLeagueContent />
    </Suspense>
  );
}
