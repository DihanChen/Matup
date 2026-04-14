"use client";

import Link from "next/link";
import { ErrorState } from "@/components/ui";
import SubmitResultModal from "@/components/leagues/SubmitResultModal";
import CreateSessionModal from "@/components/leagues/CreateSessionModal";
import DeleteLeagueModal from "@/components/leagues/DeleteLeagueModal";
import EmailMembersModal from "@/components/leagues/EmailMembersModal";
import InviteModal from "@/components/leagues/InviteModal";
import ManageTeamsModal from "@/components/leagues/ManageTeamsModal";
import RejectModal from "@/components/leagues/RejectModal";
import RescheduleModal from "@/components/leagues/RescheduleModal";
import ResolveDisputeModal from "@/components/leagues/ResolveDisputeModal";
import RunEntryModal from "@/components/leagues/RunEntryModal";
import LeagueDetailContent from "@/features/leagues/components/LeagueDetailContent";
import { type LeagueMatch } from "@/lib/league-types";
import {
  formatSideNames,
  useLeagueDetailPage,
} from "@/features/leagues/hooks/useLeagueDetailPage";

export default function LeagueDetailPageClient() {
  const {
    user,
    league,
    members,
    standings,
    teamStandings,
    loading,
    error,
    joining,
    leaving,
    generating,
    deleting,
    showDeleteModal,
    setShowDeleteModal,
    showEmailModal,
    emailSubject,
    setEmailSubject,
    emailMessage,
    setEmailMessage,
    sendingEmail,
    emailError,
    emailSuccess,
    reviewingSubmissionId,
    inviteCode,
    leagueInvites,
    showInviteModal,
    inviteEmailInput,
    setInviteEmailInput,
    inviteEmails,
    sendingInvites,
    inviteError,
    inviteSuccess,
    sessionsError,
    submittingRunSessionId,
    reviewingRunId,
    finalizingSessionId,
    creatingSession,
    resolvingFixtureId,
    showCreateSessionModal,
    setShowCreateSessionModal,
    createSessionWeek,
    setCreateSessionWeek,
    createSessionDistance,
    setCreateSessionDistance,
    createSessionStart,
    setCreateSessionStart,
    createSessionDeadline,
    setCreateSessionDeadline,
    runEntrySession,
    setRunEntrySession,
    runEntryMinutes,
    setRunEntryMinutes,
    runEntrySeconds,
    setRunEntrySeconds,
    runEntryDistanceMeters,
    setRunEntryDistanceMeters,
    rejectSubmissionMatch,
    setRejectSubmissionMatch,
    rejectSubmissionReason,
    setRejectSubmissionReason,
    rejectRunTarget,
    setRejectRunTarget,
    rejectRunReason,
    setRejectRunReason,
    resolveMatchTarget,
    setResolveMatchTarget,
    resolveWinner,
    setResolveWinner,
    resolveReason,
    setResolveReason,
    assignedTeams,
    unpairedAssignedMemberIds,
    showAssignedTeamsModal,
    setShowAssignedTeamsModal,
    assignedTeamDrafts,
    assignedTeamsError,
    savingAssignedTeams,
    submitResultMatch,
    setSubmitResultMatch,
    successMessage,
    ownerViewMode,
    setOwnerViewMode,
    currentMember,
    isOwnerOrAdmin,
    isMember,
    isFull,
    isRacketLeague,
    isPickleballLeague,
    isDoubles,
    isAssignedDoubles,
    isRunningLeague,
    emailRecipientCount,
    pendingReviewMatches,
    sortedRunningSessions,
    ownerMember,
    matches: allMatches,
    completedMatches,
    isParticipantView,
    showRecordResultsAction,
    showManageTeamsAction,
    showEmailMembersAction,
    showDeleteLeagueAction,
    hasSecondaryLeagueActionPair,
    displayedRecentResults,
    displayedPendingReviewMatches,
    displayedUpcomingMatches,
    hasRecentResults,
    hasPendingResultReviews,
    hasUpcomingMatches,
    recentResultsSpanClass,
    upcomingMatchesSpanClass,
    isRunningProgressMode,
    needsTeamSetup,
    ownerCanToggleToParticipantView,
    showGenerateSchedule,
    canGenerateSchedule,
    generateScheduleMessage,
    hasLeagueActions,
    handleGenerateSchedule,
    handleReviewSubmission,
    openRejectSubmissionModal,
    handleSubmitSubmissionRejection,
    handleCopyInviteCode,
    handleCopyInviteLink,
    handleEditLeague,
    handleCopyLeague,
    openInviteModal,
    closeInviteModal,
    addInviteEmailFromInput,
    removeInviteEmail,
    handleSendInvites,
    handleSubmitResultSuccess,
    getMemberNameById,
    openAssignedTeamsModal,
    updateAssignedTeamDraft,
    addAssignedTeamDraft,
    removeAssignedTeamDraft,
    isAssignedSlotTaken,
    handleSaveAssignedTeams,
    openCreateRunningSessionModal,
    handleCreateRunningSession,
    openRunEntryModal,
    handleSubmitRun,
    handleReviewRun,
    openRejectRunModal,
    handleSubmitRunRejection,
    handleFinalizeRunningSession,
    announcements,
    openResolveDisputeModal,
    handleResolveDisputedFixture,
    rescheduleMatch,
    setRescheduleMatch,
    reschedulingFixtureId,
    openRescheduleModal,
    handleRescheduleFixture,
    handleGeneratePlayoffs,
    generatingPlayoffs,
    handleJoin,
    handleLeave,
    handleDelete,
    openEmailModal,
    closeEmailModal,
    handleSendEmail,
    seasons,
    selectedSeasonId,
    setSelectedSeasonId,
    handleCreateNewSeason,
    creatingNewSeason,
  } = useLeagueDetailPage();

  const showOwnerDashboard =
    currentMember?.role === "owner" && !isParticipantView;

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-cool-gradient">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-10 animate-pulse">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-9 w-32 rounded-full bg-zinc-200" />
            <div className="h-7 w-24 rounded-full bg-zinc-100" />
          </div>
          <div className="rounded-[34px] border border-zinc-200 bg-white p-3 shadow-[0_24px_60px_rgba(15,23,42,0.05)]">
            <div className="h-[290px] rounded-[30px] bg-league-hero-gradient" />
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={`league-detail-metric-skeleton-${item}`}
                className="rounded-[26px] border border-zinc-200 bg-white p-4"
              >
                <div className="h-3 w-24 rounded bg-zinc-200" />
                <div className="mt-4 h-8 w-20 rounded bg-zinc-100" />
                <div className="mt-3 h-3 w-32 rounded bg-zinc-100" />
              </div>
            ))}
          </div>
          <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(300px,0.85fr)]">
            <div className="space-y-6">
              <div className="rounded-[30px] border border-zinc-200 bg-white p-5">
                <div className="h-5 w-40 rounded bg-zinc-200" />
                <div className="mt-5 space-y-3">
                  {[1, 2, 3].map((item) => (
                    <div
                      key={`league-detail-main-skeleton-${item}`}
                      className="h-28 rounded-[22px] bg-zinc-100"
                    />
                  ))}
                </div>
              </div>
            </div>
            <div className="space-y-6">
              {[1, 2].map((item) => (
                <div
                  key={`league-detail-side-skeleton-${item}`}
                  className="rounded-[30px] border border-zinc-200 bg-white p-5"
                >
                  <div className="h-5 w-32 rounded bg-zinc-200" />
                  <div className="mt-4 space-y-3">
                    {[1, 2, 3].map((line) => (
                      <div
                        key={`league-detail-side-skeleton-${item}-${line}`}
                        className="h-12 rounded-2xl bg-zinc-100"
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !league) {
    return (
      <div className="min-h-screen bg-surface-cool-gradient">
        <div className="max-w-xl mx-auto px-4 py-24">
          <div className="rounded-[30px] border border-zinc-200 bg-white p-8 shadow-[0_24px_60px_rgba(15,23,42,0.05)]">
            <ErrorState
              title="League unavailable"
              description={error || "We couldn't find this league. It may have been removed or you don't have access."}
              action={
                <Link
                  href="/leagues"
                  className="inline-flex items-center justify-center rounded-full border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
                >
                  Back to leagues
                </Link>
              }
            />
          </div>
        </div>
      </div>
    );
  }

  const sportDisplayName =
    league.sport_type.charAt(0).toUpperCase() + league.sport_type.slice(1);
  const scoringFormat = league.scoring_format;

  function formatMatchResult(match: LeagueMatch) {
    const fmt = scoringFormat;
    if (fmt === "singles" || fmt === "doubles") {
      const teamA = match.participants.filter((p) => p.team === "A");
      const teamB = match.participants.filter((p) => p.team === "B");
      const sideANames = teamA.map((p) => p.name || "?").join(" & ") || "Side A";
      const sideBNames = teamB.map((p) => p.name || "?").join(" & ") || "Side B";
      return (
        <div className="space-y-1.5 text-sm">
          <div className={`flex items-start gap-2 ${match.winner === "A" ? "text-orange-500" : "text-zinc-900"}`}>
            <span className="mt-0.5 text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
              A
            </span>
            <span className="font-medium break-words">{sideANames}</span>
          </div>
          <div className={`flex items-start gap-2 ${match.winner === "B" ? "text-orange-500" : "text-zinc-900"}`}>
            <span className="mt-0.5 text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
              B
            </span>
            <span className="font-medium break-words">{sideBNames}</span>
          </div>
        </div>
      );
    }
    if (fmt === "team_vs_team") {
      const teamA = match.participants.filter((p) => p.team === "A");
      const teamB = match.participants.filter((p) => p.team === "B");
      const teamALabel = teamA.map((p) => p.name || "?").join(", ");
      const teamBLabel = teamB.map((p) => p.name || "?").join(", ");
      return (
        <div className="space-y-1.5 text-sm">
          <div className={`flex items-start gap-2 ${match.winner === "A" ? "text-orange-500" : "text-zinc-900"}`}>
            <span className="mt-0.5 text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
              A
            </span>
            <span className="font-medium break-words">
              Team A ({teamALabel || "No players"})
            </span>
          </div>
          <div className={`flex items-start gap-2 ${match.winner === "B" ? "text-orange-500" : "text-zinc-900"}`}>
            <span className="mt-0.5 text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
              B
            </span>
            <span className="font-medium break-words">
              Team B ({teamBLabel || "No players"})
            </span>
          </div>
        </div>
      );
    }
    return null;
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f8fafc_0%,#eef2f5_100%)]">
      <main
        className="mx-auto max-w-7xl px-4 sm:px-6 py-6 sm:py-8"
      >
        <div className="mb-4 sm:mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              href="/leagues"
              className={`inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-sm font-medium transition-colors ${
                showOwnerDashboard
                  ? "border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"
                  : "border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 hover:border-zinc-300"
              }`}
            >
              <span className="text-zinc-500">←</span>
              <span>Back to leagues</span>
            </Link>
          </div>

          {showOwnerDashboard && league.start_date && (
            <div className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-500">
              Season starts{" "}
              <span className="text-zinc-800">
                {new Date(league.start_date).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </div>
          )}
        </div>

        {successMessage && (
          <div
            className={`mb-4 flex items-center gap-2 rounded-2xl border p-3 text-sm ${
              showOwnerDashboard
                ? "border-emerald-200 bg-white text-emerald-700 shadow-[0_12px_30px_rgba(16,185,129,0.08)]"
                : "border-emerald-200 bg-emerald-50 text-emerald-700"
            }`}
          >
            <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
            {successMessage}
          </div>
        )}

        <LeagueDetailContent
          league={league}
          members={members}
          standings={standings}
          teamStandings={teamStandings}
          leagueInvites={leagueInvites}
          assignedTeams={assignedTeams}
          unpairedAssignedMemberIds={unpairedAssignedMemberIds}
          pendingReviewMatches={pendingReviewMatches}
          displayedRecentResults={displayedRecentResults}
          displayedPendingReviewMatches={displayedPendingReviewMatches}
          displayedUpcomingMatches={displayedUpcomingMatches}
          ownerMember={ownerMember}
          allMatches={allMatches}
          completedMatches={completedMatches}
          announcements={announcements}
          sortedRunningSessions={sortedRunningSessions}
          isRacketLeague={isRacketLeague}
          isPickleballLeague={isPickleballLeague}
          isDoubles={isDoubles}
          isAssignedDoubles={isAssignedDoubles}
          isRunningLeague={isRunningLeague}
          isRunningProgressMode={isRunningProgressMode}
          isOwnerOrAdmin={isOwnerOrAdmin}
          isMember={isMember}
          isFull={isFull}
          isParticipantView={isParticipantView}
          hasRecentResults={hasRecentResults}
          hasPendingResultReviews={hasPendingResultReviews}
          hasUpcomingMatches={hasUpcomingMatches}
          needsTeamSetup={needsTeamSetup}
          hasLeagueActions={hasLeagueActions}
          showGenerateSchedule={showGenerateSchedule}
          canGenerateSchedule={canGenerateSchedule}
          generateScheduleMessage={generateScheduleMessage}
          showRecordResultsAction={showRecordResultsAction}
          showManageTeamsAction={showManageTeamsAction}
          showEmailMembersAction={showEmailMembersAction}
          showDeleteLeagueAction={showDeleteLeagueAction}
          hasSecondaryLeagueActionPair={hasSecondaryLeagueActionPair}
          ownerCanToggleToParticipantView={ownerCanToggleToParticipantView}
          ownerViewMode={ownerViewMode}
          recentResultsSpanClass={recentResultsSpanClass}
          upcomingMatchesSpanClass={upcomingMatchesSpanClass}
          currentUserId={user?.id || null}
          isAuthenticated={!!user}
          currentMemberRole={currentMember?.role || null}
          inviteCode={inviteCode}
          inviteError={inviteError}
          inviteSuccess={inviteSuccess}
          joining={joining}
          leaving={leaving}
          generating={generating}
          creatingSession={creatingSession}
          sessionsError={sessionsError}
          submittingRunSessionId={submittingRunSessionId}
          reviewingSubmissionId={reviewingSubmissionId}
          reviewingRunId={reviewingRunId}
          finalizingSessionId={finalizingSessionId}
          resolvingFixtureId={resolvingFixtureId}
          sportDisplayName={sportDisplayName}
          onOwnerViewModeChange={setOwnerViewMode}
          onHandleJoin={handleJoin}
          onHandleLeave={handleLeave}
          onHandleCopyInviteLink={handleCopyInviteLink}
          onOpenInviteModal={openInviteModal}
          onHandleEditLeague={handleEditLeague}
          onHandleCopyLeague={handleCopyLeague}
          onHandleGenerateSchedule={handleGenerateSchedule}
          onOpenAssignedTeamsModal={openAssignedTeamsModal}
          onOpenEmailModal={openEmailModal}
          onOpenDeleteLeague={() => setShowDeleteModal(true)}
          onHandleCopyInviteCode={handleCopyInviteCode}
          onOpenCreateRunningSessionModal={openCreateRunningSessionModal}
          onOpenRunEntryModal={openRunEntryModal}
          onHandleFinalizeRunningSession={handleFinalizeRunningSession}
          onHandleReviewRun={handleReviewRun}
          onOpenRejectRunModal={openRejectRunModal}
          onHandleReviewSubmission={handleReviewSubmission}
          onOpenRejectSubmissionModal={openRejectSubmissionModal}
          onOpenResolveDisputeModal={openResolveDisputeModal}
          onSelectSubmitResult={setSubmitResultMatch}
          onOpenRescheduleModal={openRescheduleModal}
          reschedulingFixtureId={reschedulingFixtureId}
          onGeneratePlayoffs={handleGeneratePlayoffs}
          generatingPlayoffs={generatingPlayoffs}
          seasons={seasons}
          selectedSeasonId={selectedSeasonId}
          onSeasonChange={setSelectedSeasonId}
          onCreateNewSeason={handleCreateNewSeason}
          creatingNewSeason={creatingNewSeason}
          getMemberNameById={getMemberNameById}
          renderMatchResult={formatMatchResult}
        />
      </main>

      {submitResultMatch && (
        <SubmitResultModal isOpen={true} onClose={() => setSubmitResultMatch(null)} fixtureId={submitResultMatch.id} weekNumber={submitResultMatch.week_number} sportType={league.sport_type} leagueName={league.name}
          sideA={submitResultMatch.participants.filter((participant) => participant.team === "A").map((participant) => ({ userId: participant.user_id, name: participant.name, avatarUrl: members.find((m) => m.user_id === participant.user_id)?.avatar_url }))}
          sideB={submitResultMatch.participants.filter((participant) => participant.team === "B").map((participant) => ({ userId: participant.user_id, name: participant.name, avatarUrl: members.find((m) => m.user_id === participant.user_id)?.avatar_url }))}
          onSuccess={handleSubmitResultSuccess}
        />
      )}
      <CreateSessionModal isOpen={showCreateSessionModal} week={createSessionWeek} distance={createSessionDistance} start={createSessionStart} deadline={createSessionDeadline} creating={creatingSession}
        onWeekChange={setCreateSessionWeek} onDistanceChange={setCreateSessionDistance} onStartChange={setCreateSessionStart} onDeadlineChange={setCreateSessionDeadline}
        onCreate={handleCreateRunningSession} onClose={() => setShowCreateSessionModal(false)} />
      <RunEntryModal isOpen={!!runEntrySession} weekLabel={runEntrySession?.week_number ? `Week ${runEntrySession.week_number}` : "Session"} minutes={runEntryMinutes} seconds={runEntrySeconds} distance={runEntryDistanceMeters}
        submitting={submittingRunSessionId === runEntrySession?.id} onMinutesChange={setRunEntryMinutes} onSecondsChange={setRunEntrySeconds} onDistanceChange={setRunEntryDistanceMeters}
        onSubmit={handleSubmitRun} onClose={() => setRunEntrySession(null)} />
      <RejectModal isOpen={!!rejectSubmissionMatch} title="Reject Submission" reason={rejectSubmissionReason} submitting={reviewingSubmissionId === rejectSubmissionMatch?.latest_submission?.id}
        onReasonChange={setRejectSubmissionReason} onClose={() => setRejectSubmissionMatch(null)} onConfirm={handleSubmitSubmissionRejection} />
      <RejectModal isOpen={!!rejectRunTarget} title="Reject Run" subtitle={rejectRunTarget?.runnerName} reason={rejectRunReason} submitting={reviewingRunId === rejectRunTarget?.runId}
        onReasonChange={setRejectRunReason} onClose={() => setRejectRunTarget(null)} onConfirm={handleSubmitRunRejection} />
      <RescheduleModal
        isOpen={!!rescheduleMatch}
        matchLabel={rescheduleMatch ? `${rescheduleMatch.week_number ? `Week ${rescheduleMatch.week_number}: ` : ""}${formatSideNames(rescheduleMatch, "A")} vs ${formatSideNames(rescheduleMatch, "B")}` : ""}
        submitting={reschedulingFixtureId === rescheduleMatch?.id}
        onClose={() => setRescheduleMatch(null)}
        onConfirm={handleRescheduleFixture}
      />
      <ResolveDisputeModal isOpen={!!resolveMatchTarget} sideALabel={resolveMatchTarget ? formatSideNames(resolveMatchTarget, "A") : "Side A"} sideBLabel={resolveMatchTarget ? formatSideNames(resolveMatchTarget, "B") : "Side B"}
        winner={resolveWinner} reason={resolveReason} resolving={resolvingFixtureId === resolveMatchTarget?.id} onWinnerChange={setResolveWinner} onReasonChange={setResolveReason}
        onResolve={handleResolveDisputedFixture} onClose={() => setResolveMatchTarget(null)} />
      <ManageTeamsModal isOpen={showAssignedTeamsModal} saving={savingAssignedTeams} members={members} drafts={assignedTeamDrafts} error={assignedTeamsError}
        onClose={() => setShowAssignedTeamsModal(false)} onSave={handleSaveAssignedTeams} onAddDraft={addAssignedTeamDraft} onRemoveDraft={removeAssignedTeamDraft}
        onUpdateDraft={updateAssignedTeamDraft} isAssignedSlotTaken={isAssignedSlotTaken} />
      <DeleteLeagueModal isOpen={showDeleteModal} leagueName={league.name} memberCount={members.length} deleting={deleting} onClose={() => setShowDeleteModal(false)} onConfirm={handleDelete} />
      <EmailMembersModal isOpen={showEmailModal && !!league} recipientCount={emailRecipientCount} subject={emailSubject} message={emailMessage} sending={sendingEmail} error={emailError} success={emailSuccess}
        onSubjectChange={setEmailSubject} onMessageChange={setEmailMessage} onSend={handleSendEmail} onClose={closeEmailModal} />
      <InviteModal isOpen={showInviteModal && !!league} emailInput={inviteEmailInput} emails={inviteEmails} sending={sendingInvites} error={inviteError} success={inviteSuccess}
        onEmailInputChange={setInviteEmailInput} onAddEmail={addInviteEmailFromInput} onRemoveEmail={removeInviteEmail} onSend={handleSendInvites} onClose={closeInviteModal} />
    </div>
  );
}
