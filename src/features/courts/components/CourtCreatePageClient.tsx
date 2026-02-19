"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import LocationAutocomplete from "@/components/LocationAutocomplete";
import type { CourtCreateFormData } from "@/features/courts/types";
import { createCourt } from "@/lib/queries/courts";
import { createClient } from "@/lib/supabase";

const SPORT_FILTERS = [
  { value: "soccer", label: "Soccer" },
  { value: "tennis", label: "Tennis" },
  { value: "pickleball", label: "Pickleball" },
  { value: "basketball", label: "Basketball" },
  { value: "running", label: "Running" },
  { value: "cycling", label: "Cycling" },
  { value: "gym", label: "Gym" },
  { value: "yoga", label: "Yoga" },
  { value: "hiking", label: "Hiking" },
];

export default function CourtCreatePageClient() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [formData, setFormData] = useState<CourtCreateFormData>({
    name: "",
    description: "",
    address: "",
    coordinates: null,
    sportTypes: [],
    imageUrl: "",
  });

  useEffect(() => {
    const supabase = createClient();

    async function getUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      setUser(user);
    }

    getUser();
  }, [router]);

  function toggleSportType(sportType: string) {
    setFormData((prev) => {
      if (prev.sportTypes.includes(sportType)) {
        return {
          ...prev,
          sportTypes: prev.sportTypes.filter((sport) => sport !== sportType),
        };
      }

      return {
        ...prev,
        sportTypes: [...prev.sportTypes, sportType],
      };
    });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!formData.name.trim()) {
      setError("Court name is required.");
      return;
    }

    if (!formData.address.trim() || !formData.coordinates) {
      setError("Please select a location from the location search.");
      return;
    }

    if (formData.sportTypes.length === 0) {
      setError("Select at least one sport type.");
      return;
    }

    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error: submitError } = await createCourt(supabase, formData);

    if (submitError) {
      setError(submitError.message);
      setLoading(false);
      return;
    }

    setShowSuccess(true);
    setLoading(false);
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-white">
        <main className="max-w-lg mx-auto px-4 sm:px-6 py-8">
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-6 animate-pulse">
            <div className="h-6 w-40 bg-zinc-200 rounded mb-3" />
            <div className="h-4 w-56 bg-zinc-100 rounded" />
          </div>
        </main>
      </div>
    );
  }

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-white">
        <main className="max-w-lg mx-auto px-4 sm:px-6 py-8">
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-6 text-center">
            <h1 className="text-2xl font-bold text-zinc-900 mb-2">Court submitted for review!</h1>
            <p className="text-sm text-zinc-500 mb-6">
              Your submission is now pending approval.
            </p>
            <Link
              href="/events"
              className="inline-block px-5 py-2.5 bg-zinc-900 text-white rounded-full text-sm font-medium hover:bg-zinc-800 transition-colors"
            >
              Back to Explore
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <main className="max-w-lg mx-auto px-4 sm:px-6 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-zinc-900">Submit a Court</h1>
          <p className="text-sm text-zinc-500 mt-1">Share a place where people can play.</p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-2">Court Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="e.g. Riverside Tennis Courts"
              className="w-full px-4 py-2 border border-zinc-300 rounded-lg bg-white text-zinc-900 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-2">Location</label>
            <LocationAutocomplete
              value={formData.address}
              onChange={(value) =>
                setFormData((prev) => ({
                  ...prev,
                  address: value,
                  coordinates: null,
                }))
              }
              onLocationSelect={(location) =>
                setFormData((prev) => ({
                  ...prev,
                  address: location.address,
                  coordinates: { lat: location.lat, lng: location.lng },
                }))
              }
              placeholder="Search for a court address"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-2">Sports</label>
            <div className="grid grid-cols-2 gap-2">
              {SPORT_FILTERS.map((sport) => {
                const checked = formData.sportTypes.includes(sport.value);
                return (
                  <label
                    key={sport.value}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm cursor-pointer transition-colors ${
                      checked
                        ? "border-orange-500 bg-orange-50 text-orange-700"
                        : "border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleSportType(sport.value)}
                      className="rounded border-zinc-300 text-orange-500 focus:ring-orange-500"
                    />
                    <span>{sport.label}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="Court surface, lighting, nets, access details..."
              rows={4}
              className="w-full px-4 py-2 border border-zinc-300 rounded-lg bg-white text-zinc-900 focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-y"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-2">Image URL</label>
            <input
              type="url"
              value={formData.imageUrl}
              onChange={(e) => setFormData((prev) => ({ ...prev, imageUrl: e.target.value }))}
              placeholder="https://example.com/court.jpg"
              className="w-full px-4 py-2 border border-zinc-300 rounded-lg bg-white text-zinc-900 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full px-5 py-3 bg-zinc-900 text-white rounded-xl font-semibold hover:bg-zinc-800 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? "Submitting..." : "Submit Court"}
          </button>
        </form>
      </main>
    </div>
  );
}
