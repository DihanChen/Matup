"use client";

interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
  onStepClick?: (step: number) => void;
}

const STEP_LABELS = ['Select Sport', 'Select Location & Time', 'Almost there'];

export default function StepIndicator({ currentStep, totalSteps }: StepIndicatorProps) {
  const progress = ((currentStep - 1) / (totalSteps - 1)) * 100;

  return (
    <div className="mb-6 sm:mb-8">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between mb-3">
        <span className="text-xs sm:text-sm font-medium text-zinc-500">
          Step <span className="text-orange-500 font-bold">{String(currentStep).padStart(2, '0')}</span> / {String(totalSteps).padStart(2, '0')}
        </span>
        <span className="text-xs sm:text-sm font-medium text-zinc-900">
          {STEP_LABELS[currentStep - 1]}
        </span>
      </div>
      <div className="h-1 bg-zinc-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-orange-500 rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

export function StepLabel({ step }: { step: number }) {
  const labels: Record<number, { text: string; highlight: string; lineBreak?: boolean }> = {
    1: { text: 'What are we ', highlight: 'playing today?', lineBreak: true },
    2: { text: 'When & ', highlight: 'Where' },
    3: { text: 'How many ', highlight: 'buddies?' },
  };
  const label = labels[step] || { text: '', highlight: '' };

  return (
    <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-zinc-900 text-center mb-8 sm:mb-10">
      {label.text}{label.lineBreak && <br />}<span className="text-orange-500">{label.highlight}</span>
    </h1>
  );
}
