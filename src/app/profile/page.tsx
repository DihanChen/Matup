"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";
import Navbar from "@/components/Navbar";
import Image from "next/image";

const ACTIVITIES = [
  { id: "running", label: "Running", icon: "🏃" },
  { id: "tennis", label: "Tennis", icon: "🎾" },
  { id: "cycling", label: "Cycling", icon: "🚴" },
  { id: "gym", label: "Gym", icon: "💪" },
  { id: "yoga", label: "Yoga", icon: "🧘" },
  { id: "basketball", label: "Basketball", icon: "🏀" },
  { id: "soccer", label: "Soccer", icon: "⚽" },
  { id: "swimming", label: "Swimming", icon: "🏊" },
  { id: "hiking", label: "Hiking", icon: "🥾" },
  { id: "boxing", label: "Boxing", icon: "🥊" },
];

export default function ProfilePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [selectedActivities, setSelectedActivities] = useState<string[]>([]);

  // Auto-dismiss message after 3 seconds
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  useEffect(() => {
    const supabase = createClient();

    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      setUser(user);
      setName(user.user_metadata?.name || "");
      setBio(user.user_metadata?.bio || "");
      setAvatarUrl(user.user_metadata?.avatar_url || null);
      setSelectedActivities(user.user_metadata?.activities || []);
      setLoading(false);
    }

    getUser();
  }, [router]);

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith("image/")) {
      setMessage({ type: "error", text: "Please select an image file" });
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setMessage({ type: "error", text: "Image must be less than 2MB" });
      return;
    }

    setUploading(true);
    setMessage(null);

    const supabase = createClient();
    const fileExt = file.name.split(".").pop();
    const fileName = `${user.id}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(fileName, file, { upsert: true });

    if (uploadError) {
      setMessage({ type: "error", text: uploadError.message });
      setUploading(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage
      .from("avatars")
      .getPublicUrl(fileName);

    const { error: updateError } = await supabase.auth.updateUser({
      data: { avatar_url: publicUrl },
    });

    if (updateError) {
      setMessage({ type: "error", text: updateError.message });
      setUploading(false);
      return;
    }

    setAvatarUrl(publicUrl);

    // Sync avatar to profiles table
    await supabase
      .from("profiles")
      .upsert({
        id: user.id,
        name: user.user_metadata?.name || null,
        avatar_url: publicUrl,
      }, { onConflict: "id" });

    setMessage({ type: "success", text: "Photo updated!" });
    setUploading(false);

    const { data: { user: updatedUser } } = await supabase.auth.getUser();
    setUser(updatedUser);
  }

  function toggleActivity(activityId: string) {
    setSelectedActivities((prev) =>
      prev.includes(activityId)
        ? prev.filter((a) => a !== activityId)
        : [...prev, activityId]
    );
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    const supabase = createClient();

    const { error } = await supabase.auth.updateUser({
      data: {
        name,
        bio,
        activities: selectedActivities,
      },
    });

    if (error) {
      setMessage({ type: "error", text: error.message });
      setSaving(false);
      return;
    }

    // Sync to profiles table for public visibility
    const { error: profileError } = await supabase
      .from("profiles")
      .upsert({
        id: user?.id,
        name,
        avatar_url: avatarUrl,
      }, { onConflict: "id" });

    if (profileError) {
      console.error("Error syncing profile:", profileError);
    }

    setMessage({ type: "success", text: "Profile saved!" });
    const { data: { user: updatedUser } } = await supabase.auth.getUser();
    setUser(updatedUser);

    setSaving(false);
  }

  const getInitials = () => {
    if (name) {
      return name
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    return (user?.email || "").slice(0, 2).toUpperCase();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50">
        <Navbar />
        <div className="flex items-center justify-center py-20">
          <div className="text-zinc-500">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fbfbfd]">
      {/* Success/Error Banner */}
      {message && (
        <div
          className={`fixed top-0 left-0 right-0 z-50 px-4 py-3 text-center font-medium shadow-lg transition-all ${
            message.type === "success"
              ? "bg-emerald-500 text-white"
              : "bg-red-500 text-white"
          }`}
        >
          {message.text}
          <button
            onClick={() => setMessage(null)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white"
          >
            ✕
          </button>
        </div>
      )}
      <Navbar />

      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Hero Header */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 p-8 mb-8">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-4 left-10 text-6xl">🏃</div>
            <div className="absolute top-12 right-20 text-5xl">💪</div>
            <div className="absolute bottom-4 left-1/3 text-4xl">🎾</div>
            <div className="absolute bottom-8 right-10 text-5xl">🚴</div>
          </div>

          <div className="relative flex flex-col md:flex-row items-center gap-6">
            {/* Avatar */}
            <div className="relative group">
              <div className="absolute -inset-1 bg-white/30 rounded-full blur group-hover:bg-white/40 transition-all"></div>
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt="Profile"
                  width={120}
                  height={120}
                  className="relative w-28 h-28 md:w-32 md:h-32 rounded-full object-cover border-4 border-white shadow-xl"
                />
              ) : (
                <div className="relative w-28 h-28 md:w-32 md:h-32 rounded-full bg-white/20 backdrop-blur text-white text-3xl font-bold flex items-center justify-center border-4 border-white/50 shadow-xl">
                  {getInitials()}
                </div>
              )}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="absolute bottom-1 right-1 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center hover:scale-110 transition-transform disabled:opacity-50"
                title="Upload photo"
              >
                {uploading ? (
                  <svg className="animate-spin h-5 w-5 text-emerald-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-emerald-600">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
                  </svg>
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
              />
            </div>

            {/* User Info */}
            <div className="text-center md:text-left text-white">
              <h1 className="text-3xl md:text-4xl font-bold mb-2">
                {name || "Fitness Enthusiast"}
              </h1>
              <p className="text-white/80 text-lg mb-3">
                {user?.email}
              </p>
              <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                {selectedActivities.slice(0, 4).map((actId) => {
                  const activity = ACTIVITIES.find((a) => a.id === actId);
                  return activity ? (
                    <span
                      key={actId}
                      className="px-3 py-1 bg-white/20 backdrop-blur rounded-full text-sm font-medium"
                    >
                      {activity.icon} {activity.label}
                    </span>
                  ) : null;
                })}
                {selectedActivities.length > 4 && (
                  <span className="px-3 py-1 bg-white/20 backdrop-blur rounded-full text-sm font-medium">
                    +{selectedActivities.length - 4} more
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="relative mt-8 grid grid-cols-2 gap-4">
            <div className="bg-white/10 backdrop-blur rounded-2xl p-4 text-center text-white">
              <div className="text-3xl font-bold">0</div>
              <div className="text-white/70 text-sm">Events Hosted</div>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-2xl p-4 text-center text-white">
              <div className="text-3xl font-bold">0</div>
              <div className="text-white/70 text-sm">Events Joined</div>
            </div>
          </div>
        </div>


        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info Card */}
          <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm">
            <h2 className="text-xl font-bold text-zinc-900 mb-6 flex items-center gap-2">
              <span className="text-2xl">👤</span> Basic Info
            </h2>

            <div className="space-y-4">
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-zinc-700 mb-2"
                >
                  Display Name
                </label>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 border border-zinc-200 rounded-xl bg-zinc-50 text-zinc-900 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  placeholder="What should we call you?"
                />
              </div>

              <div>
                <label
                  htmlFor="bio"
                  className="block text-sm font-medium text-zinc-700 mb-2"
                >
                  Bio
                </label>
                <textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 border border-zinc-200 rounded-xl bg-zinc-50 text-zinc-900 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  placeholder="Tell others about your fitness journey..."
                />
              </div>
            </div>
          </div>

          {/* Activities Card */}
          <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm">
            <h2 className="text-xl font-bold text-zinc-900 mb-2 flex items-center gap-2">
              <span className="text-2xl">🏆</span> My Activities
            </h2>
            <p className="text-zinc-500 mb-6">
              Select the activities you&apos;re interested in
            </p>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {ACTIVITIES.map((activity) => {
                const isSelected = selectedActivities.includes(activity.id);
                return (
                  <button
                    key={activity.id}
                    type="button"
                    onClick={() => toggleActivity(activity.id)}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      isSelected
                        ? "border-emerald-500 bg-emerald-50"
                        : "border-zinc-200 hover:border-emerald-300"
                    }`}
                  >
                    <div className="text-3xl mb-2">{activity.icon}</div>
                    <div
                      className={`text-sm font-medium ${
                        isSelected
                          ? "text-emerald-700"
                          : "text-zinc-600"
                      }`}
                    >
                      {activity.label}
                    </div>
                    {isSelected && (
                      <div className="text-emerald-500 text-xs mt-1">✓ Selected</div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Save Button */}
          <button
            type="submit"
            disabled={saving}
            className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-bold text-lg hover:from-emerald-600 hover:to-teal-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/25"
          >
            {saving ? "Saving..." : "💾 Save Profile"}
          </button>

          {/* Member Info */}
          <p className="text-center text-zinc-500 text-sm">
            Member since{" "}
            {new Date(user?.created_at || "").toLocaleDateString("en-US", {
              month: "long",
              year: "numeric",
            })}
          </p>
        </form>
      </main>
    </div>
  );
}
