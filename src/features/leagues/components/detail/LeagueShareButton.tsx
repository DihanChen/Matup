"use client";

import { useEffect, useId, useRef, useState } from "react";

type Props = {
  inviteCode: string;
  onCopyInviteLink: () => void;
  onInviteByEmail: () => void;
  className?: string;
};

export default function LeagueShareButton({
  inviteCode,
  onCopyInviteLink,
  onInviteByEmail,
  className = "",
}: Props) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        aria-label="Share league"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((prev) => !prev)}
        className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-orange-500 text-white shadow-[0_18px_30px_rgba(249,115,22,0.35)] transition-colors hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:ring-offset-2 focus:ring-offset-transparent"
      >
        <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path d="M15 3.5a2.5 2.5 0 1 0-2.3 3.48l-5.028 2.681a2.5 2.5 0 1 0 0 .682L12.7 13.02A2.5 2.5 0 1 0 13 12c0 .116-.008.23-.023.343L7.95 9.661A2.5 2.5 0 0 0 8 9c0-.227-.03-.447-.086-.656l5.028-2.68c.432.525 1.087.86 1.838.86Z" />
        </svg>
      </button>

      {open && (
        <div
          id={menuId}
          role="menu"
          className="absolute right-0 top-full z-30 mt-3 w-56 overflow-hidden rounded-2xl border border-zinc-200 bg-white py-1.5 shadow-[0_18px_45px_rgba(15,23,42,0.16)]"
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              onCopyInviteLink();
              setOpen(false);
            }}
            disabled={!inviteCode}
            className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-zinc-700 transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-orange-50 text-orange-500">
              <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path d="M12.59 2.59a2 2 0 0 1 2.82 0l2 2a2 2 0 0 1 0 2.82l-2.12 2.12a.75.75 0 1 1-1.06-1.06l2.12-2.12a.5.5 0 0 0 0-.7l-2-2a.5.5 0 0 0-.7 0L11.53 5.8a.75.75 0 0 1-1.06-1.06l2.12-2.12Z" />
                <path d="M8.47 14.2a.75.75 0 0 1 1.06 0l.94.94a.5.5 0 0 0 .7 0l2-2a.5.5 0 0 0 0-.7l-.94-.94a.75.75 0 0 1 1.06-1.06l.94.94a2 2 0 0 1 0 2.82l-2 2a2 2 0 0 1-2.82 0l-.94-.94a.75.75 0 0 1 0-1.06Z" />
                <path d="M12.03 7.97a.75.75 0 0 1 0 1.06l-3 3a.75.75 0 0 1-1.06-1.06l3-3a.75.75 0 0 1 1.06 0Z" />
              </svg>
            </span>
            <span>Copy invite link</span>
          </button>

          <button
            type="button"
            role="menuitem"
            onClick={() => {
              onInviteByEmail();
              setOpen(false);
            }}
            className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-zinc-700 transition-colors hover:bg-zinc-50"
          >
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-orange-50 text-orange-500">
              <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path d="M2 5.75A1.75 1.75 0 0 1 3.75 4h12.5A1.75 1.75 0 0 1 18 5.75v8.5A1.75 1.75 0 0 1 16.25 16H3.75A1.75 1.75 0 0 1 2 14.25v-8.5Zm1.5.31v.085l6.178 3.707a.75.75 0 0 0 .644 0L16.5 6.146v-.085a.25.25 0 0 0-.25-.25H3.75a.25.25 0 0 0-.25.25Zm13 1.827-5.406 3.244a2.25 2.25 0 0 1-2.188 0L3.5 7.888v6.362c0 .138.112.25.25.25h12.5a.25.25 0 0 0 .25-.25V7.888Z" />
              </svg>
            </span>
            <span>Invite by email</span>
          </button>
        </div>
      )}
    </div>
  );
}
