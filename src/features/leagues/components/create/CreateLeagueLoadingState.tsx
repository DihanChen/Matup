"use client";

export default function CreateLeagueLoadingState() {
  return (
    <div className="min-h-screen bg-white">
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 animate-pulse">
        <div className="h-8 w-64 bg-zinc-200 rounded-xl mx-auto" />
        <div className="flex items-center justify-center gap-3">
          {[1, 2, 3].map((step) => (
            <div key={`league-create-step-skeleton-${step}`} className="h-8 w-24 rounded-full bg-zinc-100" />
          ))}
        </div>
        <div className="rounded-2xl border border-zinc-200 p-6 sm:p-8 space-y-5">
          <div className="h-6 w-48 bg-zinc-200 rounded" />
          <div className="grid grid-cols-2 gap-4 max-w-md">
            {[1, 2, 3, 4].map((item) => (
              <div key={`league-create-sport-skeleton-${item}`} className="h-28 rounded-2xl bg-zinc-100" />
            ))}
          </div>
          <div className="h-12 w-full bg-zinc-100 rounded-full" />
          <div className="h-12 w-40 bg-zinc-200 rounded-full ml-auto" />
        </div>
      </main>
    </div>
  );
}
