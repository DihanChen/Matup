"use client";

import Link from "next/link";

export default function CreateLeaguePremiumState() {
  return (
    <div className="min-h-screen bg-white">
      <main className="max-w-lg mx-auto px-4 sm:px-6 py-12 sm:py-16 text-center">
        <div className="w-20 h-20 sm:w-24 sm:h-24 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 sm:w-12 sm:h-12 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 0 1 3 3h-15a3 3 0 0 1 3-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 0 1-.982-3.172M9.497 14.25a7.454 7.454 0 0 0 .981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 0 0 7.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M18.75 4.236c.982.143 1.954.317 2.916.52A6.003 6.003 0 0 1 16.27 9.728M18.75 4.236V4.5c0 2.108-.966 3.99-2.48 5.228m0 0a6.003 6.003 0 0 1-2.27.94m2.27-.94a17.957 17.957 0 0 0 3.485-2.269" />
          </svg>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 mb-2">
          Premium Required
        </h1>
        <p className="text-zinc-500 mb-6">
          Creating leagues is a premium feature. Upgrade to unlock league
          management with score tracking and rankings.
        </p>
        <Link
          href="/leagues"
          className="inline-block px-5 py-2.5 bg-zinc-900 text-white rounded-full text-sm font-medium hover:bg-zinc-800 transition-colors"
        >
          Back to Leagues
        </Link>
      </main>
    </div>
  );
}
