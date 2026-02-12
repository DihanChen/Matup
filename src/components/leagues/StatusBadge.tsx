"use client";

type StatusBadgeProps = {
  status: string;
  label?: string;
};

const STATUS_STYLES: Record<string, string> = {
  scheduled: "bg-blue-50 text-blue-700",
  awaiting_confirmation: "bg-amber-50 text-amber-700",
  completed: "bg-orange-50 text-orange-600",
  disputed: "bg-red-50 text-red-700",
  cancelled: "bg-zinc-100 text-zinc-500",
  open: "bg-emerald-50 text-emerald-700",
  closed: "bg-zinc-100 text-zinc-500",
  finalized: "bg-orange-50 text-orange-600",
  submitted: "bg-amber-50 text-amber-700",
  approved: "bg-emerald-50 text-emerald-700",
  rejected: "bg-red-50 text-red-600",
  pending: "bg-amber-50 text-amber-700",
  accepted: "bg-emerald-50 text-emerald-700",
  expired: "bg-zinc-100 text-zinc-500",
  active: "bg-orange-50 text-orange-600",
  your_match: "bg-orange-50 text-orange-600",
  awaiting_opponent: "bg-amber-50 text-amber-700",
};

export default function StatusBadge({ status, label }: StatusBadgeProps) {
  const style = STATUS_STYLES[status] || "bg-zinc-100 text-zinc-500";
  const displayLabel = label || status.replace(/_/g, " ");
  return (
    <span className={`px-2 py-0.5 text-xs font-medium rounded-full capitalize ${style}`}>
      {displayLabel}
    </span>
  );
}
