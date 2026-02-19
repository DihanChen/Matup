"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import type { DisplayCourt } from "@/features/courts/types";

type CourtCardProps = {
  court: DisplayCourt;
  compact?: boolean;
  onSelect?: (id: string) => void;
  isSelected?: boolean;
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

function formatDistance(km: number): string {
  if (km < 1) {
    return `${Math.round(km * 1000)}m`;
  }
  return `${km.toFixed(1)} MILES`;
}

export default function CourtCard({ court, compact = false, onSelect, isSelected = false }: CourtCardProps) {
  const [erroredCoverKey, setErroredCoverKey] = useState<string | null>(null);

  const fallbackSport = court.sport_types[0] || "gym";
  const fallbackCover = COVER_FALLBACKS[fallbackSport] || "/covers/gym.jpg";
  const customCover = typeof court.image_url === "string" ? court.image_url.trim() : "";
  const hasCustomCover = customCover.length > 0;
  const coverKey = hasCustomCover ? customCover : fallbackCover;
  const coverSrc = !hasCustomCover || erroredCoverKey === coverKey ? fallbackCover : customCover;

  return (
    <Link
      href={`/courts/${court.id}`}
      onClick={() => onSelect?.(court.id)}
      className={`group block bg-white rounded-xl border border-zinc-200 hover:shadow-lg transition-all overflow-hidden ${isSelected ? "ring-2 ring-orange-500" : ""}`}
    >
      <div className={`relative ${compact ? "h-24" : "h-40"} bg-zinc-100 overflow-hidden`}>
        <Image
          src={coverSrc}
          alt={court.name}
          fill
          sizes={compact ? "(max-width: 768px) 100vw, 25vw" : "(max-width: 768px) 100vw, 33vw"}
          quality={compact ? 60 : 75}
          className="object-cover"
          onError={() => setErroredCoverKey(coverKey)}
        />

        <div className={`absolute ${compact ? "top-2 left-2" : "top-3 left-3"} flex items-center gap-1.5 flex-wrap pr-2`}>
          {court.sport_types.map((sport) => (
            <span
              key={`${court.id}-${sport}`}
              className={`${compact ? "px-1.5 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs"} bg-orange-500 text-white font-medium rounded-full capitalize`}
            >
              {sport}
            </span>
          ))}
        </div>
      </div>

      <div className={compact ? "p-2.5" : "p-4"}>
        <div className={`flex items-center justify-between ${compact ? "text-[10px]" : "text-xs"} text-zinc-500 mb-0.5`}>
          <span className="truncate">{court.address.split(",")[0]}</span>
          {court.distance !== undefined && (
            <span className="text-zinc-400 font-medium shrink-0 ml-2 text-[10px] tracking-wide">
              {formatDistance(court.distance)}
            </span>
          )}
        </div>

        <h3 className={`font-semibold text-zinc-900 ${compact ? "text-xs mb-1" : "text-sm mb-2"} line-clamp-1 group-hover:text-orange-500 transition-colors`}>
          {court.name}
        </h3>

        <div className="flex items-center justify-between gap-3">
          {court.source === "osm" ? (
            <span className={`${compact ? "text-[9px]" : "text-[11px]"} text-zinc-400`}>
              via OpenStreetMap
            </span>
          ) : (
            <span className={`${compact ? "text-[9px]" : "text-[11px]"} text-transparent`}>.</span>
          )}
          {court.review_count > 0 ? (
            <span className={`${compact ? "text-[10px]" : "text-xs"} inline-flex items-center gap-1 text-zinc-600`}>
              <svg viewBox="0 0 24 24" className={compact ? "h-3 w-3" : "h-3.5 w-3.5"} fill="currentColor">
                <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
              </svg>
              {court.average_rating.toFixed(1)}
            </span>
          ) : null}
        </div>
      </div>
    </Link>
  );
}
