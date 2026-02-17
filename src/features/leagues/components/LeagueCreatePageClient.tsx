"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import StepIndicator from "@/components/create-event/StepIndicator";
import LeagueDetailsStep from "@/features/leagues/components/create/LeagueDetailsStep";
import CreateLeagueLoadingState from "@/features/leagues/components/create/CreateLeagueLoadingState";
import CreateLeagueNavigation from "@/features/leagues/components/create/CreateLeagueNavigation";
import CreateLeaguePremiumState from "@/features/leagues/components/create/CreateLeaguePremiumState";
import CreateLeagueSuccessState from "@/features/leagues/components/create/CreateLeagueSuccessState";
import InviteFriendsStep from "@/features/leagues/components/create/InviteFriendsStep";
import ScheduleStep from "@/features/leagues/components/create/ScheduleStep";
import SportAndFormatStep from "@/features/leagues/components/create/SportAndFormatStep";
import type {
  FriendProfile,
  LeagueCreateFormData,
} from "@/features/leagues/components/create/types";
import { buildLeagueRules } from "@/lib/league-rules";
import { createClient } from "@/lib/supabase";

const TOTAL_STEPS = 4;

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
  const [showSuccess, setShowSuccess] = useState(false);
  const [createdLeagueId, setCreatedLeagueId] = useState<string | null>(null);
  const [formData, setFormData] = useState<LeagueCreateFormData>({
    sportType: "",
    matchType: "",
    rotationType: "",
    scoringFormat: "",
    runningComparisonMode: "personal_progress",
    startDate: "",
    startTime: "",
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

        if (profiles) setFriends(profiles);
      }

      setLoadingFriends(false);
    }

    init();
  }, [router]);

  const updateFormData = (updates: Partial<LeagueCreateFormData>) => {
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
        return !!formData.startDate && !!formData.startTime;
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
      startTime: formData.startTime,
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

    await supabase.from("league_members").insert({
      league_id: leagueData.id,
      user_id: user.id,
      role: "owner",
    });

    if (selectedFriends.size > 0) {
      const memberInserts = Array.from(selectedFriends).map((friendId) => ({
        league_id: leagueData.id,
        user_id: friendId,
        role: "member",
      }));

      await supabase.from("league_members").insert(memberInserts);
    }

    setCreatedLeagueId(leagueData.id);
    setShowSuccess(true);
    setLoading(false);
  }

  const toggleFriend = (friendId: string) => {
    setSelectedFriends((prev) => {
      const next = new Set(prev);
      if (next.has(friendId)) next.delete(friendId);
      else next.add(friendId);
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

  if (isPremium === null) return <CreateLeagueLoadingState />;
  if (!isPremium) return <CreateLeaguePremiumState />;
  if (showSuccess) {
    return (
      <CreateLeagueSuccessState
        formData={formData}
        createdLeagueId={createdLeagueId}
        onShare={async () => {
          if (!createdLeagueId) return;
          const shareUrl = `${window.location.origin}/leagues/${createdLeagueId}`;
          if (navigator.share) {
            try {
              await navigator.share({
                title: "Join my league on MatUp!",
                url: shareUrl,
              });
              return;
            } catch (shareError) {
              if (
                shareError &&
                typeof shareError === "object" &&
                "name" in shareError &&
                (shareError as { name?: string }).name === "AbortError"
              ) {
                return;
              }
            }
          }
          await navigator.clipboard.writeText(shareUrl);
        }}
      />
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

        {step === 1 && <SportAndFormatStep formData={formData} onUpdateFormData={updateFormData} />}
        {step === 2 && <ScheduleStep formData={formData} onUpdateFormData={updateFormData} />}
        {step === 3 && <LeagueDetailsStep formData={formData} onUpdateFormData={updateFormData} />}
        {step === 4 && (
          <InviteFriendsStep
            loadingFriends={loadingFriends}
            friends={friends}
            selectedFriends={selectedFriends}
            onToggleFriend={toggleFriend}
            getInitials={getInitials}
          />
        )}

        <CreateLeagueNavigation
          canProceed={canProceed()}
          loading={loading}
          step={step}
          totalSteps={TOTAL_STEPS}
          onNextOrSubmit={step === TOTAL_STEPS ? handleSubmit : handleNext}
          onBack={handleBack}
        />
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
