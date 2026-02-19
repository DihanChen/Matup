"use client";

import { useEffect, useState } from "react";
import type { CourtDetail } from "@/features/courts/types";

type CourtEditDetailsModalProps = {
  isOpen: boolean;
  court: CourtDetail;
  onClose: () => void;
  onSubmit: (payload: {
    surface: string | null;
    num_courts: number | null;
    lighting: boolean | null;
    access_type: string | null;
    amenities: string[];
    opening_hours: string | null;
  }) => Promise<void>;
};

const SURFACE_OPTIONS = ["hard", "clay", "grass", "asphalt", "concrete", "other"];
const ACCESS_OPTIONS = ["public", "private", "members only"];
const AMENITY_OPTIONS = ["restrooms", "parking", "water fountain", "benches", "pro shop"];

export default function CourtEditDetailsModal({
  isOpen,
  court,
  onClose,
  onSubmit,
}: CourtEditDetailsModalProps) {
  const [surface, setSurface] = useState<string>(court.surface || "");
  const [numCourts, setNumCourts] = useState<string>(court.num_courts?.toString() || "");
  const [lighting, setLighting] = useState<"yes" | "no" | "unknown">(
    court.lighting === true ? "yes" : court.lighting === false ? "no" : "unknown"
  );
  const [accessType, setAccessType] = useState<string>(court.access_type || "");
  const [amenities, setAmenities] = useState<string[]>(court.amenities || []);
  const [openingHours, setOpeningHours] = useState<string>(court.opening_hours || "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setSurface(court.surface || "");
    setNumCourts(court.num_courts?.toString() || "");
    setLighting(court.lighting === true ? "yes" : court.lighting === false ? "no" : "unknown");
    setAccessType(court.access_type || "");
    setAmenities(court.amenities || []);
    setOpeningHours(court.opening_hours || "");
    setError(null);
  }, [court, isOpen]);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      await onSubmit({
        surface: surface || null,
        num_courts: numCourts.trim() ? Number.parseInt(numCourts, 10) : null,
        lighting: lighting === "yes" ? true : lighting === "no" ? false : null,
        access_type: accessType || null,
        amenities,
        opening_hours: openingHours || null,
      });
      onClose();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Failed to update details");
    } finally {
      setSubmitting(false);
    }
  }

  function toggleAmenity(amenity: string) {
    setAmenities((prev) =>
      prev.includes(amenity) ? prev.filter((item) => item !== amenity) : [...prev, amenity]
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-2xl border border-zinc-200 bg-white p-6">
        <h3 className="text-lg font-bold text-zinc-900">Edit Court Details</h3>
        <p className="mt-1 text-sm text-zinc-500">Help keep this court information accurate.</p>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-700">Surface</label>
            <select
              value={surface}
              onChange={(e) => setSurface(e.target.value)}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="">Unknown</option>
              {SURFACE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-700">Number of Courts</label>
            <input
              type="number"
              min={0}
              value={numCourts}
              onChange={(e) => setNumCourts(e.target.value)}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div>
            <p className="mb-2 text-sm font-medium text-zinc-700">Lighting</p>
            <div className="flex items-center gap-2">
              {[
                { value: "yes", label: "Yes" },
                { value: "no", label: "No" },
                { value: "unknown", label: "Unknown" },
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setLighting(option.value as "yes" | "no" | "unknown")}
                  className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                    lighting === option.value
                      ? "bg-zinc-900 text-white"
                      : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-700">Access Type</label>
            <select
              value={accessType}
              onChange={(e) => setAccessType(e.target.value)}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="">Unknown</option>
              {ACCESS_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div>
            <p className="mb-2 text-sm font-medium text-zinc-700">Amenities</p>
            <div className="grid grid-cols-2 gap-2">
              {AMENITY_OPTIONS.map((amenity) => (
                <label
                  key={amenity}
                  className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
                    amenities.includes(amenity)
                      ? "border-orange-500 bg-orange-50 text-orange-700"
                      : "border-zinc-200 bg-white text-zinc-600"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={amenities.includes(amenity)}
                    onChange={() => toggleAmenity(amenity)}
                    className="rounded border-zinc-300 text-orange-500 focus:ring-orange-500"
                  />
                  <span className="capitalize">{amenity}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-700">Opening Hours</label>
            <input
              type="text"
              value={openingHours}
              onChange={(e) => setOpeningHours(e.target.value)}
              placeholder="e.g. Mon-Fri 8:00-22:00"
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          {error ? (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
          ) : null}

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
