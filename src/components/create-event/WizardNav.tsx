"use client";

interface WizardNavProps {
  currentStep: number;
  totalSteps: number;
  canProceed: boolean;
  loading?: boolean;
  onBack: () => void;
  onNext: () => void;
  onSubmit: () => void;
}

export default function WizardNav({
  currentStep,
  totalSteps,
  canProceed,
  loading,
  onBack,
  onNext,
  onSubmit
}: WizardNavProps) {
  const isLastStep = currentStep === totalSteps;

  return (
    <div className="flex gap-4 mt-8">
      {currentStep > 1 && (
        <button
          type="button"
          onClick={onBack}
          disabled={loading}
          className="px-6 py-3 border border-zinc-300 text-zinc-700 rounded-xl font-medium hover:border-zinc-400 hover:bg-zinc-50 transition-all disabled:opacity-50"
        >
          Back
        </button>
      )}

      <button
        type="button"
        onClick={isLastStep ? onSubmit : onNext}
        disabled={!canProceed || loading}
        className={`
          flex-1 py-3 rounded-xl font-medium transition-all
          ${canProceed
            ? 'bg-emerald-500 text-white hover:bg-emerald-600 hover:shadow-lg'
            : 'bg-zinc-200 text-zinc-400 cursor-not-allowed'
          }
          disabled:opacity-50 disabled:cursor-not-allowed
        `}
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Creating...
          </span>
        ) : isLastStep ? (
          'Create Event'
        ) : (
          <span className="flex items-center justify-center gap-2">
            Next
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </span>
        )}
      </button>
    </div>
  );
}
