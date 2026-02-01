"use client";

interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
  onStepClick?: (step: number) => void;
}

const STEP_LABELS = ['Activity', 'When', 'Where', 'Details'];

export default function StepIndicator({ currentStep, totalSteps, onStepClick }: StepIndicatorProps) {
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {Array.from({ length: totalSteps }, (_, i) => {
        const stepNum = i + 1;
        const isCompleted = stepNum < currentStep;
        const isCurrent = stepNum === currentStep;
        const isClickable = onStepClick && stepNum < currentStep;

        return (
          <div key={stepNum} className="flex items-center">
            <button
              type="button"
              onClick={() => isClickable && onStepClick(stepNum)}
              disabled={!isClickable}
              className={`
                w-10 h-10 rounded-full flex items-center justify-center font-medium text-sm
                transition-all duration-200
                ${isCompleted
                  ? 'bg-emerald-500 text-white cursor-pointer hover:bg-emerald-600'
                  : isCurrent
                    ? 'bg-emerald-500 text-white ring-4 ring-emerald-100'
                    : 'bg-zinc-200 text-zinc-400'
                }
                ${isClickable ? 'hover:scale-110' : ''}
              `}
            >
              {isCompleted ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                stepNum
              )}
            </button>
            {stepNum < totalSteps && (
              <div
                className={`
                  w-8 h-1 mx-1 rounded-full transition-colors duration-200
                  ${stepNum < currentStep ? 'bg-emerald-500' : 'bg-zinc-200'}
                `}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

export function StepLabel({ step }: { step: number }) {
  return (
    <h2 className="text-2xl font-bold text-zinc-900 text-center mb-6">
      {STEP_LABELS[step - 1]}
    </h2>
  );
}
