"use client";

import { useState } from "react";

type Announcement = {
  id: string;
  title: string;
  body: string;
  created_at: string;
  author_name: string;
};

type Props = {
  announcements: Announcement[];
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function isRecent(dateStr: string): boolean {
  const diff = Date.now() - new Date(dateStr).getTime();
  return diff < 24 * 60 * 60 * 1000;
}

export default function AnnouncementsCard({ announcements }: Props) {
  const [expanded, setExpanded] = useState(false);

  if (announcements.length === 0) return null;

  const recentCount = announcements.filter((a) => isRecent(a.created_at)).length;
  const displayed = expanded ? announcements : announcements.slice(0, 3);

  return (
    <div className="bg-white rounded-2xl border border-zinc-200 p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50">
            <svg className="h-4 w-4 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 2a6 6 0 0 0-6 6c0 1.887-.454 3.665-1.257 5.234a.75.75 0 0 0 .515 1.076 32.91 32.91 0 0 0 3.256.508 3.5 3.5 0 0 0 6.972 0 32.903 32.903 0 0 0 3.256-.508.75.75 0 0 0 .515-1.076A11.448 11.448 0 0 1 16 8a6 6 0 0 0-6-6ZM8.05 14.943a33.54 33.54 0 0 0 3.9 0 2 2 0 0 1-3.9 0Z" clipRule="evenodd" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-zinc-900">Announcements</h2>
          {recentCount > 0 && (
            <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-500 px-1.5 text-[10px] font-bold text-white">
              {recentCount}
            </span>
          )}
        </div>
        {announcements.length > 3 && (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="text-xs font-medium text-zinc-400 hover:text-zinc-600 transition-colors"
          >
            {expanded ? "Show less" : `View all (${announcements.length})`}
          </button>
        )}
      </div>

      <div className="space-y-3">
        {displayed.map((a, index) => {
          const recent = isRecent(a.created_at);
          const isFirst = index === 0;

          return (
            <div
              key={a.id}
              className={`rounded-xl p-3 transition-colors ${
                isFirst && recent
                  ? "border-2 border-blue-200 bg-blue-50/50"
                  : "border border-zinc-100 bg-zinc-50"
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-1">
                <div className="flex items-center gap-2 min-w-0">
                  {recent && (
                    <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                  )}
                  <span className="text-sm font-semibold text-zinc-900 truncate">
                    {a.title}
                  </span>
                </div>
                <span className="text-[11px] text-zinc-400 shrink-0">
                  {timeAgo(a.created_at)}
                </span>
              </div>
              <p className="text-sm text-zinc-600 whitespace-pre-line line-clamp-3">
                {a.body}
              </p>
              <p className="text-[11px] text-zinc-400 mt-1.5">{a.author_name}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
