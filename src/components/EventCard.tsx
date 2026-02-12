"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";

type EventCardEvent = {
  id: string;
  title: string;
  sport_type: string;
  location: string;
  datetime: string;
  max_participants: number;
  skill_level?: string;
  creator_id?: string;
  participant_count?: number;
  cover_url?: string | null;
  distance?: number;
  creator_name?: string;
  participants?: { user_id: string; name: string | null; avatar_url: string | null }[];
};

interface EventCardProps {
  event: EventCardEvent;
  variant?: "default" | "hosting" | "past";
  onJoin?: (eventId: string) => void;
  showHostBadge?: boolean;
  currentUserId?: string | null;
  compact?: boolean;
}

const COVER_FALLBACKS: Record<string, string> = {
  soccer: "/covers/soccer.jpg",
  tennis: "/covers/tennis.jpg",
  pickleball: "/covers/tennis.jpg",
  basketball: "/covers/basketball.jpg",
  running: "/covers/running.jpg",
  cycling: "/covers/cycling.jpg",
  gym: "/covers/gym.jpg",
  yoga: "/covers/yoga.jpg",
  hiking: "/covers/hiking.jpg",
};

function formatDistance(km: number): string {
  if (km < 1) {
    return `${Math.round(km * 1000)}m`;
  }
  return `${km.toFixed(1)} MILES`;
}

export default function EventCard({ event, variant = "default", onJoin, showHostBadge, currentUserId, compact = false }: EventCardProps) {
  const [erroredCoverKey, setErroredCoverKey] = useState<string | null>(null);
  const fallbackCover = COVER_FALLBACKS[event.sport_type] || "/covers/gym.jpg";
  const customCover = typeof event.cover_url === "string" ? event.cover_url.trim() : "";
  const hasCustomCover = customCover.length > 0;
  const coverKey = hasCustomCover ? customCover : fallbackCover;
  const coverSrc = !hasCustomCover || erroredCoverKey === coverKey ? fallbackCover : customCover;

  const date = new Date(event.datetime);
  const formattedDate = date.toLocaleDateString("en-US", {
    weekday: compact ? "short" : "long",
    month: "short",
    day: "numeric",
  });
  const formattedTime = date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });

  const participantCount = event.participant_count ?? event.participants?.length ?? 0;
  const spotsLeft = event.max_participants - participantCount;
  const isFull = spotsLeft <= 0;
  const isPast = variant === "past";
  const isHosting = variant === "hosting";
  const isOwner = !!(currentUserId && event.creator_id && currentUserId === event.creator_id);

  const getInitials = (name: string | null) => {
    if (!name) return "?";
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  };

  return (
    <div className={`group bg-white rounded-xl border border-zinc-200 hover:shadow-lg transition-all overflow-hidden ${isPast ? "opacity-60" : ""}`}>
      {/* Cover Photo */}
      <div className={`relative ${compact ? "h-24" : "h-40"} bg-zinc-100 overflow-hidden`}>
        <Image
          src={coverSrc}
          alt={event.title}
          fill
          sizes={compact ? "(max-width: 768px) 100vw, 25vw" : "(max-width: 768px) 100vw, 33vw"}
          quality={compact ? 60 : 75}
          className="object-cover"
          onError={() => setErroredCoverKey(coverKey)}
        />

        {/* Top badges */}
        <div className={`absolute ${compact ? "top-2 left-2" : "top-3 left-3"} flex items-center gap-1.5`}>
          {event.skill_level && event.skill_level !== "all" && (
            <span className={`${compact ? "px-1.5 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs"} bg-white/90 backdrop-blur text-zinc-700 font-medium rounded-full capitalize border border-zinc-200`}>
              {event.skill_level}
            </span>
          )}
          <span className={`${compact ? "px-1.5 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs"} bg-orange-500 text-white font-medium rounded-full capitalize`}>
            {event.sport_type}
          </span>
        </div>

        {/* Top right: participant count */}
        <div className={`absolute ${compact ? "top-2 right-2" : "top-3 right-3"}`}>
          <span className={`${compact ? "px-1.5 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs"} bg-white/90 backdrop-blur text-zinc-700 font-medium rounded-full flex items-center gap-1`}>
            <svg className={compact ? "w-2.5 h-2.5" : "w-3.5 h-3.5"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
            </svg>
            {participantCount}/{event.max_participants}
          </span>
        </div>

        {/* Past badge */}
        {isPast && (
          <div className={`absolute ${compact ? "bottom-2 left-2" : "bottom-3 left-3"}`}>
            <span className={`${compact ? "px-1.5 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs"} bg-zinc-900/80 text-white font-medium rounded-full`}>
              Completed
            </span>
          </div>
        )}

        {/* Host badge */}
        {showHostBadge && (
          <div className={`absolute ${compact ? "bottom-2 right-2" : "bottom-3 right-3"}`}>
            <span className={`${compact ? "px-1.5 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs"} bg-blue-500 text-white font-medium rounded-full`}>
              Host
            </span>
          </div>
        )}
      </div>

      {/* Card Body */}
      <div className={compact ? "p-2.5" : "p-4"}>
        {/* Location + Distance */}
        <div className={`flex items-center justify-between ${compact ? "text-[10px]" : "text-xs"} text-zinc-500 mb-0.5`}>
          <span className="truncate">{event.location.split(",")[0]}</span>
          {event.distance !== undefined && (
            <span className="text-zinc-400 font-medium shrink-0 ml-2 text-[10px] tracking-wide">
              {formatDistance(event.distance)}
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className={`font-semibold text-zinc-900 ${compact ? "text-xs mb-1" : "text-sm mb-2"} line-clamp-1 group-hover:text-orange-500 transition-colors`}>
          {event.title}
        </h3>

        {/* Date/Time */}
        <div className={`flex items-center gap-1 ${compact ? "text-[10px] mb-2" : "text-xs mb-3"} text-zinc-500`}>
          <svg className={compact ? "w-3 h-3" : "w-3.5 h-3.5"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
          </svg>
          <span>{formattedDate} &bull; {formattedTime}</span>
        </div>

        {/* Bottom row: avatars + action button */}
        <div className="flex items-center justify-between">
          {/* Participant avatars */}
          {!compact && (
            <div className="flex -space-x-2">
              {(event.participants || []).slice(0, 3).map((p, i) => (
                <div key={i} className="w-7 h-7 rounded-full border-2 border-white overflow-hidden">
                  {p.avatar_url ? (
                    <Image src={p.avatar_url} alt={p.name || ""} width={28} height={28} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-zinc-300 text-white text-[10px] font-medium flex items-center justify-center">
                      {getInitials(p.name)}
                    </div>
                  )}
                </div>
              ))}
              {participantCount > 3 && (
                <div className="w-7 h-7 rounded-full border-2 border-white bg-orange-500 text-white text-[10px] font-medium flex items-center justify-center">
                  +{participantCount - 3}
                </div>
              )}
            </div>
          )}

          {/* Action button */}
          {isHosting ? (
            <Link
              href={`/events/${event.id}/edit`}
              className={`${compact ? "px-3 py-1 text-[10px]" : "px-4 py-1.5 text-xs"} bg-zinc-900 text-white font-medium rounded-full hover:bg-zinc-800 transition-colors`}
            >
              Manage
            </Link>
          ) : isPast ? (
            <span className={`${compact ? "px-3 py-1 text-[10px]" : "px-4 py-1.5 text-xs"} bg-zinc-100 text-zinc-500 font-medium rounded-full`}>
              Completed
            </span>
          ) : isOwner ? (
            <Link
              href={`/events/${event.id}`}
              className={`${compact ? "px-3 py-1 text-[10px]" : "px-4 py-1.5 text-xs"} bg-zinc-100 text-zinc-700 font-medium rounded-full hover:bg-zinc-200 transition-colors`}
            >
              View
            </Link>
          ) : isFull ? (
            <span className={`${compact ? "px-3 py-1 text-[10px]" : "px-4 py-1.5 text-xs"} bg-zinc-100 text-zinc-500 font-medium rounded-full`}>
              Full
            </span>
          ) : onJoin ? (
            <button
              onClick={(e) => {
                e.preventDefault();
                onJoin(event.id);
              }}
              className={`${compact ? "px-3 py-1 text-[10px]" : "px-4 py-1.5 text-xs"} bg-zinc-900 text-white font-medium rounded-full hover:bg-zinc-800 transition-colors`}
            >
              Join
            </button>
          ) : (
            <Link
              href={`/events/${event.id}`}
              className={`${compact ? "px-3 py-1 text-[10px]" : "px-4 py-1.5 text-xs"} bg-zinc-900 text-white font-medium rounded-full hover:bg-zinc-800 transition-colors`}
            >
              Join
            </Link>
          )}

          {/* View Details — compact shows inline next to Join */}
          {compact && (
            <Link
              href={`/events/${event.id}`}
              className="text-[10px] text-zinc-400 hover:text-orange-500 font-medium transition-colors"
            >
              Details
            </Link>
          )}
        </div>

        {/* View Details link — full size only */}
        {!compact && (
          <Link
            href={`/events/${event.id}`}
            className="block text-center text-xs text-zinc-400 hover:text-orange-500 mt-3 font-medium transition-colors"
          >
            View Details
          </Link>
        )}
      </div>
    </div>
  );
}
