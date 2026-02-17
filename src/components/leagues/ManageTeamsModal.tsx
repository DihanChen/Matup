"use client";

type MemberOption = {
  user_id: string;
  name: string | null;
};

type TeamDraft = {
  playerAId: string;
  playerBId: string;
};

type ManageTeamsModalProps = {
  isOpen: boolean;
  saving: boolean;
  members: MemberOption[];
  drafts: TeamDraft[];
  error: string | null;
  onClose: () => void;
  onSave: () => void;
  onAddDraft: () => void;
  onRemoveDraft: (index: number) => void;
  onUpdateDraft: (
    index: number,
    field: "playerAId" | "playerBId",
    value: string
  ) => void;
  isAssignedSlotTaken: (
    memberId: string,
    currentIndex: number,
    currentField: "playerAId" | "playerBId"
  ) => boolean;
};

export default function ManageTeamsModal({
  isOpen,
  saving,
  members,
  drafts,
  error,
  onClose,
  onSave,
  onAddDraft,
  onRemoveDraft,
  onUpdateDraft,
  isAssignedSlotTaken,
}: ManageTeamsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold text-zinc-900">Manage Teams</h3>
            <p className="text-sm text-zinc-500">
              Set fixed doubles partners. Each member can be in one team only.
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={saving}
            className="p-1 text-zinc-400 hover:text-zinc-600 rounded-lg"
            aria-label="Close assigned team modal"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-5 h-5"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-3">
          {drafts.map((draft, index) => (
            <div key={`assigned-team-${index}`} className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr_auto] gap-2 items-center">
              <select
                value={draft.playerAId}
                onChange={(event) => onUpdateDraft(index, "playerAId", event.target.value)}
                className="px-3 py-2 border border-zinc-200 rounded-xl bg-zinc-50 text-sm text-zinc-900"
              >
                <option value="">Select member</option>
                {members.map((member) => (
                  <option
                    key={`a-${index}-${member.user_id}`}
                    value={member.user_id}
                    disabled={isAssignedSlotTaken(member.user_id, index, "playerAId")}
                  >
                    {member.name || "Anonymous"}
                  </option>
                ))}
              </select>
              <span className="text-xs text-zinc-400 text-center">+</span>
              <select
                value={draft.playerBId}
                onChange={(event) => onUpdateDraft(index, "playerBId", event.target.value)}
                className="px-3 py-2 border border-zinc-200 rounded-xl bg-zinc-50 text-sm text-zinc-900"
              >
                <option value="">Select member</option>
                {members.map((member) => (
                  <option
                    key={`b-${index}-${member.user_id}`}
                    value={member.user_id}
                    disabled={isAssignedSlotTaken(member.user_id, index, "playerBId")}
                  >
                    {member.name || "Anonymous"}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => onRemoveDraft(index)}
                disabled={saving}
                className="px-2 py-2 border border-zinc-200 rounded-xl text-xs font-medium text-zinc-600 hover:bg-zinc-50"
              >
                Remove
              </button>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={onAddDraft}
          disabled={saving}
          className="mt-3 px-3 py-2 border border-zinc-200 rounded-xl text-sm font-medium text-zinc-700 hover:bg-zinc-50"
        >
          Add Team
        </button>

        {error && <p className="text-sm text-red-500 mt-3">{error}</p>}

        <div className="flex flex-col-reverse sm:flex-row gap-3 mt-6">
          <button
            onClick={onSave}
            disabled={saving}
            className="flex-1 py-3 bg-zinc-900 text-white rounded-full font-medium hover:bg-zinc-800 transition-colors disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Teams"}
          </button>
          <button
            onClick={onClose}
            disabled={saving}
            className="flex-1 py-3 border border-zinc-200 text-zinc-700 rounded-full font-medium hover:bg-zinc-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
