"use client";

import Link from "next/link";
import SubmitResultModal from "@/components/leagues/SubmitResultModal";
import CreateSessionModal from "@/components/leagues/CreateSessionModal";
import DeleteLeagueModal from "@/components/leagues/DeleteLeagueModal";
import EmailMembersModal from "@/components/leagues/EmailMembersModal";
import InviteModal from "@/components/leagues/InviteModal";
import ManageTeamsModal from "@/components/leagues/ManageTeamsModal";
import RejectModal from "@/components/leagues/RejectModal";
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
    openResolveDisputeModal,
    handleResolveDisputedFixture,
    handleJoin,
    handleLeave,
    handleDelete,
    openEmailModal,
    closeEmailModal,
    handleSendEmail,
  } = useLeagueDetailPage();

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10 animate-pulse">
          <div className="h-10 w-60 bg-zinc-200 rounded-xl mb-6" />
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              {[1, 2, 3].map((item) => (
                <div key={`league-detail-skeleton-main-${item}`} className="rounded-2xl border border-zinc-200 p-6">
                  <div className="h-5 w-36 bg-zinc-200 rounded mb-4" />
                  <div className="space-y-2">
                    <div className="h-4 w-full bg-zinc-100 rounded" />
                    <div className="h-4 w-5/6 bg-zinc-100 rounded" />
                    <div className="h-4 w-3/5 bg-zinc-100 rounded" />
                  </div>
                </div>
              ))}
            </div>
            <div className="space-y-4">
              {[1, 2, 3].map((item) => (
                <div key={`league-detail-skeleton-side-${item}`} className="rounded-2xl border border-zinc-200 p-6">
                  <div className="h-4 w-24 bg-zinc-200 rounded mb-3" />
                  <div className="space-y-2">
                    <div className="h-3 w-full bg-zinc-100 rounded" />
                    <div className="h-3 w-4/5 bg-zinc-100 rounded" />
                    <div className="h-3 w-2/3 bg-zinc-100 rounded" />
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
      <div className="min-h-screen bg-white">
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="text-6xl mb-4">😕</div>
            <p className="text-zinc-500 mb-4">{error || "League not found"}</p>
            <Link href="/leagues" className="text-orange-500 hover:underline font-medium">
              Back to leagues
            </Link>
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
      const sideANames = teamA.map((p) => p.name || "?").join(" & ");
      const sideBNames = teamB.map((p) => p.name || "?").join(" & ");
      const setScores = teamA[0]?.set_scores;
      if (setScores && setScores.sets && setScores.sets.length > 0) {
        return (
          <div className="text-sm">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`font-medium break-words ${match.winner === "A" ? "text-orange-500" : "text-zinc-900"}`}>{sideANames}</span>
              <span className="text-zinc-400">vs</span>
              <span className={`font-medium break-words ${match.winner === "B" ? "text-orange-500" : "text-zinc-900"}`}>{sideBNames}</span>
            </div>
            <div className="text-xs text-zinc-500 mt-1">{setScores.sets.map((s) => `${s[0]}-${s[1]}`).join(", ")}</div>
          </div>
        );
      }
      return (
        <div className="text-sm flex flex-wrap items-center gap-2">
          <span className={`font-medium break-words ${match.winner === "A" ? "text-orange-500" : "text-zinc-900"}`}>{sideANames}</span>
          <span className="text-zinc-400">vs</span>
          <span className={`font-medium break-words ${match.winner === "B" ? "text-orange-500" : "text-zinc-900"}`}>{sideBNames}</span>
        </div>
      );
    }
    if (fmt === "team_vs_team") {
      const teamA = match.participants.filter((p) => p.team === "A");
      const teamB = match.participants.filter((p) => p.team === "B");
      return (
        <div className="text-sm break-words">
          <span className="font-medium text-zinc-900">Team A ({teamA.map((p) => p.name || "?").join(", ")})</span>
          <span className="mx-2 font-bold text-orange-500">{teamA[0]?.score ?? 0} - {teamB[0]?.score ?? 0}</span>
          <span className="font-medium text-zinc-900">Team B ({teamB.map((p) => p.name || "?").join(", ")})</span>
        </div>
      );
    }
    return null;
  }

  return (
    <div className="min-h-screen bg-white">
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <Link href="/leagues" className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 hover:border-zinc-300 transition-colors text-sm font-medium mb-4 sm:mb-6">
          <span className="text-zinc-500">←</span>
          <span>Back to leagues</span>
        </Link>

        {successMessage && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-700 flex items-center gap-2">
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
          completedMatches={completedMatches}
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
          getMemberNameById={getMemberNameById}
          renderMatchResult={formatMatchResult}
        />
      </main>

      {submitResultMatch && (
        <SubmitResultModal isOpen={true} onClose={() => setSubmitResultMatch(null)} fixtureId={submitResultMatch.id} weekNumber={submitResultMatch.week_number} sportType={league.sport_type}
          sideA={submitResultMatch.participants.filter((participant) => participant.team === "A").map((participant) => ({ userId: participant.user_id, name: participant.name }))}
          sideB={submitResultMatch.participants.filter((participant) => participant.team === "B").map((participant) => ({ userId: participant.user_id, name: participant.name }))}
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
