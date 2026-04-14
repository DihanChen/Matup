"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type PointerEvent, type TransitionEvent } from "react";
import type { DisplayCourt } from "@/features/courts/types";
import type { ExploreEvent, SwipeTab } from "@/features/events/lib/exploreSwipe";

type Props = {
  activeView: SwipeTab;
  event: ExploreEvent | null;
  court: DisplayCourt | null;
  canSwipeNext: boolean;
  canSwipePrevious: boolean;
  dismissing: boolean;
  onSwipeNext: () => void;
  onSwipePrevious: () => void;
  onExitComplete: () => void;
  onExitStart?: () => void;
};

type DragAxis = "x" | "y" | null;

type PointerDragState = {
  pointerId: number;
  startX: number;
  startY: number;
  axis: DragAxis;
};

const COVER_FALLBACKS: Record<string, string> = {
  soccer: "/covers/soccer.jpg",
  tennis: "/covers/tennis.jpg",
  pickleball: "/covers/pickleball.jpg",
  basketball: "/covers/basketball.jpg",
  running: "/covers/running.jpg",
  cycling: "/covers/cycling.jpg",
  gym: "/covers/gym.jpg",
  yoga: "/covers/yoga.jpg",
  hiking: "/covers/hiking.jpg",
};

function formatDistance(distance: number): string {
  if (distance < 1) {
    return `${Math.round(distance * 1000)} m away`;
  }

  return `${distance.toFixed(1)} km away`;
}

function getInitials(name: string | null | undefined): string {
  if (!name) return "?";

  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function getEventCover(event: ExploreEvent): string {
  const fallback = COVER_FALLBACKS[event.sport_type] || "/covers/gym.jpg";
  const customCover = typeof event.cover_url === "string" ? event.cover_url.trim() : "";

  return customCover.length > 0 ? customCover : fallback;
}

function getCourtCover(court: DisplayCourt): string {
  const fallbackSport = court.sport_types[0] || "gym";
  const fallback = COVER_FALLBACKS[fallbackSport] || "/covers/gym.jpg";
  const customCover = typeof court.image_url === "string" ? court.image_url.trim() : "";

  return customCover.length > 0 ? customCover : fallback;
}

export default function ExploreSwipeCard({
  activeView,
  event,
  court,
  canSwipeNext,
  canSwipePrevious,
  dismissing,
  onSwipeNext,
  onSwipePrevious,
  onExitComplete,
  onExitStart,
}: Props) {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const dragStateRef = useRef<PointerDragState | null>(null);
  const dragXRef = useRef(0);
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [imageErrorKey, setImageErrorKey] = useState<string | null>(null);
  const [exitDirection, setExitDirection] = useState<"left" | "right" | null>(null);
  const [isEntering, setIsEntering] = useState(true);
  const pendingSwipeRef = useRef<"next" | "previous" | "dismiss" | null>(null);
  const exitCallbackFiredRef = useRef(false);
  const exitTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const callbacksRef = useRef({ onSwipeNext, onSwipePrevious, onExitComplete, onExitStart });
  callbacksRef.current = { onSwipeNext, onSwipePrevious, onExitComplete, onExitStart };

  const currentEvent = activeView === "events" ? event : null;
  const currentCourt = activeView === "courts" ? court : null;
  const imageSrc = currentEvent
    ? getEventCover(currentEvent)
    : currentCourt
    ? getCourtCover(currentCourt)
    : "/covers/gym.jpg";
  const fallbackSrc = currentEvent
    ? COVER_FALLBACKS[currentEvent.sport_type] || "/covers/gym.jpg"
    : currentCourt
    ? COVER_FALLBACKS[currentCourt.sport_types[0] || "gym"] || "/covers/gym.jpg"
    : "/covers/gym.jpg";
  const resolvedImageSrc = imageErrorKey === imageSrc ? fallbackSrc : imageSrc;

  // Entrance animation on mount
  useEffect(() => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setIsEntering(false);
      });
    });
  }, []);

  // Handle dismissing prop from parent (skip button)
  useEffect(() => {
    if (dismissing && !exitDirection) {
      startExit("left", "dismiss");
    }
  }, [dismissing]); // eslint-disable-line react-hooks/exhaustive-deps

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (exitTimeoutRef.current) clearTimeout(exitTimeoutRef.current);
    };
  }, []);

  function startExit(direction: "left" | "right", swipeType: "next" | "previous" | "dismiss") {
    pendingSwipeRef.current = swipeType;
    exitCallbackFiredRef.current = false;
    setExitDirection(direction);
    setIsDragging(false);
    callbacksRef.current.onExitStart?.();

    if (exitTimeoutRef.current) clearTimeout(exitTimeoutRef.current);
    exitTimeoutRef.current = setTimeout(fireExitCallback, 400);
  }

  function fireExitCallback() {
    if (exitCallbackFiredRef.current) return;
    exitCallbackFiredRef.current = true;

    if (exitTimeoutRef.current) {
      clearTimeout(exitTimeoutRef.current);
      exitTimeoutRef.current = null;
    }

    const swipeType = pendingSwipeRef.current;
    pendingSwipeRef.current = null;

    setExitDirection(null);
    resetDragState();
    setIsEntering(true);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setIsEntering(false);
      });
    });

    if (swipeType === "next") {
      callbacksRef.current.onSwipeNext();
    } else if (swipeType === "previous") {
      callbacksRef.current.onSwipePrevious();
    } else if (swipeType === "dismiss") {
      callbacksRef.current.onExitComplete();
    }
  }

  function resetDragState() {
    dragStateRef.current = null;
    dragXRef.current = 0;
    setIsDragging(false);
    setDragX(0);
  }

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    if (exitDirection) return;
    if (event.pointerType === "mouse" && event.button !== 0) {
      return;
    }

    dragStateRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      axis: null,
    };

    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    const dragState = dragStateRef.current;
    if (!dragState || dragState.pointerId !== event.pointerId) {
      return;
    }

    const deltaX = event.clientX - dragState.startX;
    const deltaY = event.clientY - dragState.startY;

    if (!dragState.axis) {
      if (Math.abs(deltaX) < 8 && Math.abs(deltaY) < 8) {
        return;
      }

      dragState.axis = Math.abs(deltaX) > Math.abs(deltaY) ? "x" : "y";
    }

    if (dragState.axis !== "x") {
      return;
    }

    event.preventDefault();
    setIsDragging(true);
    dragXRef.current = deltaX;
    setDragX(deltaX);
  }

  function handlePointerEnd(event: PointerEvent<HTMLDivElement>) {
    const dragState = dragStateRef.current;
    if (!dragState || dragState.pointerId !== event.pointerId) {
      return;
    }

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    const width = cardRef.current?.offsetWidth ?? 0;
    const threshold = Math.max(96, width * 0.25);

    if (dragState.axis === "x") {
      if (dragXRef.current <= -threshold && canSwipeNext) {
        startExit("left", "next");
        return;
      }

      if (dragXRef.current >= threshold && canSwipePrevious) {
        startExit("right", "previous");
        return;
      }
    }

    resetDragState();
  }

  function handleTransitionEnd(e: TransitionEvent<HTMLDivElement>) {
    if (exitDirection && e.target === e.currentTarget) {
      fireExitCallback();
    }
  }

  // Compute card styles
  let cardStyle: React.CSSProperties;

  if (exitDirection === "left") {
    cardStyle = {
      transform: "translate3d(-150%, 0, 0) rotate(-25deg)",
      transition: "transform 350ms cubic-bezier(0.2, 0.8, 0.2, 1)",
    };
  } else if (exitDirection === "right") {
    cardStyle = {
      transform: "translate3d(150%, 0, 0) rotate(25deg)",
      transition: "transform 350ms cubic-bezier(0.2, 0.8, 0.2, 1)",
    };
  } else if (isDragging) {
    cardStyle = {
      transform: `translate3d(${dragX}px, 0, 0) rotate(${dragX / 40}deg)`,
      transition: "none",
    };
  } else if (isEntering) {
    cardStyle = {
      transform: "translate3d(0, 8px, 0) scale(0.97)",
      opacity: 0.8,
      transition: "none",
    };
  } else {
    cardStyle = {
      transform: "translate3d(0, 0, 0) rotate(0deg) scale(1)",
      opacity: 1,
      transition: "transform 400ms cubic-bezier(0.34, 1.56, 0.64, 1), opacity 300ms ease-out",
    };
  }

  // Drag direction overlay opacity
  const cardWidth = cardRef.current?.offsetWidth ?? 384;
  const overlayThreshold = Math.max(96, cardWidth * 0.25);
  const leftOverlayOpacity = isDragging
    ? Math.min(0.85, Math.abs(Math.min(0, dragX)) / overlayThreshold)
    : 0;
  const rightOverlayOpacity = isDragging
    ? Math.min(0.85, Math.max(0, dragX) / overlayThreshold)
    : 0;

  if (!currentEvent && !currentCourt) {
    return null;
  }

  return (
    <div
      ref={cardRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerEnd}
      onPointerCancel={handlePointerEnd}
      onTransitionEnd={handleTransitionEnd}
      className="relative w-full max-w-[24rem] select-none [touch-action:pan-y]"
      style={cardStyle}
    >
      <div className="overflow-hidden rounded-[2rem] border border-orange-100 bg-white shadow-[0_24px_80px_-36px_rgba(24,24,27,0.28)]">
        <div className="p-4 sm:p-5">
          <div className="relative aspect-[4/3] overflow-hidden rounded-[1.5rem] bg-zinc-100">
            <Image
              src={resolvedImageSrc}
              alt={currentEvent?.title || currentCourt?.name || "Explore suggestion"}
              fill
              sizes="(max-width: 768px) 100vw, 24rem"
              className="object-cover"
              onError={() => setImageErrorKey(imageSrc)}
            />

            {currentEvent ? (
              <>
                <div className="absolute left-3 top-3">
                  <span className="rounded-full bg-lime-200 px-3 py-1 text-xs font-semibold capitalize text-zinc-900">
                    {currentEvent.sport_type}
                  </span>
                </div>
                <div className="absolute right-3 top-3">
                  <span className="inline-flex items-center gap-1 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-zinc-700 backdrop-blur">
                    <svg
                      className="h-3.5 w-3.5 text-zinc-500"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={1.8}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z"
                      />
                    </svg>
                    {currentEvent.participant_count}/{currentEvent.max_participants}
                  </span>
                </div>
              </>
            ) : currentCourt ? (
              <>
                <div className="absolute left-3 top-3 flex max-w-[70%] flex-wrap gap-2">
                  {currentCourt.sport_types.slice(0, 2).map((sport) => (
                    <span
                      key={`${currentCourt.id}-${sport}`}
                      className="rounded-full bg-lime-200 px-3 py-1 text-xs font-semibold capitalize text-zinc-900"
                    >
                      {sport}
                    </span>
                  ))}
                </div>
                <div className="absolute right-3 top-3">
                  <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-zinc-700 backdrop-blur">
                    {currentCourt.source === "db" ? "Verified court" : "OSM pick"}
                  </span>
                </div>
              </>
            ) : null}

            {/* Drag direction overlay — left drag (next card) */}
            <div
              className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-[1.5rem] bg-orange-500/30 backdrop-blur-[2px]"
              style={{ opacity: leftOverlayOpacity, transition: "opacity 100ms ease-out" }}
            >
              <div className="flex flex-col items-center gap-1.5 text-white drop-shadow-sm">
                <svg
                  className="h-8 w-8"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="m9 5 7 7-7 7" />
                </svg>
                <span className="text-sm font-semibold">Next</span>
              </div>
            </div>

            {/* Drag direction overlay — right drag (previous card) */}
            <div
              className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-[1.5rem] bg-zinc-600/30 backdrop-blur-[2px]"
              style={{ opacity: rightOverlayOpacity, transition: "opacity 100ms ease-out" }}
            >
              <div className="flex flex-col items-center gap-1.5 text-white drop-shadow-sm">
                <svg
                  className="h-8 w-8"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="m15 19-7-7 7-7" />
                </svg>
                <span className="text-sm font-semibold">Previous</span>
              </div>
            </div>
          </div>

          {currentEvent ? (
            <div className="flex-shrink-0 space-y-5 px-1 pb-1 pt-5">
              <div className="space-y-3">
                <h2 className="text-[1.85rem] font-semibold leading-tight tracking-tight text-zinc-950">
                  {currentEvent.title}
                </h2>
                <div className="flex items-center gap-2 text-sm text-zinc-600">
                  <svg
                    className="h-4 w-4 shrink-0 text-zinc-400"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.8}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5"
                    />
                  </svg>
                  <span>
                    {new Date(currentEvent.datetime).toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    })}{" "}
                    ·{" "}
                    {new Date(currentEvent.datetime).toLocaleTimeString("en-US", {
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3 text-sm text-zinc-600">
                  <div className="flex min-w-0 items-center gap-2">
                    <svg
                      className="h-4 w-4 shrink-0 text-zinc-400"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={1.8}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 10.5a2.25 2.25 0 1 0 0-4.5 2.25 2.25 0 0 0 0 4.5Z"
                      />
                    </svg>
                    <span className="truncate">{currentEvent.location}</span>
                  </div>
                  {currentEvent.distance !== undefined ? (
                    <span className="shrink-0 text-xs font-semibold uppercase tracking-[0.16em] text-zinc-400">
                      {formatDistance(currentEvent.distance)}
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 rounded-[1.25rem] border border-zinc-200 bg-zinc-50 px-4 py-3.5">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-200 text-sm font-semibold text-zinc-700">
                    {getInitials(currentEvent.creator_name)}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-zinc-900">
                      Hosted by {currentEvent.creator_name || "Anonymous"}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {Math.max(
                        0,
                        currentEvent.max_participants - currentEvent.participant_count
                      )}{" "}
                      spots left
                    </p>
                  </div>
                </div>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-orange-600 ring-1 ring-orange-200">
                  {currentEvent.skill_level || "all levels"}
                </span>
              </div>
            </div>
          ) : currentCourt ? (
            <div className="flex-shrink-0 space-y-5 px-1 pb-1 pt-5">
              <div className="space-y-3">
                <h2 className="text-[1.85rem] font-semibold leading-tight tracking-tight text-zinc-950">
                  {currentCourt.name}
                </h2>
                <div className="flex items-center justify-between gap-3 text-sm text-zinc-600">
                  <div className="flex min-w-0 items-center gap-2">
                    <svg
                      className="h-4 w-4 shrink-0 text-zinc-400"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={1.8}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 10.5a2.25 2.25 0 1 0 0-4.5 2.25 2.25 0 0 0 0 4.5Z"
                      />
                    </svg>
                    <span className="truncate">{currentCourt.address}</span>
                  </div>
                  {currentCourt.distance !== undefined ? (
                    <span className="shrink-0 text-xs font-semibold uppercase tracking-[0.16em] text-zinc-400">
                      {formatDistance(currentCourt.distance)}
                    </span>
                  ) : null}
                </div>
                <div className="flex flex-wrap gap-2">
                  {currentCourt.surface ? (
                    <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-600">
                      {currentCourt.surface}
                    </span>
                  ) : null}
                  {currentCourt.lighting ? (
                    <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-600">
                      Lit at night
                    </span>
                  ) : null}
                  <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-600">
                    {currentCourt.sport_types.length} sport
                    {currentCourt.sport_types.length === 1 ? "" : "s"}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 rounded-[1.25rem] border border-zinc-200 bg-zinc-50 px-4 py-3.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-zinc-900">
                    {currentCourt.source === "db"
                      ? "Verified community court"
                      : "Suggested from OpenStreetMap"}
                  </p>
                  <p className="text-xs text-zinc-500">
                    {currentCourt.review_count > 0
                      ? `${currentCourt.review_count} review${
                          currentCourt.review_count === 1 ? "" : "s"
                        }`
                      : "Fresh listing"}
                  </p>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-semibold text-orange-600 ring-1 ring-orange-200">
                  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                  </svg>
                  {currentCourt.review_count > 0 ? currentCourt.average_rating.toFixed(1) : "New"}
                </span>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
