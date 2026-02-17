"use client";

export default function CreateEventLoadingState() {
  return (
    <div className="min-h-screen bg-white">
      <main className="max-w-[980px] mx-auto px-4 sm:px-6 py-8 sm:py-12 animate-pulse">
        <div className="h-8 w-56 bg-zinc-200 rounded-xl mb-3" />
        <div className="h-4 w-72 bg-zinc-100 rounded mb-8" />

        <div className="flex items-center gap-3 mb-8">
          {[1, 2, 3].map((item) => (
            <div key={`create-step-skeleton-${item}`} className="h-8 w-20 rounded-full bg-zinc-100" />
          ))}
        </div>

        <div className="rounded-2xl border border-zinc-200 p-6 sm:p-8">
          <div className="h-6 w-48 bg-zinc-200 rounded mb-4" />
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 mb-6">
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <div key={`create-activity-skeleton-${item}`} className="h-24 rounded-2xl bg-zinc-100" />
            ))}
          </div>
          <div className="h-12 w-full bg-zinc-100 rounded-full mb-3" />
          <div className="h-12 w-40 bg-zinc-200 rounded-full ml-auto" />
        </div>
      </main>
    </div>
  );
}
