"use client";

import type { CourtReview } from "@/features/courts/types";

type CourtReviewsSectionProps = {
  averageRating: number;
  reviewCount: number;
  reviews: CourtReview[];
  canWriteReview: boolean;
  onOpenWriteReview: () => void;
};

function Star({ filled }: { filled: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`h-4 w-4 ${filled ? "text-orange-500" : "text-zinc-300"}`}
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
    </svg>
  );
}

function renderStars(value: number) {
  const rounded = Math.round(value);
  return [1, 2, 3, 4, 5].map((star) => <Star key={star} filled={star <= rounded} />);
}

export default function CourtReviewsSection({
  averageRating,
  reviewCount,
  reviews,
  canWriteReview,
  onOpenWriteReview,
}: CourtReviewsSectionProps) {
  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-zinc-900">Reviews</h2>
          <div className="mt-2 flex items-center gap-2">
            <div className="flex items-center">{renderStars(averageRating)}</div>
            <span className="text-sm font-semibold text-zinc-700">{averageRating.toFixed(1)}</span>
            <span className="text-sm text-zinc-500">({reviewCount} reviews)</span>
          </div>
        </div>
        {canWriteReview ? (
          <button
            type="button"
            onClick={onOpenWriteReview}
            className="rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
          >
            Write a Review
          </button>
        ) : null}
      </div>

      <div className="mt-6 space-y-3">
        {reviews.length === 0 ? (
          <div className="rounded-xl bg-zinc-50 px-4 py-5 text-sm text-zinc-500">
            No reviews yet. Be the first to share feedback.
          </div>
        ) : (
          reviews.map((review) => (
            <article key={review.id} className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold text-zinc-900">{review.user_name || "Anonymous"}</p>
                <p className="text-xs text-zinc-400">
                  {new Date(review.created_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              </div>
              <div className="mt-2 flex items-center">{renderStars(review.rating)}</div>
              {review.comment ? <p className="mt-2 text-sm text-zinc-600">{review.comment}</p> : null}
            </article>
          ))
        )}
      </div>
    </section>
  );
}
