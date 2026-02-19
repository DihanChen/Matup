"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import type { User } from "@supabase/supabase-js";
import CourtEditDetailsModal from "@/features/courts/components/detail/CourtEditDetailsModal";
import CourtReviewsSection from "@/features/courts/components/detail/CourtReviewsSection";
import WriteReviewModal from "@/features/courts/components/detail/WriteReviewModal";
import { OSM_COURTS_SESSION_KEY } from "@/features/courts/constants";
import type { CourtDetail, CourtReview } from "@/features/courts/types";
import { haversineDistance } from "@/lib/geo";
import { getApiBaseUrl } from "@/lib/api";
import { getCourtById, getCourtReviews } from "@/lib/queries/court-detail";
import { submitCourtReview } from "@/lib/queries/court-reviews";
import { createClient } from "@/lib/supabase";

const COVER_FALLBACKS: Record<string, string> = {
  soccer: "/covers/soccer.jpg",
  tennis: "/covers/tennis.jpg",
  pickleball: "/covers/pickleball.jpg",
  basketball: "/covers/basketball.jpg",
  running: "/covers/running.jpg",
  cycling: "/covers/cycling.jpg",
  gym: "/covers/gym.jpg",
  yoga: "/covers/yoga.jpg",
  hiking: "/covers/hiking.jpg",
};

type OSMImportPayload = {
  osm_id: number;
  osm_type: string;
  name: string;
  latitude: number;
  longitude: number;
  sport_types: string[];
  surface: string | null;
  address: string;
};

type ReviewRow = {
  id: string;
  court_id: string;
  user_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  profiles?: { name?: string | null; avatar_url?: string | null } | Array<{ name?: string | null; avatar_url?: string | null }> | null;
};

function normalizeCourt(rawCourt: Record<string, unknown>): CourtDetail {
  const parsedOsmId =
    typeof rawCourt.osm_id === "number"
      ? rawCourt.osm_id
      : typeof rawCourt.osm_id === "string"
        ? Number.parseInt(rawCourt.osm_id, 10)
        : null;
  const parsedAverageRating =
    typeof rawCourt.average_rating === "number"
      ? rawCourt.average_rating
      : typeof rawCourt.average_rating === "string"
        ? Number.parseFloat(rawCourt.average_rating)
        : 0;

  return {
    ...(rawCourt as CourtDetail),
    osm_id: Number.isFinite(parsedOsmId) ? parsedOsmId : null,
    source: typeof rawCourt.source === "string" ? rawCourt.source : "user",
    surface: typeof rawCourt.surface === "string" ? rawCourt.surface : null,
    num_courts: typeof rawCourt.num_courts === "number" ? rawCourt.num_courts : null,
    lighting: typeof rawCourt.lighting === "boolean" ? rawCourt.lighting : null,
    access_type: typeof rawCourt.access_type === "string" ? rawCourt.access_type : null,
    amenities: Array.isArray(rawCourt.amenities) ? (rawCourt.amenities as string[]) : [],
    operator: typeof rawCourt.operator === "string" ? rawCourt.operator : null,
    opening_hours: typeof rawCourt.opening_hours === "string" ? rawCourt.opening_hours : null,
    average_rating: Number.isFinite(parsedAverageRating) ? parsedAverageRating : 0,
    review_count: typeof rawCourt.review_count === "number" ? rawCourt.review_count : 0,
  };
}

function normalizeReviews(rows: unknown[] | null): CourtReview[] {
  if (!rows) return [];

  return rows.map((row) => {
    const reviewRow = row as ReviewRow;
    const profile = Array.isArray(reviewRow.profiles) ? reviewRow.profiles[0] : reviewRow.profiles;

    return {
      id: reviewRow.id,
      court_id: reviewRow.court_id,
      user_id: reviewRow.user_id,
      rating: reviewRow.rating,
      comment: reviewRow.comment,
      created_at: reviewRow.created_at,
      user_name: profile?.name || null,
      user_avatar: profile?.avatar_url || null,
    };
  });
}

function parseOsmId(courtId: string): number | null {
  const raw = courtId.replace(/^osm-/, "");
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export default function CourtDetailPageClient() {
  const params = useParams();
  const router = useRouter();
  const courtId = params.id as string;

  const [court, setCourt] = useState<CourtDetail | null>(null);
  const [reviews, setReviews] = useState<CourtReview[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showWriteReviewModal, setShowWriteReviewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [distance, setDistance] = useState<number | null>(null);

  const importAttemptedRef = useRef(false);

  const hasReviewed = useMemo(() => {
    if (!user) return false;
    return reviews.some((review) => review.user_id === user.id);
  }, [reviews, user]);

  async function loadCourtData(id: string) {
    const supabase = createClient();
    const [{ data: userData }, courtData, reviewRows] = await Promise.all([
      supabase.auth.getUser(),
      getCourtById(supabase, id),
      getCourtReviews(supabase, id),
    ]);

    setUser(userData.user);

    if (!courtData) {
      setError("Court not found");
      setLoading(false);
      return;
    }

    setCourt(normalizeCourt(courtData as Record<string, unknown>));
    setReviews(normalizeReviews(reviewRows as unknown[] | null));
    setLoading(false);
  }

  useEffect(() => {
    async function hydrate() {
      if (!courtId) return;

      setLoading(true);
      setError(null);

      if (courtId.startsWith("osm-")) {
        if (importAttemptedRef.current) return;
        importAttemptedRef.current = true;

        const osmId = parseOsmId(courtId);
        if (!osmId) {
          setError("Invalid OSM court id");
          setLoading(false);
          return;
        }

        const supabase = createClient();
        const [{ data: sessionData }, { data: userData }] = await Promise.all([
          supabase.auth.getSession(),
          supabase.auth.getUser(),
        ]);
        setUser(userData.user);

        if (!sessionData.session?.access_token) {
          setError("Please log in to open this court detail page.");
          setLoading(false);
          return;
        }

        const cacheRaw = window.sessionStorage.getItem(OSM_COURTS_SESSION_KEY);
        if (!cacheRaw) {
          setError("Court data expired. Please reopen this court from the explore map.");
          setLoading(false);
          return;
        }

        let payloadMap: Record<string, OSMImportPayload> = {};
        try {
          payloadMap = JSON.parse(cacheRaw) as Record<string, OSMImportPayload>;
        } catch {
          setError("Court data could not be loaded. Please try again from explore.");
          setLoading(false);
          return;
        }

        const payload = payloadMap[`osm-${osmId}`];
        if (!payload) {
          setError("Court data was not found in your current session. Please try again from explore.");
          setLoading(false);
          return;
        }

        try {
          const response = await fetch(`${getApiBaseUrl()}/api/courts/osm/import`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${sessionData.session.access_token}`,
            },
            body: JSON.stringify(payload),
          });

          const body = (await response.json()) as { court?: { id?: string }; error?: string };
          if (!response.ok || !body.court?.id) {
            setError(body.error || "Failed to import OSM court");
            setLoading(false);
            return;
          }

          router.replace(`/courts/${body.court.id}`);
        } catch (requestError) {
          setError(requestError instanceof Error ? requestError.message : "Failed to import OSM court");
          setLoading(false);
        }

        return;
      }

      if (!isUuid(courtId)) {
        setError("Invalid court id");
        setLoading(false);
        return;
      }

      await loadCourtData(courtId);
    }

    hydrate();
  }, [courtId, router]);

  useEffect(() => {
    if (!court || !navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setDistance(
          haversineDistance(
            position.coords.latitude,
            position.coords.longitude,
            court.latitude,
            court.longitude
          )
        );
      },
      () => {
        setDistance(null);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [court]);

  async function handleSubmitReview(rating: number, comment: string) {
    if (!court || !user) {
      throw new Error("You must be logged in to review.");
    }

    const supabase = createClient();
    const { error: submitError } = await submitCourtReview(
      supabase,
      court.id,
      user.id,
      rating,
      comment.trim() ? comment.trim() : null
    );

    if (submitError) {
      throw new Error(submitError.message);
    }

    await loadCourtData(court.id);
  }

  async function handleUpdateDetails(payload: {
    surface: string | null;
    num_courts: number | null;
    lighting: boolean | null;
    access_type: string | null;
    amenities: string[];
    opening_hours: string | null;
  }) {
    if (!court) {
      throw new Error("Court data is unavailable.");
    }

    const supabase = createClient();
    const { data } = await supabase.auth.getSession();
    const accessToken = data.session?.access_token;

    if (!accessToken) {
      throw new Error("You must be logged in to edit court details.");
    }

    const response = await fetch(`${getApiBaseUrl()}/api/courts/${court.id}/details`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(payload),
    });

    const body = (await response.json()) as { error?: string };
    if (!response.ok) {
      throw new Error(body.error || "Failed to update court details.");
    }

    await loadCourtData(court.id);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <main className="mx-auto max-w-6xl px-6 py-8 animate-pulse">
          <div className="grid gap-8 md:grid-cols-5">
            <div className="space-y-6 md:col-span-3">
              <div className="h-72 rounded-2xl bg-zinc-100" />
              <div className="h-56 rounded-2xl bg-zinc-100" />
            </div>
            <div className="space-y-6 md:col-span-2">
              <div className="h-56 rounded-2xl bg-zinc-100" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error || !court) {
    return (
      <div className="min-h-screen bg-white">
        <div className="mx-auto max-w-2xl px-6 py-20 text-center">
          <p className="text-zinc-500">{error || "Court not found."}</p>
          <Link href="/events" className="mt-4 inline-block text-sm font-medium text-orange-500 hover:underline">
            Back to explore
          </Link>
        </div>
      </div>
    );
  }

  const primarySport = court.sport_types[0] || "gym";
  const fallbackCover = COVER_FALLBACKS[primarySport] || "/covers/gym.jpg";
  const cover = court.image_url || fallbackCover;
  const directionsUrl = `https://www.google.com/maps/search/?api=1&query=${court.latitude},${court.longitude}`;

  return (
    <div className="min-h-screen bg-white">
      <main className="mx-auto max-w-6xl px-6 py-8">
        <div className="grid gap-8 md:grid-cols-5">
          <div className="space-y-6 md:col-span-3">
            <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white">
              <div className="relative h-[280px] bg-zinc-100 md:h-[340px]">
                <Image src={cover} alt={court.name} fill className="object-cover" />
              </div>

              <div className="p-6">
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  {court.sport_types.map((sport) => (
                    <span
                      key={`${court.id}-${sport}`}
                      className="rounded-full bg-orange-100 px-3 py-1 text-sm font-medium capitalize text-orange-700"
                    >
                      {sport}
                    </span>
                  ))}
                </div>

                <h1 className="text-2xl font-bold text-zinc-900 md:text-3xl">{court.name}</h1>
                <p className="mt-1 text-sm text-zinc-500">{court.address}</p>

                <div className="mt-6 grid grid-cols-1 gap-4 border-t border-zinc-100 pt-5 sm:grid-cols-2">
                  <div>
                    <p className="text-[11px] font-medium uppercase tracking-widest text-zinc-400">Surface</p>
                    <p className="mt-1 text-sm font-semibold capitalize text-zinc-900">{court.surface || "Unknown"}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-medium uppercase tracking-widest text-zinc-400">Number Of Courts</p>
                    <p className="mt-1 text-sm font-semibold text-zinc-900">{court.num_courts ?? "Unknown"}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-medium uppercase tracking-widest text-zinc-400">Lighting</p>
                    <p className="mt-1 text-sm font-semibold text-zinc-900">
                      {court.lighting === true ? "Yes" : court.lighting === false ? "No" : "Unknown"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] font-medium uppercase tracking-widest text-zinc-400">Access Type</p>
                    <p className="mt-1 text-sm font-semibold capitalize text-zinc-900">{court.access_type || "Unknown"}</p>
                  </div>
                  <div className="sm:col-span-2">
                    <p className="text-[11px] font-medium uppercase tracking-widest text-zinc-400">Operating Hours</p>
                    <p className="mt-1 text-sm font-semibold text-zinc-900">{court.opening_hours || "Unknown"}</p>
                  </div>
                </div>

                {court.description ? (
                  <div className="mt-6 border-t border-zinc-100 pt-5">
                    <h2 className="text-lg font-bold text-zinc-900">Description</h2>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-zinc-600">{court.description}</p>
                  </div>
                ) : null}
              </div>
            </section>

            <CourtReviewsSection
              averageRating={court.average_rating}
              reviewCount={court.review_count}
              reviews={reviews}
              canWriteReview={Boolean(user) && !hasReviewed}
              onOpenWriteReview={() => setShowWriteReviewModal(true)}
            />
          </div>

          <aside className="space-y-6 md:col-span-2">
            <section className="rounded-2xl border border-zinc-200 bg-white p-5">
              <h3 className="text-lg font-bold text-zinc-900">Quick Stats</h3>
              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-zinc-500">Rating</span>
                  <span className="inline-flex items-center gap-1 font-semibold text-zinc-900">
                    <svg viewBox="0 0 24 24" className="h-4 w-4 text-orange-500" fill="currentColor">
                      <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                    </svg>
                    {court.average_rating.toFixed(1)} / 5
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-zinc-500">Reviews</span>
                  <span className="font-semibold text-zinc-900">{court.review_count}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-zinc-500">Distance</span>
                  <span className="font-semibold text-zinc-900">
                    {distance !== null ? `${distance.toFixed(1)} km` : "Unavailable"}
                  </span>
                </div>
              </div>

              <div className="mt-5 space-y-2">
                <button
                  type="button"
                  onClick={() => setShowEditModal(true)}
                  className="w-full rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
                >
                  Edit Details
                </button>
                <a
                  href={directionsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex w-full items-center justify-center rounded-full bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-200"
                >
                  Get Directions
                </a>
              </div>
            </section>

            {court.source === "osm" ? (
              <section className="rounded-2xl border border-zinc-200 bg-zinc-50 p-5 text-sm text-zinc-600">
                Data from{" "}
                <a
                  href="https://www.openstreetmap.org/copyright"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-orange-500 hover:underline"
                >
                  OpenStreetMap contributors
                </a>
              </section>
            ) : null}
          </aside>
        </div>
      </main>

      <WriteReviewModal
        isOpen={showWriteReviewModal}
        onClose={() => setShowWriteReviewModal(false)}
        onSubmit={handleSubmitReview}
      />

      <CourtEditDetailsModal
        isOpen={showEditModal}
        court={court}
        onClose={() => setShowEditModal(false)}
        onSubmit={handleUpdateDetails}
      />
    </div>
  );
}
