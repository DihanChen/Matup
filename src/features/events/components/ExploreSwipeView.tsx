"use client";

import { useState } from "react";
import type { DisplayCourt } from "@/features/courts/types";
import ExploreSwipeCard from "@/features/events/components/ExploreSwipeCard";
import type { ExploreEvent, SwipeTab } from "@/features/events/lib/exploreSwipe";

type Props = {
  loading: boolean;
  activeView: SwipeTab;
  currentEvent: ExploreEvent | null;
  currentCourt: DisplayCourt | null;
  hasPrevious: boolean;
  hasNext: boolean;
  primaryActionLabel: string;
  primaryActionLoading: boolean;
  primaryActionDisabled: boolean;
  error: string | null;
  hasActiveAreaSearch: boolean;
  onActiveViewChange: (view: SwipeTab) => void;
  onPrevious: () => void;
  onNext: () => void;
  onSkip: () => void;
  onPrimaryAction: () => void;
  onResetSuggestions: () => void;
  onOpenMapView: () => void;
};

function ArrowButton({
  direction,
  disabled,
  onClick,
}: {
  direction: "left" | "right";
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-orange-300 bg-white text-orange-500 shadow-sm transition hover:border-orange-400 hover:bg-orange-50 disabled:cursor-not-allowed disabled:border-zinc-200 disabled:text-zinc-300 disabled:hover:bg-white"
      aria-label={direction === "left" ? "Previous suggestion" : "Next suggestion"}
    >
      <svg
        className={`h-5 w-5 ${direction === "left" ? "" : "rotate-180"}`}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 19.5-7.5-7.5 7.5-7.5" />
      </svg>
    </button>
  );
}

export default function ExploreSwipeView({
  loading,
  activeView,
  currentEvent,
  currentCourt,
  hasPrevious,
  hasNext,
  primaryActionLabel,
  primaryActionLoading,
  primaryActionDisabled,
  error,
  hasActiveAreaSearch,
  onActiveViewChange,
  onPrevious,
  onNext,
  onSkip,
  onPrimaryAction,
  onResetSuggestions,
  onOpenMapView,
}: Props) {
  const [isDismissing, setIsDismissing] = useState(false);
  const [isCardExiting, setIsCardExiting] = useState(false);
  const hasSuggestion = activeView === "events" ? Boolean(currentEvent) : Boolean(currentCourt);

  return (
    <div className="relative flex h-[calc(100dvh-56px)] flex-col overflow-hidden bg-surface-warm-gradient">
      <div className="min-h-0 flex-1 overflow-hidden px-4 pb-4 pt-8 sm:px-6 lg:px-10">
        <div className="mx-auto flex h-full min-h-0 max-w-5xl flex-col">
          <div className="flex flex-shrink-0 flex-col items-center gap-5">
            <div className="rounded-full border border-orange-100 bg-white/80 p-1 shadow-sm backdrop-blur">
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => onActiveViewChange("events")}
                  className={`rounded-full px-6 py-2 text-sm font-semibold transition ${
                    activeView === "events"
                      ? "bg-zinc-950 text-white"
                      : "text-zinc-500 hover:text-zinc-700"
                  }`}
                >
                  Games
                </button>
                <button
                  type="button"
                  onClick={() => onActiveViewChange("courts")}
                  className={`rounded-full px-6 py-2 text-sm font-semibold transition ${
                    activeView === "courts"
                      ? "bg-zinc-950 text-white"
                      : "text-zinc-500 hover:text-zinc-700"
                  }`}
                >
                  Courts
                </button>
              </div>
            </div>


            {error ? (
              <div className="w-full max-w-xl rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            ) : null}
          </div>

          <div className="relative flex min-h-0 flex-1 items-center justify-center py-4 sm:py-10">
            {loading ? (
              <div className="w-full max-w-[24rem] animate-pulse rounded-[2rem] border border-orange-100 bg-white p-5 shadow-[0_24px_80px_-36px_rgba(24,24,27,0.28)]">
                <div className="h-72 rounded-[1.5rem] bg-zinc-100" />
                <div className="space-y-3 px-1 pt-5">
                  <div className="h-10 w-3/4 rounded bg-zinc-100" />
                  <div className="h-4 w-2/3 rounded bg-zinc-100" />
                  <div className="h-4 w-1/2 rounded bg-zinc-100" />
                  <div className="h-16 rounded-[1.25rem] bg-zinc-100" />
                </div>
              </div>
            ) : hasSuggestion ? (
              <div className="flex w-full items-center justify-center gap-3 sm:gap-8">
                <ArrowButton direction="left" disabled={!hasPrevious || isCardExiting} onClick={onPrevious} />

                <div className="relative mx-auto flex-1">
                  {[2, 1].map((layer) => {
                    const effectiveLayer = isCardExiting ? Math.max(0, layer - 1) : layer;
                    return (
                      <div
                        key={layer}
                        className="pointer-events-none absolute left-1/2 top-3 hidden w-full max-w-[24rem] rounded-[2rem] border border-orange-100 bg-white/60 shadow-sm sm:block"
                        style={{
                          height: "calc(100% - 16px)",
                          transform: `translateX(-50%) translateY(${effectiveLayer * 12}px) scale(${
                            1 - effectiveLayer * 0.03
                          })`,
                          transition: isCardExiting
                            ? "transform 350ms cubic-bezier(0.2, 0.8, 0.2, 1)"
                            : "none",
                        }}
                      />
                    );
                  })}
                  <div className="relative z-10 mx-auto flex justify-center">
                    <ExploreSwipeCard
                      activeView={activeView}
                      event={currentEvent}
                      court={currentCourt}
                      canSwipeNext={hasNext}
                      canSwipePrevious={hasPrevious}
                      dismissing={isDismissing}
                      onSwipeNext={() => {
                        setIsCardExiting(false);
                        onNext();
                      }}
                      onSwipePrevious={() => {
                        setIsCardExiting(false);
                        onPrevious();
                      }}
                      onExitComplete={() => {
                        setIsCardExiting(false);
                        setIsDismissing(false);
                        onSkip();
                      }}
                      onExitStart={() => setIsCardExiting(true)}
                    />
                  </div>
                </div>

                <ArrowButton direction="right" disabled={!hasNext || isCardExiting} onClick={onNext} />
              </div>
            ) : (
              <div className="mx-auto flex max-w-xl flex-col items-center rounded-[2rem] border border-orange-100 bg-white px-6 py-10 text-center shadow-[0_24px_80px_-36px_rgba(24,24,27,0.2)]">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-orange-50 text-orange-500">
                  <svg
                    className="h-7 w-7"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.8}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="m15 5-6 7 6 7"
                    />
                  </svg>
                </div>
                <h2 className="mt-5 text-2xl font-semibold tracking-tight text-zinc-950">
                  {activeView === "events" ? "No more game suggestions" : "No more court picks"}
                </h2>
                <p className="mt-2 max-w-md text-sm leading-6 text-zinc-500">
                  {hasActiveAreaSearch
                    ? "Reset this deck to bring the current suggestions back, or switch to the map to adjust the area and filters."
                    : "Switch to map view, search an area, and your swipe deck will populate from those explore results."}
                </p>
                <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={onResetSuggestions}
                    className="rounded-full border border-zinc-200 bg-white px-5 py-3 text-sm font-semibold text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-50"
                  >
                    Reset Suggestions
                  </button>
                  <button
                    type="button"
                    onClick={onOpenMapView}
                    className="rounded-full bg-zinc-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800"
                  >
                    Map View
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="pointer-events-none absolute bottom-24 right-5 z-20 sm:bottom-28 sm:right-6">
        <button
          type="button"
          onClick={onOpenMapView}
          className="pointer-events-auto inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-4 py-3 text-sm font-semibold text-zinc-900 shadow-lg transition hover:bg-zinc-50"
        >
          <svg
            className="h-4 w-4 text-zinc-500"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.8}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 6.75 15 4.5l6 2.25m-12 0L3 4.5v12.75L9 19.5m0-12.75v12.75m6-15v12.75m0-12.75 6 2.25V19.5l-6-2.25m0 0-6 2.25"
            />
          </svg>
          Map View
        </button>
      </div>

      {hasSuggestion ? (
        <div className="border-t border-orange-100 bg-white/90 px-4 py-4 backdrop-blur sm:px-6">
          <div className="mx-auto flex max-w-3xl items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => setIsDismissing(true)}
              disabled={primaryActionLoading || isDismissing || isCardExiting}
              className="inline-flex min-w-[8.5rem] items-center justify-center gap-2 rounded-full border border-zinc-200 bg-white px-5 py-3 text-sm font-semibold text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <svg
                className="h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
              Skip
            </button>
            <button
              type="button"
              onClick={onPrimaryAction}
              disabled={primaryActionDisabled || isCardExiting}
              className="inline-flex min-w-[11rem] items-center justify-center gap-2 rounded-full bg-orange-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-orange-300"
            >
              {primaryActionLoading ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : (
                <svg
                  className="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d={
                      activeView === "events"
                        ? "m9 12 2 2 4-4m6-1a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                        : "m9 6 6 6-6 6"
                    }
                  />
                </svg>
              )}
              {primaryActionLabel}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
