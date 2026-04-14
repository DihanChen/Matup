"use client";

import type { ReactNode } from "react";

export interface ErrorStateProps {
  /** Short heading — e.g. "Couldn't load events". Keep it specific to the surface. */
  title?: string;
  /** One sentence explaining what to try. Falls back to a generic message. */
  description?: string;
  /** Retry handler. If omitted, the retry button is hidden. */
  onRetry?: () => void;
  /** Label for the retry button. Defaults to "Try again". */
  retryLabel?: string;
  /** Optional secondary action (e.g. a link to a different view). */
  action?: ReactNode;
  /** Compact variant — use inside cards and smaller containers. */
  compact?: boolean;
  className?: string;
}

/**
 * Standard error state for data-loading failures.
 *
 * Pairs with loading skeletons: when a fetch fails, render this with an
 * `onRetry` that re-fires the query. Copy should be warm and specific —
 * see docs/DESIGN_SYSTEM.md "Voice & copy".
 */
export function ErrorState({
  title = "Something went wrong",
  description = "We couldn't load this right now. Check your connection and try again.",
  onRetry,
  retryLabel = "Try again",
  action,
  compact = false,
  className = "",
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={`flex flex-col items-center justify-center text-center ${
        compact ? "py-8 px-4 gap-2" : "py-16 px-6 gap-3"
      } ${className}`}
    >
      <div
        aria-hidden
        className={`rounded-full bg-orange-50 text-orange-600 flex items-center justify-center ${
          compact ? "h-10 w-10" : "h-14 w-14"
        }`}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={compact ? "h-5 w-5" : "h-7 w-7"}
        >
          <path d="M12 9v4" />
          <path d="M12 17h.01" />
          <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
        </svg>
      </div>
      <h3 className={`font-semibold text-zinc-900 ${compact ? "text-sm" : "text-base"}`}>
        {title}
      </h3>
      <p
        className={`text-zinc-500 max-w-sm ${
          compact ? "text-xs" : "text-sm"
        }`}
      >
        {description}
      </p>
      {(onRetry || action) && (
        <div className="flex items-center gap-2 mt-2">
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="inline-flex items-center gap-1.5 rounded-full bg-orange-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-3.5 w-3.5"
                aria-hidden
              >
                <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                <path d="M21 3v5h-5" />
                <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
                <path d="M3 21v-5h5" />
              </svg>
              {retryLabel}
            </button>
          )}
          {action}
        </div>
      )}
    </div>
  );
}

export default ErrorState;
