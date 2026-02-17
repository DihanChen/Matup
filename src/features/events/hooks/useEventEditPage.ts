"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

const SPORT_TYPES = [
  "Running",
  "Tennis",
  "Pickleball",
  "Cycling",
  "Gym",
  "Yoga",
  "Basketball",
  "Soccer",
  "Hiking",
  "Other",
];

type Event = {
  id: string;
  title: string;
  description: string | null;
  sport_type: string;
  location: string;
  datetime: string;
  duration: number;
  max_participants: number;
  creator_id: string;
  latitude: number | null;
  longitude: number | null;
  skill_level: string;
};

export function useEventEditPage() {
  const router = useRouter();
  const params = useParams();
  const eventId = params.id as string;

  const [user, setUser] = useState<User | null>(null);
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Form fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [sportType, setSportType] = useState("");
  const [location, setLocation] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [maxParticipants, setMaxParticipants] = useState(10);
  const [duration, setDuration] = useState(60);
  const [skillLevel, setSkillLevel] = useState("all");
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [locationName, setLocationName] = useState("");
  const [addressLine, setAddressLine] = useState("");

  useEffect(() => {
    const supabase = createClient();

    async function fetchData() {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      setUser(user);

      // Get event
      const { data: eventData, error: eventError } = await supabase
        .from("events")
        .select("*")
        .eq("id", eventId)
        .single();

      if (eventError || !eventData) {
        setError("Event not found");
        setLoading(false);
        return;
      }

      // Check if user is the creator
      if (eventData.creator_id !== user.id) {
        router.push(`/events/${eventId}`);
        return;
      }

      // Check if event is in the past
      if (new Date(eventData.datetime) < new Date()) {
        router.push(`/events/${eventId}`);
        return;
      }

      setEvent(eventData);

      // Populate form fields
      setTitle(eventData.title);
      setDescription(eventData.description || "");
      setSportType(eventData.sport_type);
      setLocation(eventData.location);
      setMaxParticipants(eventData.max_participants);
      setDuration(eventData.duration || 60);
      setSkillLevel(eventData.skill_level || "all");

      // Parse datetime
      const dt = new Date(eventData.datetime);
      setDate(dt.toISOString().split("T")[0]);
      setTime(dt.toTimeString().slice(0, 5));

      // Load existing coordinates
      if (eventData.latitude && eventData.longitude) {
        setCoordinates({ lat: eventData.latitude, lng: eventData.longitude });
      }

      setLoading(false);
    }

    fetchData();
  }, [eventId, router]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    const datetime = new Date(`${date}T${time}`).toISOString();

    const supabase = createClient();

    const { error } = await supabase
      .from("events")
      .update({
        title,
        description: description || null,
        sport_type: sportType,
        location,
        datetime,
        duration,
        skill_level: skillLevel,
        max_participants: maxParticipants,
        latitude: coordinates?.lat || null,
        longitude: coordinates?.lng || null,
        location_name: locationName || location.split(",")[0]?.trim() || null,
        address_line: addressLine || null,
      })
      .eq("id", eventId)
      .eq("creator_id", user?.id);

    if (error) {
      setError(error.message);
      setSaving(false);
      return;
    }

    setSuccess(true);
    setSaving(false);

    // Redirect after short delay
    setTimeout(() => {
      router.push(`/events/${eventId}`);
    }, 1500);
  }

  return {
    eventId,
    user,
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
    coordinates,
    setCoordinates,
    locationName,
    setLocationName,
    addressLine,
    setAddressLine,
    handleSubmit,
  };
}

export { SPORT_TYPES };
export type UseEventEditPageData = ReturnType<typeof useEventEditPage>;
