"use client";

import { useState, useRef, useEffect } from 'react';
import { usePushNotifications } from '@/hooks/usePushNotifications';

export default function NotificationBell() {
  const {
    status,
    isLoading,
    error,
    subscribe,
    unsubscribe,
    isSupported,
    isSubscribed,
    canSubscribe,
  } = usePushNotifications();

  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Don't render if not supported
  if (!isSupported || status === 'loading') {
    return null;
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setShowMenu(!showMenu)}
        className={`relative p-2 rounded-full transition-colors ${
          isSubscribed
            ? 'text-emerald-600 hover:bg-emerald-50'
            : 'text-zinc-400 hover:bg-zinc-100'
        }`}
        title={isSubscribed ? 'Notifications enabled' : 'Enable notifications'}
        aria-label="Notification settings"
      >
        {/* Bell Icon */}
        <svg
          className="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
          />
        </svg>

        {/* Active indicator */}
        {isSubscribed && (
          <span className="absolute top-1 right-1 w-2 h-2 bg-emerald-500 rounded-full" />
        )}
      </button>

      {/* Dropdown Menu */}
      {showMenu && (
        <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-xl border border-zinc-200 shadow-xl shadow-zinc-900/5 py-3 z-50">
          <div className="px-4 pb-3 border-b border-zinc-100">
            <h3 className="font-medium text-zinc-900 text-sm">Push Notifications</h3>
            <p className="text-xs text-zinc-500 mt-1">
              Get notified when someone creates an event near you
            </p>
          </div>

          {error && (
            <div className="px-4 py-2 bg-red-50 border-b border-red-100">
              <p className="text-xs text-red-600">{error}</p>
            </div>
          )}

          <div className="px-4 py-3">
            {status === 'denied' ? (
              <div className="text-sm text-zinc-600">
                <p className="text-red-600 font-medium">Notifications blocked</p>
                <p className="text-xs mt-1">
                  Please enable notifications in your browser settings.
                </p>
              </div>
            ) : isSubscribed ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-emerald-600">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>Notifications enabled</span>
                </div>

                <button
                  onClick={unsubscribe}
                  disabled={isLoading}
                  className="w-full px-3 py-2 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
                >
                  {isLoading ? 'Disabling...' : 'Disable Notifications'}
                </button>
              </div>
            ) : canSubscribe ? (
              <button
                onClick={subscribe}
                disabled={isLoading}
                className="w-full px-4 py-2.5 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
              >
                {isLoading ? 'Enabling...' : 'Enable Notifications'}
              </button>
            ) : null}
          </div>

          <div className="px-4 pt-2 border-t border-zinc-100">
            <p className="text-xs text-zinc-400">
              We&apos;ll send alerts for events within 10km of your location.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
