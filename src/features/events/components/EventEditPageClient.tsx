"use client";

import Link from "next/link";
import LocationAutocomplete from "@/components/LocationAutocomplete";
import {
  SPORT_TYPES,
  useEventEditPage,
} from "@/features/events/hooks/useEventEditPage";

export default function EventEditPageClient() {
  const {
    eventId,
    event,
    loading,
    saving,
    error,
    success,
    title,
    setTitle,
    description,
    setDescription,
    sportType,
    setSportType,
    location,
    setLocation,
    date,
    setDate,
    time,
    setTime,
    maxParticipants,
    setMaxParticipants,
    duration,
    setDuration,
    skillLevel,
    setSkillLevel,
    setCoordinates,
    setLocationName,
    setAddressLine,
    handleSubmit,
  } = useEventEditPage();

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <main className="max-w-2xl mx-auto px-6 py-8 animate-pulse">
          <div className="h-8 w-36 bg-zinc-200 rounded mb-6" />
          <div className="h-10 w-56 bg-zinc-200 rounded mb-8" />
          <div className="bg-white rounded-2xl border border-zinc-200 p-6 space-y-6">
            {[1, 2, 3, 4, 5].map((item) => (
              <div key={`event-edit-skeleton-${item}`}>
                <div className="h-4 w-28 bg-zinc-200 rounded mb-2" />
                <div className="h-12 bg-zinc-100 rounded-xl" />
              </div>
            ))}
          </div>
        </main>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-white">
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <p className="text-zinc-500 mb-4">Event not found</p>
            <Link href="/events" className="text-orange-500 hover:underline font-medium">
              Back to events
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <main className="max-w-2xl mx-auto px-6 py-8">
        <Link href={`/events/${eventId}`} className="inline-flex items-center text-zinc-600 hover:text-orange-500 mb-6 font-medium">
          ← Back to event
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-zinc-900">Edit <span className="text-orange-500">Event</span></h1>
          <p className="text-zinc-500 mt-1">Update your event details</p>
        </div>

        <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden">
          <form onSubmit={handleSubmit} className="p-6">
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
                {error}
              </div>
            )}
            {success && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-xl text-sm">
                Event updated! Redirecting...
              </div>
            )}

            <div className="space-y-6">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-zinc-700 mb-2">Event Title</label>
                <input type="text" id="title" value={title} onChange={(e) => setTitle(e.target.value)} required className="w-full px-4 py-3 border border-zinc-200 rounded-xl bg-zinc-50 text-zinc-900 focus:ring-2 focus:ring-orange-500 focus:border-transparent" />
              </div>

              <div>
                <label htmlFor="sport_type" className="block text-sm font-medium text-zinc-700 mb-2">Sport / Activity</label>
                <select id="sport_type" value={sportType} onChange={(e) => setSportType(e.target.value)} required className="w-full px-4 py-3 border border-zinc-200 rounded-xl bg-zinc-50 text-zinc-900 focus:ring-2 focus:ring-orange-500 focus:border-transparent">
                  <option value="">Select activity</option>
                  {SPORT_TYPES.map((sport) => (
                    <option key={sport} value={sport.toLowerCase()}>
                      {sport}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="location" className="block text-sm font-medium text-zinc-700 mb-2">Event Location</label>
                <LocationAutocomplete
                  value={location}
                  onChange={setLocation}
                  onLocationSelect={(loc) => {
                    setLocation(loc.address);
                    setCoordinates({ lat: loc.lat, lng: loc.lng });
                    setLocationName(loc.locationName);
                    setAddressLine(loc.addressLine);
                  }}
                  placeholder="Search for the event location"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="date" className="block text-sm font-medium text-zinc-700 mb-2">Date</label>
                  <input type="date" id="date" value={date} onChange={(e) => setDate(e.target.value)} required className="w-full px-4 py-3 border border-zinc-200 rounded-xl bg-zinc-50 text-zinc-900 focus:ring-2 focus:ring-orange-500 focus:border-transparent" />
                </div>
                <div>
                  <label htmlFor="time" className="block text-sm font-medium text-zinc-700 mb-2">Time</label>
                  <input type="time" id="time" value={time} onChange={(e) => setTime(e.target.value)} required className="w-full px-4 py-3 border border-zinc-200 rounded-xl bg-zinc-50 text-zinc-900 focus:ring-2 focus:ring-orange-500 focus:border-transparent" />
                </div>
              </div>

              <div>
                <label htmlFor="duration" className="block text-sm font-medium text-zinc-700 mb-2">Duration</label>
                <select id="duration" value={duration} onChange={(e) => setDuration(parseInt(e.target.value))} required className="w-full px-4 py-3 border border-zinc-200 rounded-xl bg-zinc-50 text-zinc-900 focus:ring-2 focus:ring-orange-500 focus:border-transparent">
                  <option value="30">30 min</option>
                  <option value="45">45 min</option>
                  <option value="60">1 hour</option>
                  <option value="90">1.5 hours</option>
                  <option value="120">2 hours</option>
                  <option value="180">3 hours</option>
                  <option value="240">4 hours</option>
                </select>
              </div>

              <div>
                <label htmlFor="skill_level" className="block text-sm font-medium text-zinc-700 mb-2">Skill Level</label>
                <select id="skill_level" value={skillLevel} onChange={(e) => setSkillLevel(e.target.value)} required className="w-full px-4 py-3 border border-zinc-200 rounded-xl bg-zinc-50 text-zinc-900 focus:ring-2 focus:ring-orange-500 focus:border-transparent">
                  <option value="all">All Levels Welcome</option>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>

              <div>
                <label htmlFor="max_participants" className="block text-sm font-medium text-zinc-700 mb-2">Max Participants</label>
                <input type="number" id="max_participants" value={maxParticipants} onChange={(e) => setMaxParticipants(parseInt(e.target.value))} min="2" max="100" required className="w-full px-4 py-3 border border-zinc-200 rounded-xl bg-zinc-50 text-zinc-900 focus:ring-2 focus:ring-orange-500 focus:border-transparent" />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-zinc-700 mb-2">Description (optional)</label>
                <textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={4} className="w-full px-4 py-3 border border-zinc-200 rounded-xl bg-zinc-50 text-zinc-900 focus:ring-2 focus:ring-orange-500 focus:border-transparent" placeholder="Tell people what to expect..." />
              </div>

              <div className="flex gap-4 pt-4">
                <button type="submit" disabled={saving || success} className="flex-1 py-3 bg-orange-500 text-white rounded-full font-bold hover:bg-orange-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                  {saving ? "Saving..." : success ? "Saved!" : "Save Changes"}
                </button>
                <Link href={`/events/${eventId}`} className="px-6 py-3 border border-zinc-300 text-zinc-700 rounded-full font-medium hover:bg-zinc-50 transition-colors text-center">
                  Cancel
                </Link>
              </div>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
