"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase";
import { getApiBaseUrl } from "@/lib/api";
import type { SubmitResultPayload } from "@/lib/league-types";

type SetScore = { a: string; b: string };
type ForfeitReason =
  | "opponent_no_show"
  | "opponent_injury"
  | "self_injury"
  | "weather"
  | "facility_issue"
  | "other";

const FORFEIT_REASON_OPTIONS: Array<{ value: ForfeitReason; label: string }> = [
  { value: "opponent_no_show", label: "Opponent did not show up" },
  { value: "opponent_injury", label: "Opponent injury" },
  { value: "self_injury", label: "Self/team injury" },
  { value: "weather", label: "Weather" },
  { value: "facility_issue", label: "Facility issue" },
  { value: "other", label: "Other" },
];

type SubmitResultModalProps = {
  isOpen: boolean;
  onClose: () => void;
  fixtureId: string;
  weekNumber: number | null;
  sportType?: string;
  sideA: { userId: string; name: string | null }[];
  sideB: { userId: string; name: string | null }[];
  onSuccess: () => void | Promise<void>;
};

export default function SubmitResultModal({
  isOpen,
  onClose,
  fixtureId,
  weekNumber,
  sportType,
  sideA,
  sideB,
  onSuccess,
}: SubmitResultModalProps) {
  const [outcomeType, setOutcomeType] = useState<"played" | "forfeit">("played");
  const [scoreMode, setScoreMode] = useState<"simple" | "detailed">("simple");
  const [winner, setWinner] = useState<"A" | "B" | "">("");
  const [forfeitReason, setForfeitReason] = useState<ForfeitReason>("opponent_no_show");
  const [sets, setSets] = useState<SetScore[]>([{ a: "", b: "" }]);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setOutcomeType("played");
    setScoreMode("simple");
    setWinner("");
    setForfeitReason("opponent_no_show");
    setSets([{ a: "", b: "" }]);
    setNotes("");
    setError(null);
    setSubmitting(false);
  }, [isOpen]);

  const sideANames = useMemo(
    () => sideA.map((participant) => participant.name || "?").join(" & ") || "Side A",
    [sideA]
  );
  const sideBNames = useMemo(
    () => sideB.map((participant) => participant.name || "?").join(" & ") || "Side B",
    [sideB]
  );

  function addSet() {
    setSets((prev) => [...prev, { a: "", b: "" }]);
  }

  function removeSet(index: number) {
    setSets((prev) => prev.filter((_, i) => i !== index));
  }

  function updateSet(index: number, side: "a" | "b", value: string) {
    setSets((prev) =>
      prev.map((set, i) => (i === index ? { ...set, [side]: value } : set))
    );
  }

  function getWinnerFromSets(): "A" | "B" | "" {
    let setsA = 0;
    let setsB = 0;

    for (const set of sets) {
      const a = parseInt(set.a, 10);
      const b = parseInt(set.b, 10);
      if (Number.isNaN(a) || Number.isNaN(b)) continue;
      if (a > b) setsA += 1;
      else if (b > a) setsB += 1;
    }

    if (setsA > setsB) return "A";
    if (setsB > setsA) return "B";
    return "";
  }

  async function handleSubmit() {
    if (!fixtureId) return;
    setSubmitting(true);
    setError(null);

    const isForfeit = outcomeType === "forfeit";
    const parsedSetScores =
      !isForfeit && scoreMode === "detailed"
        ? sets
            .filter((set) => set.a !== "" && set.b !== "")
            .map((set) => [parseInt(set.a, 10), parseInt(set.b, 10)])
        : undefined;
    const detectedWinner =
      !isForfeit && scoreMode === "detailed" ? getWinnerFromSets() : winner;

    if (!detectedWinner) {
      setError("Select who should receive the win before submitting.");
      setSubmitting(false);
      return;
    }

    const payload: SubmitResultPayload = {
      winner: detectedWinner,
      sets:
        !isForfeit && parsedSetScores && parsedSetScores.length > 0
          ? parsedSetScores
          : undefined,
      outcome_type: isForfeit ? "forfeit" : "played",
      forfeit_reason: isForfeit ? forfeitReason : undefined,
      notes: notes.trim() ? notes.trim() : undefined,
    };

    try {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        setError("You must be logged in to submit results.");
        setSubmitting(false);
        return;
      }

      const response = await fetch(
        `${getApiBaseUrl()}/api/fixtures/${fixtureId}/results/submit`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ payload }),
        }
      );

      const data = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        setError(data?.error || "Failed to submit result.");
        setSubmitting(false);
        return;
      }

      await onSuccess();
      onClose();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Failed to submit result.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!isOpen) return null;

  const detectedWinner = getWinnerFromSets();
  const isPickleball = sportType === "pickleball";
  const detailedScoreModeLabel = isPickleball ? "Game Scores" : "Set Scores";
  const scoreFieldMax = isPickleball ? 30 : 7;
  const scoreFieldPlaceholder = isPickleball ? "11" : "0";

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 max-h-[85vh] overflow-y-auto">
        <div className="flex items-start justify-between gap-4 mb-2">
          <div>
            <h3 className="text-xl font-bold text-zinc-900">Submit Result</h3>
            <p className="text-sm text-zinc-500">
              {weekNumber ? `Week ${weekNumber}` : "Match"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-zinc-600 rounded-lg"
            aria-label="Close"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-5 h-5"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="text-sm text-zinc-700 mb-4">
          <span className="font-medium">{sideANames}</span>
          <span className="mx-2 text-zinc-400">vs</span>
          <span className="font-medium">{sideBNames}</span>
        </div>

        <div className="flex bg-zinc-100 rounded-full p-0.5 mb-4">
          <button
            type="button"
            onClick={() => setOutcomeType("played")}
            className={`flex-1 px-3 py-1 rounded-full text-xs font-medium transition-all ${
              outcomeType === "played" ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500"
            }`}
          >
            Match Played
          </button>
          <button
            type="button"
            onClick={() => setOutcomeType("forfeit")}
            className={`flex-1 px-3 py-1 rounded-full text-xs font-medium transition-all ${
              outcomeType === "forfeit" ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500"
            }`}
          >
            Forfeit / Cancel
          </button>
        </div>

        {outcomeType === "played" && (
          <div className="flex bg-zinc-100 rounded-full p-0.5 mb-4">
            <button
              type="button"
              onClick={() => setScoreMode("simple")}
              className={`flex-1 px-3 py-1 rounded-full text-xs font-medium transition-all ${
                scoreMode === "simple" ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500"
              }`}
            >
              Winner Only
            </button>
            <button
              type="button"
              onClick={() => setScoreMode("detailed")}
              className={`flex-1 px-3 py-1 rounded-full text-xs font-medium transition-all ${
                scoreMode === "detailed" ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500"
              }`}
            >
              {detailedScoreModeLabel}
            </button>
          </div>
        )}

        {outcomeType === "forfeit" ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1.5">Reason</label>
              <select
                value={forfeitReason}
                onChange={(event) => setForfeitReason(event.target.value as ForfeitReason)}
                className="w-full px-4 py-2.5 border border-zinc-200 rounded-xl bg-zinc-50 text-zinc-900 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                {FORFEIT_REASON_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <p className="text-sm text-zinc-600 mb-3">Award win to</p>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setWinner("A")}
                  className={`p-5 rounded-xl border-2 text-center transition-all ${
                    winner === "A"
                      ? "border-blue-500 bg-blue-50"
                      : "border-zinc-200 hover:border-blue-300"
                  }`}
                >
                  <div className="text-sm font-medium text-blue-700">{sideANames}</div>
                </button>
                <button
                  type="button"
                  onClick={() => setWinner("B")}
                  className={`p-5 rounded-xl border-2 text-center transition-all ${
                    winner === "B"
                      ? "border-red-500 bg-red-50"
                      : "border-zinc-200 hover:border-red-300"
                  }`}
                >
                  <div className="text-sm font-medium text-red-700">{sideBNames}</div>
                </button>
              </div>
            </div>
          </div>
        ) : scoreMode === "simple" ? (
          <div>
            <p className="text-sm text-zinc-600 mb-3">Select winner</p>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setWinner("A")}
                className={`p-5 rounded-xl border-2 text-center transition-all ${
                  winner === "A"
                    ? "border-blue-500 bg-blue-50"
                    : "border-zinc-200 hover:border-blue-300"
                }`}
              >
                <div className="text-sm font-medium text-blue-700">{sideANames}</div>
              </button>
              <button
                type="button"
                onClick={() => setWinner("B")}
                className={`p-5 rounded-xl border-2 text-center transition-all ${
                  winner === "B"
                    ? "border-red-500 bg-red-50"
                    : "border-zinc-200 hover:border-red-300"
                }`}
              >
                <div className="text-sm font-medium text-red-700">{sideBNames}</div>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-[1fr_auto_1fr_auto] gap-2 items-center">
              <div className="text-xs font-medium text-blue-700 text-center">{sideANames}</div>
              <div></div>
              <div className="text-xs font-medium text-red-700 text-center">{sideBNames}</div>
              <div></div>
            </div>
            {sets.map((set, index) => (
              <div key={index} className="grid grid-cols-[1fr_auto_1fr_auto] gap-2 items-center">
                <input
                  type="number"
                  value={set.a}
                  onChange={(event) => updateSet(index, "a", event.target.value)}
                  min="0"
                  max={scoreFieldMax}
                  placeholder={scoreFieldPlaceholder}
                  className="w-full px-3 py-2 border border-blue-200 rounded-xl bg-blue-50 text-zinc-900 text-center font-bold focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <span className="text-zinc-400 font-bold text-sm">-</span>
                <input
                  type="number"
                  value={set.b}
                  onChange={(event) => updateSet(index, "b", event.target.value)}
                  min="0"
                  max={scoreFieldMax}
                  placeholder={scoreFieldPlaceholder}
                  className="w-full px-3 py-2 border border-red-200 rounded-xl bg-red-50 text-zinc-900 text-center font-bold focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
                {sets.length > 1 ? (
                  <button
                    type="button"
                    onClick={() => removeSet(index)}
                    className="text-zinc-400 hover:text-red-500 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                ) : (
                  <div className="w-4"></div>
                )}
              </div>
            ))}
            {sets.length < 5 && (
              <button
                type="button"
                onClick={addSet}
                className="w-full py-2 border border-dashed border-zinc-300 rounded-xl text-sm text-zinc-500 hover:border-orange-300 hover:text-orange-500 transition-all"
              >
                + Add Set
              </button>
            )}
            {detectedWinner && (
              <div className="text-center text-sm font-medium text-orange-500">
                Winner: {detectedWinner === "A" ? sideANames : sideBNames}
              </div>
            )}
          </div>
        )}

        <div className="mt-4">
          <label className="block text-sm font-medium text-zinc-700 mb-1.5">Notes (optional)</label>
          <textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            rows={3}
            placeholder="Any context for this result..."
            className="w-full px-4 py-2 border border-zinc-200 rounded-xl bg-zinc-50 text-zinc-900 resize-none"
          />
        </div>

        {error && <p className="text-sm text-red-500 mt-3">{error}</p>}

        <div className="flex gap-3 mt-6">
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex-1 py-3 bg-orange-500 text-white rounded-full font-medium hover:bg-orange-600 transition-colors disabled:opacity-50"
          >
            {submitting
              ? "Submitting..."
              : outcomeType === "forfeit"
              ? "Submit Forfeit Outcome"
              : "Submit Result"}
          </button>
          <button
            onClick={onClose}
            disabled={submitting}
            className="flex-1 py-3 border border-zinc-200 text-zinc-700 rounded-full font-medium hover:bg-zinc-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
