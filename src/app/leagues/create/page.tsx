"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";
import { buildLeagueRules } from "@/lib/league-rules";
import StepIndicator from "@/components/create-event/StepIndicator";
import { ActivityIcon } from "@/components/create-event/ActivityCard";

interface FormData {
  sportType: "tennis" | "pickleball" | "running" | "";
  matchType: "singles" | "doubles" | "";
  rotationType: "random" | "assigned" | "";
  scoringFormat: "singles" | "doubles" | "individual_time" | "";
  runningComparisonMode: "personal_progress" | "absolute_performance";
  startDate: string;
  seasonWeeks: number;
  name: string;
  description: string;
  maxMembers: number;
}

const TOTAL_STEPS = 4;

type FriendProfile = {
  id: string;
  name: string | null;
  avatar_url: string | null;
};

export default function CreateLeaguePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isPremium, setIsPremium] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState(1);
  const [friends, setFriends] = useState<FriendProfile[]>([]);
  const [loadingFriends, setLoadingFriends] = useState(false);
  const [selectedFriends, setSelectedFriends] = useState<Set<string>>(new Set());
  const [formData, setFormData] = useState<FormData>({
    sportType: "",
    matchType: "",
    rotationType: "",
    scoringFormat: "",
    runningComparisonMode: "personal_progress",
    startDate: "",
    seasonWeeks: 10,
    name: "",
    description: "",
    maxMembers: 20,
  });

  useEffect(() => {
    const supabase = createClient();

    async function init() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      setUser(user);

      const { data: profile } = await supabase
        .from("profiles")
        .select("is_premium")
        .eq("id", user.id)
        .single();

      setIsPremium(profile?.is_premium ?? false);

      // Fetch friends
      setLoadingFriends(true);
      const { data: friendshipsData } = await supabase
        .from("friendships")
        .select("requester_id, addressee_id")
        .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
        .eq("status", "accepted");

      if (friendshipsData && friendshipsData.length > 0) {
        const friendIds = friendshipsData.map((f) =>
          f.requester_id === user.id ? f.addressee_id : f.requester_id
        );

        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, name, avatar_url")
          .in("id", friendIds);

        if (profiles) {
          setFriends(profiles);
        }
      }
      setLoadingFriends(false);
    }

    init();
  }, [router]);

  const updateFormData = (updates: Partial<FormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  const canProceed = (): boolean => {
    switch (step) {
      case 1:
        if (!formData.sportType) return false;
        if (formData.sportType === "tennis" || formData.sportType === "pickleball") {
          if (!formData.matchType) return false;
          if (formData.matchType === "doubles" && !formData.rotationType) return false;
        }
        return true;
      case 2:
        return !!formData.startDate;
      case 3:
        return !!formData.name.trim();
      case 4:
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (step < TOTAL_STEPS && canProceed()) {
      setStep(step + 1);
      setError(null);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
      setError(null);
    }
  };

  async function handleSubmit() {
    if (!canProceed() || !user) return;

    setLoading(true);
    setError(null);

    const supabase = createClient();

    if (!formData.sportType) {
      setError("Please select a sport.");
      setLoading(false);
      return;
    }

    if (
      (formData.sportType === "tennis" || formData.sportType === "pickleball") &&
      !formData.matchType
    ) {
      setError(
        `Please select a ${
          formData.sportType === "pickleball" ? "pickleball" : "tennis"
        } format.`
      );
      setLoading(false);
      return;
    }

    // Determine scoring format based on sport
    let scoringFormat: "individual_time" | "singles" | "doubles";
    if (formData.sportType === "running") {
      scoringFormat = "individual_time";
    } else if (formData.matchType === "singles" || formData.matchType === "doubles") {
      scoringFormat = formData.matchType;
    } else {
      setError("Please select a valid match format.");
      setLoading(false);
      return;
    }
    const shouldSetRotationType =
      (formData.sportType === "tennis" || formData.sportType === "pickleball") &&
      formData.matchType === "doubles";
    const rulesJson = buildLeagueRules({
      sportType: formData.sportType,
      matchType: formData.matchType,
      rotationType: formData.rotationType,
      runningComparisonMode: formData.runningComparisonMode,
      startDate: formData.startDate,
      seasonWeeks: formData.seasonWeeks,
    });

    const { data: leagueData, error: leagueError } = await supabase
      .from("leagues")
      .insert({
        name: formData.name,
        description: formData.description || null,
        sport_type: formData.sportType,
        scoring_format: scoringFormat,
        league_type: "season",
        creator_id: user.id,
        max_members: formData.maxMembers,
        start_date: formData.startDate || null,
        season_weeks: formData.seasonWeeks,
        rotation_type: shouldSetRotationType ? formData.rotationType : null,
        rules_version: 1,
        rules_jsonb: rulesJson,
      })
      .select("id")
      .single();

    if (leagueError) {
      setError(leagueError.message);
      setLoading(false);
      return;
    }

    // Add creator as owner
    await supabase.from("league_members").insert({
      league_id: leagueData.id,
      user_id: user.id,
      role: "owner",
    });

    // Add selected friends as members
    if (selectedFriends.size > 0) {
      const memberInserts = Array.from(selectedFriends).map((friendId) => ({
        league_id: leagueData.id,
        user_id: friendId,
        role: "member",
      }));

      await supabase.from("league_members").insert(memberInserts);
    }

    router.push(`/leagues/${leagueData.id}`);
  }

  const toggleFriend = (friendId: string) => {
    setSelectedFriends((prev) => {
      const next = new Set(prev);
      if (next.has(friendId)) {
        next.delete(friendId);
      } else {
        next.add(friendId);
      }
      return next;
    });
  };

  const getInitials = (name: string | null) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (isPremium === null) {
    return (
      <div className="min-h-screen bg-white">
        <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 animate-pulse">
          <div className="h-8 w-64 bg-zinc-200 rounded-xl mx-auto" />
          <div className="flex items-center justify-center gap-3">
            {[1, 2, 3].map((step) => (
              <div key={`league-create-step-skeleton-${step}`} className="h-8 w-24 rounded-full bg-zinc-100" />
            ))}
          </div>
          <div className="rounded-2xl border border-zinc-200 p-6 sm:p-8 space-y-5">
            <div className="h-6 w-48 bg-zinc-200 rounded" />
            <div className="grid grid-cols-2 gap-4 max-w-md">
              {[1, 2, 3, 4].map((item) => (
                <div key={`league-create-sport-skeleton-${item}`} className="h-28 rounded-2xl bg-zinc-100" />
              ))}
            </div>
            <div className="h-12 w-full bg-zinc-100 rounded-full" />
            <div className="h-12 w-40 bg-zinc-200 rounded-full ml-auto" />
          </div>
        </main>
      </div>
    );
  }

  if (!isPremium) {
    return (
      <div className="min-h-screen bg-white">
        <main className="max-w-lg mx-auto px-4 sm:px-6 py-12 sm:py-16 text-center">
          <div className="w-20 h-20 sm:w-24 sm:h-24 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 sm:w-12 sm:h-12 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 0 1 3 3h-15a3 3 0 0 1 3-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 0 1-.982-3.172M9.497 14.25a7.454 7.454 0 0 0 .981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 0 0 7.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M18.75 4.236c.982.143 1.954.317 2.916.52A6.003 6.003 0 0 1 16.27 9.728M18.75 4.236V4.5c0 2.108-.966 3.99-2.48 5.228m0 0a6.003 6.003 0 0 1-2.27.94m2.27-.94a17.957 17.957 0 0 0 3.485-2.269" />
            </svg>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 mb-2">
            Premium Required
          </h1>
          <p className="text-zinc-500 mb-6">
            Creating leagues is a premium feature. Upgrade to unlock league
            management with score tracking and rankings.
          </p>
          <Link
            href="/leagues"
            className="inline-block px-5 py-2.5 bg-zinc-900 text-white rounded-full text-sm font-medium hover:bg-zinc-800 transition-colors"
          >
            Back to Leagues
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <StepIndicator currentStep={step} totalSteps={TOTAL_STEPS} />

        {error && (
          <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm">
            {error}
          </div>
        )}

        {/* Step 1: Sport & Match Type */}
        {step === 1 && (
          <div className="animate-fadeIn">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-zinc-900 text-center mb-8 sm:mb-10">
              Choose your <span className="text-orange-500">sport</span>
            </h1>

            {/* Sport Selector */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-4xl mx-auto mb-8">
              <button
                type="button"
                onClick={() => updateFormData({ sportType: "running", matchType: "", rotationType: "" })}
                className={`
                  relative p-5 sm:p-7 rounded-2xl cursor-pointer transition-all duration-200
                  bg-zinc-100 flex flex-col items-center text-center
                  hover:scale-105 hover:shadow-lg
                  ${formData.sportType === "running"
                    ? 'ring-2 ring-yellow-400 ring-offset-2 scale-105 shadow-lg'
                    : 'hover:ring-2 hover:ring-zinc-300'
                  }
                `}
              >
                <div className="text-zinc-900 mb-3">
                  <ActivityIcon id="running" className="w-8 h-8 sm:w-10 sm:h-10" />
                </div>
                <div className="text-zinc-900 font-semibold">Running</div>
                <div className="text-xs text-zinc-500 mt-1">Club runs & time trials</div>
              </button>
              <button
                type="button"
                onClick={() => updateFormData({ sportType: "pickleball", matchType: "", rotationType: "" })}
                className={`
                  relative p-5 sm:p-7 rounded-2xl cursor-pointer transition-all duration-200
                  bg-zinc-100 flex flex-col items-center text-center
                  hover:scale-105 hover:shadow-lg
                  ${formData.sportType === "pickleball"
                    ? "ring-2 ring-yellow-400 ring-offset-2 scale-105 shadow-lg"
                    : "hover:ring-2 hover:ring-zinc-300"
                  }
                `}
              >
                <div className="text-zinc-900 mb-3">
                  <ActivityIcon id="pickleball" className="w-8 h-8 sm:w-10 sm:h-10" />
                </div>
                <div className="text-zinc-900 font-semibold">Pickleball</div>
                <div className="text-xs text-zinc-500 mt-1">Singles & doubles seasons</div>
              </button>
              <button
                type="button"
                onClick={() => updateFormData({ sportType: "tennis", matchType: "", rotationType: "" })}
                className={`
                  relative p-5 sm:p-7 rounded-2xl cursor-pointer transition-all duration-200
                  bg-zinc-100 flex flex-col items-center text-center
                  hover:scale-105 hover:shadow-lg
                  ${formData.sportType === "tennis"
                    ? 'ring-2 ring-yellow-400 ring-offset-2 scale-105 shadow-lg'
                    : 'hover:ring-2 hover:ring-zinc-300'
                  }
                `}
              >
                <div className="text-zinc-900 mb-3">
                  <ActivityIcon id="tennis" className="w-8 h-8 sm:w-10 sm:h-10" />
                </div>
                <div className="text-zinc-900 font-semibold">Tennis</div>
                <div className="text-xs text-zinc-500 mt-1">Singles & doubles leagues</div>
              </button>
            </div>

            {/* Running: Info card */}
            {formData.sportType === "running" && (
              <div className="max-w-md mx-auto space-y-3">
                <div className="p-4 bg-green-50 border border-green-200 rounded-2xl">
                  <div className="flex items-center gap-2 mb-1">
                    <ActivityIcon id="running" className="w-4 h-4 text-green-600" />
                    <span className="font-semibold text-green-800 text-sm">Running League</span>
                  </div>
                  <p className="text-xs text-green-700">
                    Set how leaderboard ranks runners each week.
                  </p>
                </div>
                <div className="p-4 bg-white border border-zinc-200 rounded-2xl">
                  <div className="text-sm font-bold text-zinc-900 mb-3">Leaderboard Mode</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        updateFormData({ runningComparisonMode: "personal_progress" })
                      }
                      className={`text-left p-3 rounded-xl border transition-colors ${
                        formData.runningComparisonMode === "personal_progress"
                          ? "border-orange-500 bg-orange-50"
                          : "border-zinc-200 bg-zinc-50 hover:bg-zinc-100"
                      }`}
                    >
                      <div className="text-sm font-semibold text-zinc-900">Personal Progress</div>
                      <div className="text-xs text-zinc-500 mt-1">
                        Rank by pace improvement vs previous session.
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        updateFormData({ runningComparisonMode: "absolute_performance" })
                      }
                      className={`text-left p-3 rounded-xl border transition-colors ${
                        formData.runningComparisonMode === "absolute_performance"
                          ? "border-orange-500 bg-orange-50"
                          : "border-zinc-200 bg-zinc-50 hover:bg-zinc-100"
                      }`}
                    >
                      <div className="text-sm font-semibold text-zinc-900">Absolute Performance</div>
                      <div className="text-xs text-zinc-500 mt-1">
                        Rank by total time (fastest overall leads).
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Racket Sports: Match Type */}
            {(formData.sportType === "tennis" || formData.sportType === "pickleball") && (
              <>
                {formData.sportType === "pickleball" && (
                  <div className="max-w-md mx-auto mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl">
                    <div className="flex items-center gap-2 mb-2">
                      <ActivityIcon id="pickleball" className="w-4 h-4 text-emerald-700" />
                      <span className="text-sm font-bold text-emerald-900">Pickleball Rules (Default)</span>
                    </div>
                    <ul className="text-xs text-emerald-800 space-y-1.5">
                      <li>Best of 3 games by default</li>
                      <li>Games to 11 points, win by 2</li>
                      <li>Side-out serving model</li>
                      <li>Standings prioritize match points, then head-to-head and point diff</li>
                    </ul>
                  </div>
                )}
                <div className="max-w-md mx-auto mb-6">
                  <div className="flex items-center gap-2 mb-4 justify-center">
                    <ActivityIcon id={formData.sportType} className="w-4 h-4 text-zinc-500" />
                    <span className="text-sm font-bold text-zinc-900">Match Type</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => updateFormData({ matchType: "singles", rotationType: "" })}
                      className={`
                        p-4 sm:p-6 rounded-2xl cursor-pointer transition-all duration-200
                        bg-zinc-100 flex flex-col items-center text-center
                        hover:scale-105 hover:shadow-lg
                        ${formData.matchType === "singles"
                          ? 'ring-2 ring-yellow-400 ring-offset-2 scale-105 shadow-lg'
                          : 'hover:ring-2 hover:ring-zinc-300'
                        }
                      `}
                    >
                      <div className="text-zinc-900 mb-2">
                        <svg className="w-7 h-7 sm:w-8 sm:h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                        </svg>
                      </div>
                      <div className="font-semibold text-zinc-900 text-sm">Singles</div>
                      <div className="text-xs text-zinc-500 mt-1">1 vs 1 matches</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => updateFormData({ matchType: "doubles" })}
                      className={`
                        p-4 sm:p-6 rounded-2xl cursor-pointer transition-all duration-200
                        bg-zinc-100 flex flex-col items-center text-center
                        hover:scale-105 hover:shadow-lg
                        ${formData.matchType === "doubles"
                          ? 'ring-2 ring-yellow-400 ring-offset-2 scale-105 shadow-lg'
                          : 'hover:ring-2 hover:ring-zinc-300'
                        }
                      `}
                    >
                      <div className="text-zinc-900 mb-2">
                        <svg className="w-7 h-7 sm:w-8 sm:h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
                        </svg>
                      </div>
                      <div className="font-semibold text-zinc-900 text-sm">Doubles</div>
                      <div className="text-xs text-zinc-500 mt-1">2 vs 2 matches</div>
                    </button>
                  </div>
                </div>

                {formData.matchType === "doubles" && (
                  <div className="max-w-md mx-auto">
                    <div className="flex items-center gap-2 mb-4 justify-center">
                      <svg className="w-4 h-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 0 0-3.7-3.7 48.678 48.678 0 0 0-7.324 0 4.006 4.006 0 0 0-3.7 3.7c-.017.22-.032.441-.046.662M19.5 12l3-3m-3 3-3-3m-12 3c0 1.232.046 2.453.138 3.662a4.006 4.006 0 0 0 3.7 3.7 48.656 48.656 0 0 0 7.324 0 4.006 4.006 0 0 0 3.7-3.7c.017-.22.032-.441.046-.662M4.5 12l3 3m-3-3-3 3" />
                      </svg>
                      <span className="text-sm font-bold text-zinc-900">Rotation Type</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => updateFormData({ rotationType: "random" })}
                        className={`
                          p-4 sm:p-5 rounded-2xl cursor-pointer transition-all duration-200
                          bg-zinc-100 flex flex-col items-center text-center
                          hover:scale-105 hover:shadow-lg
                          ${formData.rotationType === "random"
                            ? 'ring-2 ring-yellow-400 ring-offset-2 scale-105 shadow-lg'
                            : 'hover:ring-2 hover:ring-zinc-300'
                          }
                        `}
                      >
                        <div className="text-zinc-900 mb-2">
                          <svg className="w-6 h-6 sm:w-7 sm:h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
                          </svg>
                        </div>
                        <div className="font-semibold text-zinc-900 text-sm">Random</div>
                        <div className="text-xs text-zinc-500 mt-1">Random partners each week</div>
                      </button>
                      <button
                        type="button"
                        onClick={() => updateFormData({ rotationType: "assigned" })}
                        className={`
                          p-4 sm:p-5 rounded-2xl cursor-pointer transition-all duration-200
                          bg-zinc-100 flex flex-col items-center text-center
                          hover:scale-105 hover:shadow-lg
                          ${formData.rotationType === "assigned"
                            ? 'ring-2 ring-yellow-400 ring-offset-2 scale-105 shadow-lg'
                            : 'hover:ring-2 hover:ring-zinc-300'
                          }
                        `}
                      >
                        <div className="text-zinc-900 mb-2">
                          <svg className="w-6 h-6 sm:w-7 sm:h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" />
                          </svg>
                        </div>
                        <div className="font-semibold text-zinc-900 text-sm">Assigned</div>
                        <div className="text-xs text-zinc-500 mt-1">Fixed partner all season</div>
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Step 2: Schedule */}
        {step === 2 && (
          <div className="animate-fadeIn">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-zinc-900 text-center mb-8 sm:mb-10">
              Set the <span className="text-orange-500">schedule</span>
            </h1>

            <div className="space-y-6 max-w-md mx-auto">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <svg className="w-4 h-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25" />
                  </svg>
                  <span className="text-sm font-bold text-zinc-900">Start Date</span>
                </div>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) =>
                    updateFormData({ startDate: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-zinc-200 rounded-2xl bg-zinc-50 text-zinc-900 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                />
              </div>

              <div>
                <div className="flex items-center gap-2 mb-4">
                  <svg className="w-4 h-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                  </svg>
                  <span className="text-sm font-bold text-zinc-900">Season Length: <span className="text-orange-500">{formData.seasonWeeks} weeks</span></span>
                </div>
                <input
                  type="range"
                  min="4"
                  max="52"
                  value={formData.seasonWeeks}
                  onChange={(e) =>
                    updateFormData({
                      seasonWeeks: parseInt(e.target.value),
                    })
                  }
                  className="w-full h-2 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
                />
                <div className="flex justify-between text-xs text-zinc-400 mt-1">
                  <span>4 weeks</span>
                  <span>52 weeks</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Details */}
        {step === 3 && (
          <div className="animate-fadeIn">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-zinc-900 text-center mb-8 sm:mb-10">
              League <span className="text-orange-500">details</span>
            </h1>

            <div className="space-y-6 max-w-md mx-auto">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <svg className="w-4 h-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                  </svg>
                  <span className="text-sm font-bold text-zinc-900">League Name</span>
                </div>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    updateFormData({ name: e.target.value })
                  }
                  placeholder={
                    formData.sportType === "running"
                      ? "e.g. Sunday Morning Run Club"
                      : formData.sportType === "pickleball"
                        ? "e.g. Wednesday Pickleball Ladder"
                      : formData.matchType === "doubles"
                        ? "e.g. Saturday Doubles League"
                        : "e.g. Weekend Tennis Singles"
                  }
                  className="w-full px-4 py-3 border border-zinc-200 rounded-2xl bg-zinc-50 text-zinc-900 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                />
              </div>

              <div>
                <div className="flex items-center gap-2 mb-4">
                  <svg className="w-4 h-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
                  </svg>
                  <span className="text-sm font-bold text-zinc-900">Description <span className="text-zinc-400 font-normal">(optional)</span></span>
                </div>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    updateFormData({ description: e.target.value })
                  }
                  rows={3}
                  placeholder={
                    formData.sportType === "running"
                      ? "Weekly group runs for all levels with timed results"
                      : formData.sportType === "pickleball"
                      ? "Competitive pickleball league with weekly matchups and standings"
                      : "Friendly tennis league for all levels"
                  }
                  className="w-full px-4 py-3 border border-zinc-200 rounded-2xl bg-zinc-50 text-zinc-900 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all resize-none"
                />
              </div>

              <div>
                <div className="flex items-center gap-2 mb-4">
                  <svg className="w-4 h-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
                  </svg>
                  <span className="text-sm font-bold text-zinc-900">Max Members: <span className="text-orange-500">{formData.maxMembers}</span></span>
                </div>
                <input
                  type="range"
                  min="4"
                  max="50"
                  value={formData.maxMembers}
                  onChange={(e) =>
                    updateFormData({
                      maxMembers: parseInt(e.target.value),
                    })
                  }
                  className="w-full h-2 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
                />
                <div className="flex justify-between text-xs text-zinc-400 mt-1">
                  <span>4</span>
                  <span>50</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Invite Friends */}
        {step === 4 && (
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
                      onClick={() => toggleFriend(friend.id)}
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
        )}

        {/* Navigation */}
        <div className="flex flex-col items-center gap-3 mt-10 max-w-xs mx-auto">
          <button
            type="button"
            onClick={step === TOTAL_STEPS ? handleSubmit : handleNext}
            disabled={!canProceed() || loading}
            className={`w-full py-3.5 rounded-full font-medium transition-all ${
              canProceed()
                ? 'bg-zinc-900 text-white hover:bg-zinc-800'
                : 'bg-zinc-200 text-zinc-400 cursor-not-allowed'
            } disabled:opacity-50`}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Creating...
              </span>
            ) : step === TOTAL_STEPS ? (
              'Create League'
            ) : (
              'Next'
            )}
          </button>
          {step > 1 && (
            <button
              type="button"
              onClick={handleBack}
              className="w-full py-3.5 rounded-full font-medium border border-zinc-300 text-zinc-700 hover:bg-zinc-50 transition-colors"
            >
              Back
            </button>
          )}
        </div>
      </main>

      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn { animation: fadeIn 0.3s ease-out; }
        .scrollbar-thin::-webkit-scrollbar { height: 4px; }
        .scrollbar-thin::-webkit-scrollbar-track { background: transparent; }
        .scrollbar-thin::-webkit-scrollbar-thumb { background: #d4d4d8; border-radius: 9999px; }
        .scrollbar-thin { scrollbar-width: thin; scrollbar-color: #d4d4d8 transparent; }
      `}</style>
    </div>
  );
}
