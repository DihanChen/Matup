"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase";
import { getApiBaseUrl } from "@/lib/api";
import type { SubmitResultPayload } from "@/lib/league-types";
import {
  ERROR_SELECT_WINNER,
  ERROR_ENTER_SCORES,
  ERROR_SUBMIT_FAILED,
  ERROR_NOT_AUTHENTICATED,
  ERROR_NETWORK,
} from "@/lib/result-submission-strings";

type GameScore = { a: string; b: string };
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
  leagueName?: string;
  sideA: { userId: string; name: string | null; avatarUrl?: string | null }[];
  sideB: { userId: string; name: string | null; avatarUrl?: string | null }[];
  onSuccess: () => void | Promise<void>;
};

export default function SubmitResultModal({
  isOpen,
  onClose,
  fixtureId,
  weekNumber,
  sportType,
  leagueName,
  sideA,
  sideB,
  onSuccess,
}: SubmitResultModalProps) {
  const isPickleball = sportType === "pickleball";
  const isTennis =
    sportType === "tennis" || sportType === "padel" || sportType === "badminton";
  const isRacketSport = isPickleball || isTennis;
  const maxGames = isPickleball ? 3 : isTennis ? 5 : 1;
  const scoreFieldMax = isPickleball ? 30 : isTennis ? 7 : 999;

  const [outcomeType, setOutcomeType] = useState<"played" | "forfeit">("played");
  const [entryMode, setEntryMode] = useState<"detailed" | "quick">("detailed");
  const [games, setGames] = useState<GameScore[]>([{ a: "", b: "" }]);
  const [activeGame, setActiveGame] = useState(0);
  const [sidesSwapped, setSidesSwapped] = useState(false);
  const [winner, setWinner] = useState<"A" | "B" | "">("");
  const [forfeitReason, setForfeitReason] = useState<ForfeitReason>("opponent_no_show");
  const [notes, setNotes] = useState("");
  const [showNotes, setShowNotes] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setGames([{ a: "", b: "" }]);
    setActiveGame(0);
    setSidesSwapped(false);
    setOutcomeType("played");
    setEntryMode("detailed");
    setWinner("");
    setForfeitReason("opponent_no_show");
    setNotes("");
    setShowNotes(false);
    setShowConfirmation(false);
    setError(null);
    setSubmitting(false);
  }, [isOpen]);

  /* ── Display helpers ── */

  const leftSide = sidesSwapped ? sideB : sideA;
  const rightSide = sidesSwapped ? sideA : sideB;

  const leftNames = useMemo(
    () => leftSide.map((p) => p.name || "?"),
    [leftSide]
  );
  const rightNames = useMemo(
    () => rightSide.map((p) => p.name || "?"),
    [rightSide]
  );

  const currentGame = games[activeGame] || { a: "", b: "" };
  const leftScore = sidesSwapped ? currentGame.b : currentGame.a;
  const rightScore = sidesSwapped ? currentGame.a : currentGame.b;

  /* ── Score mutations ── */

  function updateScore(displaySide: "left" | "right", value: string) {
    const dataSide =
      displaySide === "left"
        ? sidesSwapped
          ? "b"
          : "a"
        : sidesSwapped
        ? "a"
        : "b";
    setGames((prev) =>
      prev.map((g, i) => (i === activeGame ? { ...g, [dataSide]: value } : g))
    );
  }

  function resetCurrentGame() {
    setGames((prev) =>
      prev.map((g, i) => (i === activeGame ? { a: "", b: "" } : g))
    );
  }

  function switchSides() {
    setSidesSwapped((prev) => !prev);
  }

  function addGame() {
    if (games.length < maxGames) {
      setGames((prev) => [...prev, { a: "", b: "" }]);
      setActiveGame(games.length);
    }
  }

  function getWinnerFromGames(): "A" | "B" | "" {
    let winsA = 0;
    let winsB = 0;

    for (const g of games) {
      const a = parseInt(g.a, 10);
      const b = parseInt(g.b, 10);
      if (Number.isNaN(a) || Number.isNaN(b)) continue;
      if (a > b) winsA += 1;
      else if (b > a) winsB += 1;
    }

    if (winsA > winsB) return "A";
    if (winsB > winsA) return "B";
    return "";
  }

  /* ── Build payload ── */

  function buildPayload(): { payload: SubmitResultPayload; detectedWinner: "A" | "B" } | null {
    const isForfeit = outcomeType === "forfeit";

    const parsedSetScores =
      !isForfeit && isRacketSport && entryMode === "detailed"
        ? games
            .filter((g) => g.a !== "" && g.b !== "")
            .map((g) => [parseInt(g.a, 10), parseInt(g.b, 10)])
        : !isForfeit && entryMode === "detailed" && games.length === 1 && games[0].a !== "" && games[0].b !== ""
        ? [[parseInt(games[0].a, 10), parseInt(games[0].b, 10)]]
        : undefined;

    const detectedWinner = isForfeit || entryMode === "quick" ? winner : getWinnerFromGames();

    if (!detectedWinner) {
      setError(entryMode === "quick" ? ERROR_SELECT_WINNER : ERROR_ENTER_SCORES);
      return null;
    }

    return {
      detectedWinner,
      payload: {
        winner: detectedWinner,
        sets: parsedSetScores && parsedSetScores.length > 0 ? parsedSetScores : undefined,
        outcome_type: isForfeit ? "forfeit" : "played",
        forfeit_reason: isForfeit ? forfeitReason : undefined,
        notes: notes.trim() ? notes.trim() : undefined,
      },
    };
  }

  function getConfirmationSummary(): string {
    const isForfeit = outcomeType === "forfeit";
    const detectedWinner = isForfeit || entryMode === "quick" ? winner : getWinnerFromGames();
    const winnerNames = detectedWinner === "A"
      ? sideA.map((p) => p.name || "?").join(" & ")
      : sideB.map((p) => p.name || "?").join(" & ");
    const loserNames = detectedWinner === "A"
      ? sideB.map((p) => p.name || "?").join(" & ")
      : sideA.map((p) => p.name || "?").join(" & ");

    if (isForfeit) {
      return `${winnerNames} wins by forfeit over ${loserNames}`;
    }

    if (entryMode === "quick") {
      return `${winnerNames} defeats ${loserNames}`;
    }

    const scores = games
      .filter((g) => g.a !== "" && g.b !== "")
      .map((g) => `${g.a}-${g.b}`)
      .join(", ");
    return `${winnerNames} defeats ${loserNames}${scores ? ` (${scores})` : ""}`;
  }

  function handlePreSubmit() {
    setError(null);
    const result = buildPayload();
    if (!result) return;
    setShowConfirmation(true);
  }

  /* ── Submit ── */

  async function handleSubmit() {
    if (!fixtureId) return;
    setSubmitting(true);
    setError(null);

    const result = buildPayload();
    if (!result) {
      setSubmitting(false);
      return;
    }
    const { payload } = result;

    try {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        setError(ERROR_NOT_AUTHENTICATED);
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

      const data = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;
      if (!response.ok) {
        setError(data?.error || ERROR_SUBMIT_FAILED);
        setSubmitting(false);
        return;
      }

      await onSuccess();
      onClose();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : ERROR_NETWORK
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (!isOpen) return null;

  const canSave =
    outcomeType === "forfeit"
      ? winner !== ""
      : entryMode === "quick"
      ? winner !== ""
      : games.some((g) => g.a !== "" && g.b !== "");

  const courtLabel = weekNumber ? `Court ${weekNumber}` : "Match";
  const gameLabel = isTennis ? `Set ${activeGame + 1}` : isPickleball ? `Game ${activeGame + 1}` : null;
  const subtitle = [leagueName, courtLabel, gameLabel]
    .filter(Boolean)
    .join(" \u2022 ");

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-zinc-50/[0.98]">
      <div className="mx-auto flex min-h-full max-w-xl flex-col px-5 py-6 sm:px-8 sm:py-10">
        {/* ── Cancel ── */}
        <button
          type="button"
          onClick={onClose}
          disabled={submitting}
          className="inline-flex items-center gap-1.5 self-start text-sm font-medium text-zinc-600 transition-colors hover:text-zinc-900 disabled:opacity-50"
        >
          <svg
            className="h-4 w-4"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M17 10a.75.75 0 0 1-.75.75H5.612l4.158 3.96a.75.75 0 1 1-1.04 1.08l-5.5-5.25a.75.75 0 0 1 0-1.08l5.5-5.25a.75.75 0 1 1 1.04 1.08L5.612 9.25H16.25A.75.75 0 0 1 17 10Z"
              clipRule="evenodd"
            />
          </svg>
          Cancel
        </button>

        {/* ── Header ── */}
        <div className="mt-6 text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-orange-500">
            {subtitle}
          </p>
          <h2 className="mt-1 text-2xl font-bold text-zinc-900 sm:text-3xl">
            Add Score
          </h2>
        </div>

        {/* ── Quick / Detailed toggle ── */}
        {outcomeType === "played" && (
          <div className="mt-4 flex items-center justify-center">
            <div className="inline-flex rounded-xl border border-zinc-200 bg-white p-1">
              <button
                type="button"
                onClick={() => setEntryMode("detailed")}
                className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  entryMode === "detailed"
                    ? "bg-orange-500 text-white"
                    : "text-zinc-600 hover:text-zinc-900"
                }`}
              >
                Detailed
              </button>
              <button
                type="button"
                onClick={() => setEntryMode("quick")}
                className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  entryMode === "quick"
                    ? "bg-orange-500 text-white"
                    : "text-zinc-600 hover:text-zinc-900"
                }`}
              >
                Quick Result
              </button>
            </div>
          </div>
        )}

        {/* ── Confirmation overlay ── */}
        {showConfirmation && (
          <div className="mt-6 rounded-2xl border-2 border-orange-200 bg-orange-50 p-5 text-center">
            <p className="text-sm font-medium text-zinc-500 mb-2">Confirm result</p>
            <p className="text-base font-semibold text-zinc-900">{getConfirmationSummary()}</p>
            <div className="mt-4 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setShowConfirmation(false)}
                className="px-4 py-2 rounded-full border border-zinc-200 text-sm font-medium text-zinc-600 hover:bg-zinc-50 transition-colors"
              >
                Go Back
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="px-6 py-2 rounded-full bg-orange-500 text-white text-sm font-semibold hover:bg-orange-600 transition-colors disabled:opacity-50"
              >
                {submitting ? "Saving..." : "Confirm & Save"}
              </button>
            </div>
          </div>
        )}

        {outcomeType === "played" && entryMode === "quick" && !showConfirmation ? (
          /* ── Quick Result: just pick the winner ── */
          <div className="mt-8 space-y-4">
            <p className="text-center text-sm text-zinc-500">Who won?</p>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setWinner("A")}
                className={`rounded-2xl border-2 p-6 text-center transition-all ${
                  winner === "A"
                    ? "border-orange-500 bg-orange-50 shadow-md"
                    : "border-zinc-200 hover:border-orange-300"
                }`}
              >
                <div className="flex justify-center -space-x-2 mb-3">
                  {sideA.map((player, idx) => (
                    <div
                      key={idx}
                      className="relative h-12 w-12 overflow-hidden rounded-full border-2 border-white"
                    >
                      {player.avatarUrl ? (
                        <Image src={player.avatarUrl} alt={player.name || "Player"} fill className="object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-indigo-100">
                          <svg className="h-6 w-6 text-indigo-400" viewBox="0 0 20 20" fill="currentColor"><path d="M10 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM3.465 14.493a1.23 1.23 0 0 0 .41 1.412A9.957 9.957 0 0 0 10 18c2.31 0 4.438-.784 6.131-2.1.43-.333.604-.903.408-1.41a7.002 7.002 0 0 0-13.074.003Z" /></svg>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <div className="text-sm font-semibold text-zinc-900">
                  {sideA.map((p) => p.name || "?").join(" & ")}
                </div>
                {winner === "A" && (
                  <span className="mt-2 inline-block text-xs font-bold text-orange-500">Winner</span>
                )}
              </button>
              <button
                type="button"
                onClick={() => setWinner("B")}
                className={`rounded-2xl border-2 p-6 text-center transition-all ${
                  winner === "B"
                    ? "border-orange-500 bg-orange-50 shadow-md"
                    : "border-zinc-200 hover:border-orange-300"
                }`}
              >
                <div className="flex justify-center -space-x-2 mb-3">
                  {sideB.map((player, idx) => (
                    <div
                      key={idx}
                      className="relative h-12 w-12 overflow-hidden rounded-full border-2 border-white"
                    >
                      {player.avatarUrl ? (
                        <Image src={player.avatarUrl} alt={player.name || "Player"} fill className="object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-indigo-100">
                          <svg className="h-6 w-6 text-indigo-400" viewBox="0 0 20 20" fill="currentColor"><path d="M10 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM3.465 14.493a1.23 1.23 0 0 0 .41 1.412A9.957 9.957 0 0 0 10 18c2.31 0 4.438-.784 6.131-2.1.43-.333.604-.903.408-1.41a7.002 7.002 0 0 0-13.074.003Z" /></svg>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <div className="text-sm font-semibold text-zinc-900">
                  {sideB.map((p) => p.name || "?").join(" & ")}
                </div>
                {winner === "B" && (
                  <span className="mt-2 inline-block text-xs font-bold text-orange-500">Winner</span>
                )}
              </button>
            </div>
          </div>
        ) : outcomeType === "played" && !showConfirmation ? (
          <>
            {/* ── Players ── */}
            <div className="mt-8 flex items-start justify-around gap-4 sm:mt-10">
              {/* Left side */}
              <div className="flex flex-col items-center text-center">
                <div className="flex -space-x-2">
                  {leftSide.map((player, idx) => (
                    <div
                      key={idx}
                      className="relative h-14 w-14 overflow-hidden rounded-full border-2 border-white sm:h-16 sm:w-16"
                    >
                      {player.avatarUrl ? (
                        <Image
                          src={player.avatarUrl}
                          alt={player.name || "Player"}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-indigo-100">
                          <svg
                            className="h-7 w-7 text-indigo-400"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                            aria-hidden="true"
                          >
                            <path d="M10 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM3.465 14.493a1.23 1.23 0 0 0 .41 1.412A9.957 9.957 0 0 0 10 18c2.31 0 4.438-.784 6.131-2.1.43-.333.604-.903.408-1.41a7.002 7.002 0 0 0-13.074.003Z" />
                          </svg>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <div className="mt-3">
                  <div className="text-base font-semibold text-zinc-900 sm:text-lg">
                    {leftNames[0]}
                  </div>
                  {leftNames.length > 1 && (
                    <div className="mt-0.5 text-sm text-zinc-400">
                      {leftNames[1]}
                    </div>
                  )}
                </div>
              </div>

              {/* Right side */}
              <div className="flex flex-col items-center text-center">
                <div className="flex -space-x-2">
                  {rightSide.map((player, idx) => (
                    <div
                      key={idx}
                      className="relative h-14 w-14 overflow-hidden rounded-full border-2 border-white sm:h-16 sm:w-16"
                    >
                      {player.avatarUrl ? (
                        <Image
                          src={player.avatarUrl}
                          alt={player.name || "Player"}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-indigo-100">
                          <svg
                            className="h-7 w-7 text-indigo-400"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                            aria-hidden="true"
                          >
                            <path d="M10 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM3.465 14.493a1.23 1.23 0 0 0 .41 1.412A9.957 9.957 0 0 0 10 18c2.31 0 4.438-.784 6.131-2.1.43-.333.604-.903.408-1.41a7.002 7.002 0 0 0-13.074.003Z" />
                          </svg>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <div className="mt-3">
                  <div className="text-base font-semibold text-zinc-900 sm:text-lg">
                    {rightNames[0]}
                  </div>
                  {rightNames.length > 1 && (
                    <div className="mt-0.5 text-sm text-zinc-400">
                      {rightNames[1]}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ── Score Boxes ── */}
            <div className="mt-8 flex items-center justify-center gap-4 sm:mt-10 sm:gap-6">
              {/* Left score */}
              <div className="flex flex-col items-center">
                <span className="mb-2 text-xs font-semibold uppercase tracking-wider text-indigo-500">
                  {isTennis ? "Games Won" : "Points Scored"}
                </span>
                <input
                  type="number"
                  inputMode="numeric"
                  value={leftScore}
                  onChange={(e) => updateScore("left", e.target.value)}
                  min="0"
                  max={scoreFieldMax}
                  placeholder="0"
                  className="h-36 w-32 rounded-2xl border-2 border-zinc-200 bg-white text-center text-6xl font-bold text-zinc-900 transition-colors focus:border-orange-500 focus:outline-none sm:h-44 sm:w-40 sm:text-7xl [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                />
              </div>

              {/* VS */}
              <span className="mt-6 text-2xl font-light text-zinc-300">vs</span>

              {/* Right score */}
              <div className="flex flex-col items-center">
                <span className="mb-2 text-xs font-semibold uppercase tracking-wider text-indigo-500">
                  {isTennis ? "Games Won" : "Points Scored"}
                </span>
                <input
                  type="number"
                  inputMode="numeric"
                  value={rightScore}
                  onChange={(e) => updateScore("right", e.target.value)}
                  min="0"
                  max={scoreFieldMax}
                  placeholder="0"
                  className="h-36 w-32 rounded-2xl border-2 border-zinc-200 bg-white text-center text-6xl font-bold text-zinc-900 transition-colors focus:border-orange-500 focus:outline-none sm:h-44 sm:w-40 sm:text-7xl [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                />
              </div>
            </div>
          </>
        ) : !showConfirmation ? (
          /* ── Forfeit Mode ── */
          <div className="mt-8 space-y-5">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-700">
                Reason
              </label>
              <select
                value={forfeitReason}
                onChange={(e) =>
                  setForfeitReason(e.target.value as ForfeitReason)
                }
                className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-zinc-900 focus:border-transparent focus:ring-2 focus:ring-orange-500"
              >
                {FORFEIT_REASON_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <p className="mb-3 text-sm text-zinc-600">Award win to</p>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setWinner("A")}
                  className={`rounded-xl border-2 p-5 text-center transition-all ${
                    winner === "A"
                      ? "border-orange-500 bg-orange-50"
                      : "border-zinc-200 hover:border-orange-300"
                  }`}
                >
                  <div className="text-sm font-medium text-zinc-900">
                    {sideA.map((p) => p.name || "?").join(" & ")}
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setWinner("B")}
                  className={`rounded-xl border-2 p-5 text-center transition-all ${
                    winner === "B"
                      ? "border-orange-500 bg-orange-50"
                      : "border-zinc-200 hover:border-orange-300"
                  }`}
                >
                  <div className="text-sm font-medium text-zinc-900">
                    {sideB.map((p) => p.name || "?").join(" & ")}
                  </div>
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {/* ── Notes (collapsible) ── */}
        {showConfirmation ? null : showNotes ? (
          <div className="mt-4">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Any notes about this match..."
              className="w-full resize-none rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-900 focus:border-transparent focus:ring-2 focus:ring-orange-500"
            />
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowNotes(true)}
            className="mt-4 self-center text-xs font-medium text-zinc-400 transition-colors hover:text-zinc-600"
          >
            + Add notes
          </button>
        )}

        {/* ── Error ── */}
        {error && (
          <p className="mt-4 text-center text-sm text-red-500">{error}</p>
        )}

        {/* ── Save Score Button ── */}
        {!showConfirmation && (
          <button
            type="button"
            onClick={handlePreSubmit}
            disabled={submitting || !canSave}
            className="mx-auto mt-8 flex w-full max-w-xs items-center justify-center gap-2.5 rounded-full bg-orange-500 px-8 py-4 text-base font-semibold text-white shadow-lg transition-colors hover:bg-orange-600 disabled:opacity-50 sm:mt-10"
          >
            <svg
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z"
                clipRule="evenodd"
              />
            </svg>
            {submitting ? "Saving..." : "Save Score"}
          </button>
        )}

        {/* ── Secondary Actions ── */}
        {!showConfirmation && <div className="mx-auto mt-6 inline-flex items-center gap-1 rounded-2xl border border-zinc-200 bg-white p-1.5">
          <button
            type="button"
            onClick={resetCurrentGame}
            className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
          >
            <svg
              className="h-4 w-4"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M15.312 11.424a5.5 5.5 0 0 1-9.201 2.466l-.312-.311h2.433a.75.75 0 0 0 0-1.5H4.28a.75.75 0 0 0-.75.75v3.955a.75.75 0 0 0 1.5 0v-2.134l.228.228a7 7 0 0 0 11.72-3.138.75.75 0 0 0-1.465-.316Zm-10.624-2.85a5.5 5.5 0 0 1 9.201-2.465l.312.31H11.77a.75.75 0 0 0 0 1.5h3.953a.75.75 0 0 0 .75-.75V3.214a.75.75 0 0 0-1.5 0v2.134l-.228-.228A7 7 0 0 0 3.023 8.257a.75.75 0 1 0 1.465.316Z"
                clipRule="evenodd"
              />
            </svg>
            {isTennis ? "Reset Set" : "Reset Game"}
          </button>
          <button
            type="button"
            onClick={switchSides}
            className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
          >
            <svg
              className="h-4 w-4"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M13.2 2.24a.75.75 0 0 0 .04 1.06l2.1 1.95H6.75a.75.75 0 0 0 0 1.5h8.59l-2.1 1.95a.75.75 0 1 0 1.02 1.1l3.5-3.25a.75.75 0 0 0 0-1.1l-3.5-3.25a.75.75 0 0 0-1.06.04Zm-6.4 8a.75.75 0 0 0-1.06-.04l-3.5 3.25a.75.75 0 0 0 0 1.1l3.5 3.25a.75.75 0 1 0 1.02-1.1l-2.1-1.95h8.59a.75.75 0 0 0 0-1.5H4.66l2.1-1.95a.75.75 0 0 0 .04-1.06Z"
                clipRule="evenodd"
              />
            </svg>
            Switch Sides
          </button>
        </div>}

        {/* ── Mode toggle: played / forfeit ── */}
        {!showConfirmation && <div className="mt-4 text-center">
          {outcomeType === "played" ? (
            <button
              type="button"
              onClick={() => setOutcomeType("forfeit")}
              className="text-xs font-medium text-zinc-400 transition-colors hover:text-zinc-600"
            >
              Report forfeit or cancellation instead
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setOutcomeType("played")}
              className="text-xs font-medium text-orange-500 transition-colors hover:text-orange-600"
            >
              Back to score entry
            </button>
          )}
        </div>}

        {/* ── Game Pagination (racket sports) ── */}
        {isRacketSport && outcomeType === "played" && entryMode === "detailed" && !showConfirmation && (
          <div className="mt-8 flex items-center justify-between text-sm text-zinc-400">
            <div className="flex items-center gap-2.5">
              <div className="flex gap-1.5">
                {games.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveGame(idx)}
                    className={`h-2.5 w-2.5 rounded-full transition-colors ${
                      idx === activeGame
                        ? "bg-orange-500"
                        : idx < activeGame
                        ? "bg-orange-300"
                        : "bg-zinc-300"
                    }`}
                    aria-label={isTennis ? `Set ${idx + 1}` : `Game ${idx + 1}`}
                  />
                ))}
              </div>
              <span>
                {isTennis ? "Set" : "Game"} {activeGame + 1} of {games.length}
              </span>
            </div>
            {games.length < maxGames && (
              <button
                type="button"
                onClick={addGame}
                className="text-sm font-medium text-orange-500 transition-colors hover:text-orange-600"
                aria-label={isTennis ? "Add Set" : "Add Game"}
              >
                + Add {isTennis ? "Set" : "Game"}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
