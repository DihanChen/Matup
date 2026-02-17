"use client";

import { ActivityIcon } from "@/components/create-event/ActivityCard";
import type { LeagueCreateFormData } from "@/features/leagues/components/create/types";

type Props = {
  formData: LeagueCreateFormData;
  onUpdateFormData: (updates: Partial<LeagueCreateFormData>) => void;
};

export default function SportAndFormatStep({ formData, onUpdateFormData }: Props) {
  return (
    <div className="animate-fadeIn">
      <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-zinc-900 text-center mb-8 sm:mb-10">
        Choose your <span className="text-orange-500">sport</span>
      </h1>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 max-w-5xl mx-auto mb-8">
        <button
          type="button"
          onClick={() => onUpdateFormData({ sportType: "running", matchType: "", rotationType: "" })}
          className={`
            relative p-5 sm:p-7 rounded-2xl cursor-pointer transition-all duration-200
            bg-zinc-100 flex flex-col items-center text-center
            hover:scale-105 hover:shadow-lg
            ${formData.sportType === "running"
              ? "ring-2 ring-yellow-400 ring-offset-2 scale-105 shadow-lg"
              : "hover:ring-2 hover:ring-zinc-300"
            }
          `}
        >
          <div className="text-zinc-900 mb-3">
            <ActivityIcon id="running" className="w-8 h-8 sm:w-10 sm:h-10" />
          </div>
          <div className="text-zinc-900 font-semibold">Running</div>
          <div className="text-xs text-zinc-500 mt-1">Club runs & time trials</div>
        </button>
        <button
          type="button"
          onClick={() => onUpdateFormData({ sportType: "pickleball", matchType: "", rotationType: "" })}
          className={`
            relative p-5 sm:p-7 rounded-2xl cursor-pointer transition-all duration-200
            bg-zinc-100 flex flex-col items-center text-center
            hover:scale-105 hover:shadow-lg
            ${formData.sportType === "pickleball"
              ? "ring-2 ring-yellow-400 ring-offset-2 scale-105 shadow-lg"
              : "hover:ring-2 hover:ring-zinc-300"
            }
          `}
        >
          <div className="text-zinc-900 mb-3">
            <ActivityIcon id="pickleball" className="w-8 h-8 sm:w-10 sm:h-10" />
          </div>
          <div className="text-zinc-900 font-semibold">Pickleball</div>
          <div className="text-xs text-zinc-500 mt-1">Singles & doubles seasons</div>
        </button>
        <button
          type="button"
          onClick={() => onUpdateFormData({ sportType: "tennis", matchType: "", rotationType: "" })}
          className={`
            relative p-5 sm:p-7 rounded-2xl cursor-pointer transition-all duration-200
            bg-zinc-100 flex flex-col items-center text-center
            hover:scale-105 hover:shadow-lg
            ${formData.sportType === "tennis"
              ? "ring-2 ring-yellow-400 ring-offset-2 scale-105 shadow-lg"
              : "hover:ring-2 hover:ring-zinc-300"
            }
          `}
        >
          <div className="text-zinc-900 mb-3">
            <ActivityIcon id="tennis" className="w-8 h-8 sm:w-10 sm:h-10" />
          </div>
          <div className="text-zinc-900 font-semibold">Tennis</div>
          <div className="text-xs text-zinc-500 mt-1">Singles & doubles leagues</div>
        </button>
        <div
          className="relative p-5 sm:p-7 rounded-2xl bg-zinc-100/80 border border-dashed border-zinc-300 flex flex-col items-center text-center cursor-not-allowed opacity-70"
          aria-disabled="true"
        >
          <div className="text-zinc-600 mb-3">
            <svg className="w-8 h-8 sm:w-10 sm:h-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          </div>
          <div className="text-zinc-700 font-semibold">More Sports</div>
          <div className="text-xs text-zinc-500 mt-1">Coming soon</div>
        </div>
      </div>

      {formData.sportType === "running" && (
        <div className="max-w-md mx-auto mb-6">
          <div className="flex items-center gap-2 mb-4 justify-center">
            <ActivityIcon id="running" className="w-4 h-4 text-zinc-500" />
            <span className="text-sm font-bold text-zinc-900">Leaderboard Mode</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => onUpdateFormData({ runningComparisonMode: "personal_progress" })}
              className={`
                p-4 sm:p-6 rounded-2xl cursor-pointer transition-all duration-200
                bg-zinc-100 flex flex-col items-center text-center
                hover:scale-105 hover:shadow-lg
                ${formData.runningComparisonMode === "personal_progress"
                  ? "ring-2 ring-yellow-400 ring-offset-2 scale-105 shadow-lg"
                  : "hover:ring-2 hover:ring-zinc-300"
                }
              `}
            >
              <div className="text-zinc-900 mb-2">
                <svg className="w-7 h-7 sm:w-8 sm:h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 17.25 9 11.25l4.5 4.5L21 8.25m0 0h-5.25M21 8.25V13.5" />
                </svg>
              </div>
              <div className="font-semibold text-zinc-900 text-sm">Personal Progress</div>
              <div className="text-xs text-zinc-500 mt-1">
                Rank by pace improvement vs previous session.
              </div>
            </button>
            <button
              type="button"
              onClick={() => onUpdateFormData({ runningComparisonMode: "absolute_performance" })}
              className={`
                p-4 sm:p-6 rounded-2xl cursor-pointer transition-all duration-200
                bg-zinc-100 flex flex-col items-center text-center
                hover:scale-105 hover:shadow-lg
                ${formData.runningComparisonMode === "absolute_performance"
                  ? "ring-2 ring-yellow-400 ring-offset-2 scale-105 shadow-lg"
                  : "hover:ring-2 hover:ring-zinc-300"
                }
              `}
            >
              <div className="text-zinc-900 mb-2">
                <svg className="w-7 h-7 sm:w-8 sm:h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 17.25h18M6.75 17.25V9.75m5.25 7.5V6.75m5.25 10.5v-4.5" />
                </svg>
              </div>
              <div className="font-semibold text-zinc-900 text-sm">Absolute Performance</div>
              <div className="text-xs text-zinc-500 mt-1">
                Rank by total time (fastest overall leads).
              </div>
            </button>
          </div>
        </div>
      )}

      {(formData.sportType === "tennis" || formData.sportType === "pickleball") && (
        <>
          <div className="max-w-md mx-auto mb-6">
            <div className="flex items-center gap-2 mb-4 justify-center">
              <ActivityIcon id={formData.sportType} className="w-4 h-4 text-zinc-500" />
              <span className="text-sm font-bold text-zinc-900">Match Type</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => onUpdateFormData({ matchType: "singles", rotationType: "" })}
                className={`
                  p-4 sm:p-6 rounded-2xl cursor-pointer transition-all duration-200
                  bg-zinc-100 flex flex-col items-center text-center
                  hover:scale-105 hover:shadow-lg
                  ${formData.matchType === "singles"
                    ? "ring-2 ring-yellow-400 ring-offset-2 scale-105 shadow-lg"
                    : "hover:ring-2 hover:ring-zinc-300"
                  }
                `}
              >
                <div className="text-zinc-900 mb-2">
                  <svg className="w-7 h-7 sm:w-8 sm:h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                  </svg>
                </div>
                <div className="font-semibold text-zinc-900 text-sm">Singles</div>
                <div className="text-xs text-zinc-500 mt-1">1 vs 1 matches</div>
              </button>
              <button
                type="button"
                onClick={() => onUpdateFormData({ matchType: "doubles" })}
                className={`
                  p-4 sm:p-6 rounded-2xl cursor-pointer transition-all duration-200
                  bg-zinc-100 flex flex-col items-center text-center
                  hover:scale-105 hover:shadow-lg
                  ${formData.matchType === "doubles"
                    ? "ring-2 ring-yellow-400 ring-offset-2 scale-105 shadow-lg"
                    : "hover:ring-2 hover:ring-zinc-300"
                  }
                `}
              >
                <div className="text-zinc-900 mb-2">
                  <svg className="w-7 h-7 sm:w-8 sm:h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
                  </svg>
                </div>
                <div className="font-semibold text-zinc-900 text-sm">Doubles</div>
                <div className="text-xs text-zinc-500 mt-1">2 vs 2 matches</div>
              </button>
            </div>
          </div>

          {formData.matchType === "doubles" && (
            <div className="max-w-md mx-auto">
              <div className="flex items-center gap-2 mb-4 justify-center">
                <svg className="w-4 h-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 0 0-3.7-3.7 48.678 48.678 0 0 0-7.324 0 4.006 4.006 0 0 0-3.7 3.7c-.017.22-.032.441-.046.662M19.5 12l3-3m-3 3-3-3m-12 3c0 1.232.046 2.453.138 3.662a4.006 4.006 0 0 0 3.7 3.7 48.656 48.656 0 0 0 7.324 0 4.006 4.006 0 0 0 3.7-3.7c.017-.22.032-.441.046-.662M4.5 12l3 3m-3-3-3 3" />
                </svg>
                <span className="text-sm font-bold text-zinc-900">Rotation Type</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => onUpdateFormData({ rotationType: "random" })}
                  className={`
                    p-4 sm:p-5 rounded-2xl cursor-pointer transition-all duration-200
                    bg-zinc-100 flex flex-col items-center text-center
                    hover:scale-105 hover:shadow-lg
                    ${formData.rotationType === "random"
                      ? "ring-2 ring-yellow-400 ring-offset-2 scale-105 shadow-lg"
                      : "hover:ring-2 hover:ring-zinc-300"
                    }
                  `}
                >
                  <div className="text-zinc-900 mb-2">
                    <svg className="w-6 h-6 sm:w-7 sm:h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
                    </svg>
                  </div>
                  <div className="font-semibold text-zinc-900 text-sm">Random</div>
                  <div className="text-xs text-zinc-500 mt-1">Random partners each week</div>
                </button>
                <button
                  type="button"
                  onClick={() => onUpdateFormData({ rotationType: "assigned" })}
                  className={`
                    p-4 sm:p-5 rounded-2xl cursor-pointer transition-all duration-200
                    bg-zinc-100 flex flex-col items-center text-center
                    hover:scale-105 hover:shadow-lg
                    ${formData.rotationType === "assigned"
                      ? "ring-2 ring-yellow-400 ring-offset-2 scale-105 shadow-lg"
                      : "hover:ring-2 hover:ring-zinc-300"
                    }
                  `}
                >
                  <div className="text-zinc-900 mb-2">
                    <svg className="w-6 h-6 sm:w-7 sm:h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" />
                    </svg>
                  </div>
                  <div className="font-semibold text-zinc-900 text-sm">Assigned</div>
                  <div className="text-xs text-zinc-500 mt-1">Fixed partner all season</div>
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
