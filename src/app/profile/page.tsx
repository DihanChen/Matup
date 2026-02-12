"use client";

import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";
import Image from "next/image";

const ACTIVITIES = [
  { id: "running", label: "Running", icon: "running" },
  { id: "tennis", label: "Tennis", icon: "tennis" },
  { id: "pickleball", label: "Pickleball", icon: "pickleball" },
  { id: "cycling", label: "Cycling", icon: "cycling" },
  { id: "gym", label: "Gym", icon: "gym" },
  { id: "yoga", label: "Yoga", icon: "yoga" },
  { id: "basketball", label: "Basketball", icon: "basketball" },
  { id: "soccer", label: "Soccer", icon: "soccer" },
  { id: "hiking", label: "Hiking", icon: "hiking" },
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

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 3000);
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
      return name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);
    }
    return (user?.email || "").slice(0, 2).toUpperCase();
  };

  const splitName = () => {
    if (!name) return { first: "Your", last: "Profile" };
    const parts = name.trim().split(" ");
    if (parts.length === 1) return { first: parts[0], last: "" };
    return { first: parts.slice(0, -1).join(" "), last: parts[parts.length - 1] };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8 animate-pulse">
          <div className="grid md:grid-cols-[1fr_auto] gap-8">
            <div className="space-y-3">
              <div className="h-12 w-72 bg-zinc-200 rounded-xl" />
              <div className="h-4 w-48 bg-zinc-100 rounded" />
              <div className="h-3 w-36 bg-zinc-100 rounded" />
            </div>
            <div className="w-36 h-36 sm:w-40 sm:h-40 rounded-full bg-zinc-100" />
          </div>
          <div className="rounded-2xl border border-zinc-200 p-6 space-y-4">
            <div className="h-6 w-28 bg-zinc-200 rounded" />
            <div className="h-12 w-full bg-zinc-100 rounded-xl" />
            <div className="h-24 w-full bg-zinc-100 rounded-xl" />
          </div>
          <div className="rounded-2xl border border-zinc-200 p-6 space-y-4">
            <div className="h-6 w-32 bg-zinc-200 rounded" />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[1, 2, 3, 4].map((item) => (
                <div key={`profile-skeleton-activity-${item}`} className="h-14 bg-zinc-100 rounded-xl" />
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  const { first, last } = splitName();

  return (
    <div className="min-h-screen bg-white">
      {/* Toast */}
      {message && (
        <div
          className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-full font-medium shadow-lg transition-all text-sm ${
            message.type === "success"
              ? "bg-zinc-900 text-white"
              : "bg-red-500 text-white"
          }`}
        >
          {message.text}
        </div>
      )}


      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Profile Header */}
        <div className="grid md:grid-cols-[1fr_auto] gap-8 mb-10">
          {/* Left: Name */}
          <div>
            <h1 className="text-4xl sm:text-5xl font-bold mb-2">
              <span className="text-zinc-900">{first} </span>
              <span className="text-orange-500">{last}</span>
            </h1>
            <p className="text-zinc-500 text-sm mb-4">{user?.email}</p>
            <p className="text-zinc-400 text-xs">
              Member since{" "}
              {new Date(user?.created_at || "").toLocaleDateString("en-US", {
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>

          {/* Right: Avatar */}
          <div className="flex flex-col items-center">
            <div className="relative group">
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt="Profile"
                  width={160}
                  height={160}
                  className="w-36 h-36 sm:w-40 sm:h-40 rounded-full object-cover border-4 border-zinc-100"
                />
              ) : (
                <div className="w-36 h-36 sm:w-40 sm:h-40 rounded-full bg-zinc-200 text-zinc-400 text-4xl font-bold flex items-center justify-center border-4 border-zinc-100">
                  {getInitials()}
                </div>
              )}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="absolute bottom-2 right-2 w-10 h-10 bg-white rounded-full shadow-lg border border-zinc-200 flex items-center justify-center hover:scale-110 transition-transform disabled:opacity-50"
                title="Upload photo"
              >
                {uploading ? (
                  <svg className="animate-spin h-4 w-4 text-zinc-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <svg className="w-4 h-4 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
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
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Info */}
          <section className="bg-white rounded-2xl border border-zinc-200 p-6">
            <h2 className="text-lg font-bold text-zinc-900 mb-5">Basic Info</h2>

            <div className="space-y-5">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-zinc-700 mb-2">
                  Display Name
                </label>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 border border-zinc-200 rounded-xl bg-zinc-50 text-zinc-900 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                  placeholder="What should we call you?"
                />
              </div>

              <div>
                <label htmlFor="bio" className="block text-sm font-medium text-zinc-700 mb-2">
                  Bio
                </label>
                <textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 border border-zinc-200 rounded-xl bg-zinc-50 text-zinc-900 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all resize-none"
                  placeholder="Tell others about your fitness journey..."
                />
              </div>
            </div>
          </section>

          {/* Activities */}
          <section className="bg-white rounded-2xl border border-zinc-200 p-6">
            <h2 className="text-lg font-bold text-zinc-900 mb-2">My Activities</h2>
            <p className="text-zinc-500 text-sm mb-5">
              Select the activities you&apos;re interested in
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {ACTIVITIES.map((activity) => {
                const isSelected = selectedActivities.includes(activity.id);
                return (
                  <button
                    key={activity.id}
                    type="button"
                    onClick={() => toggleActivity(activity.id)}
                    className={`p-4 rounded-xl border-2 transition-all text-center ${
                      isSelected
                        ? "border-orange-500 bg-orange-50"
                        : "border-zinc-200 hover:border-zinc-300"
                    }`}
                  >
                    <div className="text-sm font-medium text-zinc-900 mb-0.5">{activity.label}</div>
                    {isSelected && (
                      <div className="text-orange-500 text-xs">Selected</div>
                    )}
                  </button>
                );
              })}
            </div>
          </section>

          {/* Public Profile Link */}
          {user && (
            <div className="flex items-center justify-between bg-zinc-50 rounded-2xl p-5">
              <div>
                <div className="text-sm font-medium text-zinc-900">Public Profile</div>
                <div className="text-xs text-zinc-500">See how others view your profile</div>
              </div>
              <Link
                href={`/users/${user.id}`}
                className="px-4 py-2 text-sm font-medium text-zinc-700 border border-zinc-300 rounded-full hover:bg-white transition-colors"
              >
                View Profile
              </Link>
            </div>
          )}

          {/* Save Button */}
          <button
            type="submit"
            disabled={saving}
            className="w-full py-3.5 bg-zinc-900 text-white rounded-full font-medium text-sm hover:bg-zinc-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "Saving..." : "Save Profile"}
          </button>
        </form>
      </main>
    </div>
  );
}
