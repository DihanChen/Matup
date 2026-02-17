"use client";

type Props = {
  canProceed: boolean;
  loading: boolean;
  step: number;
  totalSteps: number;
  onNextOrSubmit: () => void;
  onBack: () => void;
};

export default function CreateEventNavigation({
  canProceed,
  loading,
  step,
  totalSteps,
  onNextOrSubmit,
  onBack,
}: Props) {
  return (
    <div className="flex flex-col items-center gap-3 mt-10 max-w-xs mx-auto">
      <button
        type="button"
        onClick={onNextOrSubmit}
        disabled={!canProceed || loading}
        className={`w-full py-3.5 rounded-full font-medium transition-all ${
          canProceed
            ? "bg-zinc-900 text-white hover:bg-zinc-800"
            : "bg-zinc-200 text-zinc-400 cursor-not-allowed"
        } disabled:opacity-50`}
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Creating...
          </span>
        ) : step === totalSteps ? (
          "Ready to Play!"
        ) : (
          "Next"
        )}
      </button>
      {step > 1 && (
        <button
          type="button"
          onClick={onBack}
          className="w-full py-3.5 rounded-full font-medium border border-zinc-300 text-zinc-700 hover:bg-zinc-50 transition-colors"
        >
          Back
        </button>
      )}
    </div>
  );
}
