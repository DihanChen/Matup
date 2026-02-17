"use client";

import type { LeagueDetailContentProps } from "@/features/leagues/components/detail/types";
import { formatDistance, formatDuration } from "@/lib/league-utils";

type Props = {
  data: LeagueDetailContentProps;
};

export default function RunningSessionsCard({ data }: Props) {
  const {
    isRunningLeague,
    isParticipantView,
    isOwnerOrAdmin,
    creatingSession,
    onOpenCreateRunningSessionModal,
    sessionsError,
    sortedRunningSessions,
    submittingRunSessionId,
    finalizingSessionId,
    reviewingRunId,
    onOpenRunEntryModal,
    onHandleFinalizeRunningSession,
    onHandleReviewRun,
    onOpenRejectRunModal,
  } = data;

  if (!isRunningLeague) return null;

  return (
    <div
      className={`${
        isParticipantView ? "order-2" : ""
      } md:col-span-12 bg-white rounded-2xl border border-zinc-200 p-6`}
    >
      <div className="flex items-center justify-between gap-2 mb-4">
        <h2 className="text-lg font-semibold text-zinc-900">Running Sessions</h2>
        {isOwnerOrAdmin && (
          <button
            type="button"
            onClick={onOpenCreateRunningSessionModal}
            disabled={creatingSession}
            className="px-3 py-1.5 border border-zinc-200 text-zinc-700 rounded-full text-xs font-medium hover:bg-zinc-50 transition-colors disabled:opacity-50"
          >
            {creatingSession ? "Saving..." : "Create Session"}
          </button>
        )}
      </div>

      {sessionsError && (
        <div className="mb-3 p-2.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600">
          {sessionsError}
        </div>
      )}

      {sortedRunningSessions.length === 0 ? (
        <p className="text-sm text-zinc-500">No sessions yet.</p>
      ) : (
        <div className="space-y-3">
          {sortedRunningSessions.map((session) => {
            const visibleRuns = session.runs
              .filter((run) => run.status !== "rejected")
              .sort((a, b) => a.elapsed_seconds - b.elapsed_seconds);
            const pendingRuns = session.runs.filter((run) => run.status === "submitted");
            const isSubmitting = submittingRunSessionId === session.id;
            const isFinalizing = finalizingSessionId === session.id;

            return (
              <div key={session.id} className="p-4 bg-zinc-50 rounded-xl">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-sm font-medium text-zinc-900">
                    {session.week_number ? `Week ${session.week_number}` : "Session"}
                  </span>
                  <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-blue-50 text-blue-700 capitalize">
                    {session.status}
                  </span>
                </div>
                <div className="text-xs text-zinc-500 mb-2">
                  {session.distance_meters ? formatDistance(session.distance_meters) : "Distance TBD"} ·{" "}
                  {session.session_type.replace("_", " ")}
                  {session.submission_deadline && (
                    <> · Deadline {new Date(session.submission_deadline).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</>
                  )}
                </div>

                <div className="text-xs text-zinc-600 mb-2">
                  {session.my_run ? (
                    <>
                      Your run: {formatDuration(session.my_run.elapsed_seconds)} ({formatDistance(session.my_run.distance_meters)})
                    </>
                  ) : (
                    "No run submitted yet."
                  )}
                </div>

                <div className="flex flex-wrap gap-2 mb-2">
                  <button
                    type="button"
                    onClick={() => onOpenRunEntryModal(session)}
                    disabled={isSubmitting || session.status === "finalized" || session.status === "closed"}
                    className="px-3 py-1.5 bg-zinc-900 text-white rounded-full text-xs font-medium hover:bg-zinc-800 transition-colors disabled:opacity-50"
                  >
                    {isSubmitting ? "Saving..." : session.my_run ? "Update My Run" : "Submit My Run"}
                  </button>

                  {isOwnerOrAdmin && session.status !== "finalized" && (
                    <button
                      type="button"
                      onClick={() => onHandleFinalizeRunningSession(session.id)}
                      disabled={isFinalizing}
                      className="px-3 py-1.5 border border-zinc-300 text-zinc-700 rounded-full text-xs font-medium hover:bg-zinc-100 transition-colors disabled:opacity-50"
                    >
                      {isFinalizing ? "Finalizing..." : "Finalize Session"}
                    </button>
                  )}
                </div>

                {visibleRuns.length > 0 && (
                  <div className="space-y-1">
                    {visibleRuns.slice(0, 5).map((run, index) => (
                      <div key={run.id} className="flex items-center justify-between text-xs text-zinc-600">
                        <span>{index + 1}. {run.name || "Anonymous"}</span>
                        <span>{formatDuration(run.elapsed_seconds)}</span>
                      </div>
                    ))}
                  </div>
                )}

                {isOwnerOrAdmin && pendingRuns.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-zinc-200 space-y-2">
                    <div className="text-xs font-medium text-zinc-500">Pending reviews</div>
                    {pendingRuns.map((run) => (
                      <div key={run.id} className="flex items-center justify-between gap-2 text-xs">
                        <span className="text-zinc-700">{run.name || "Anonymous"} · {formatDuration(run.elapsed_seconds)}</span>
                        <div className="flex gap-1.5">
                          <button
                            type="button"
                            onClick={() => onHandleReviewRun(session.id, run.id, "approve")}
                            disabled={reviewingRunId === run.id}
                            className="px-2 py-1 bg-emerald-600 text-white rounded-full font-medium disabled:opacity-50"
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            onClick={() => onOpenRejectRunModal(session.id, run.id, run.name || "Anonymous")}
                            disabled={reviewingRunId === run.id}
                            className="px-2 py-1 border border-red-300 text-red-600 rounded-full font-medium disabled:opacity-50"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
