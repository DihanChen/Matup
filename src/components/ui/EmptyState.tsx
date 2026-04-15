"use client";

import type { ReactNode } from "react";

export interface EmptyStateProps {
  /** Short heading — what's empty. "No events yet" / "No friends added". */
  title: string;
  /** Action-oriented sentence: what the user can do next. */
  description?: string;
  /** Custom icon node. Defaults to a neutral placeholder icon. */
  icon?: ReactNode;
  /** Primary CTA — usually the action that fills the empty state. */
  action?: ReactNode;
  /** Secondary action or helper link. */
  secondaryAction?: ReactNode;
  /** Compact variant — use inside cards or narrow columns. */
  compact?: boolean;
  className?: string;
}

/**
 * Standard empty state. Copy should invite action rather than announce absence
 * ("Find a league near you" > "No leagues found"). See docs/DESIGN_SYSTEM.md.
 */
export function EmptyState({
  title,
  description,
  icon,
  action,
  secondaryAction,
  compact = false,
  className = "",
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center ${
        compact ? "py-8 px-4 gap-2" : "py-16 px-6 gap-3"
      } ${className}`}
    >
      <div
        aria-hidden
        className={`rounded-full bg-zinc-100 text-zinc-400 flex items-center justify-center ${
          compact ? "h-10 w-10" : "h-14 w-14"
        }`}
      >
        {icon ?? (
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={compact ? "h-5 w-5" : "h-7 w-7"}
          >
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <path d="M16 2v4" />
            <path d="M8 2v4" />
            <path d="M3 10h18" />
          </svg>
        )}
      </div>
      <h3 className={`font-semibold text-zinc-900 ${compact ? "text-sm" : "text-base"}`}>
        {title}
      </h3>
      {description && (
        <p className={`text-zinc-500 max-w-sm ${compact ? "text-xs" : "text-sm"}`}>
          {description}
        </p>
      )}
      {(action || secondaryAction) && (
        <div className="flex flex-col sm:flex-row items-center gap-2 mt-2">
          {action}
          {secondaryAction}
        </div>
      )}
    </div>
  );
}

export default EmptyState;
