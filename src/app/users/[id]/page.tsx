"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import EventCard from "@/components/EventCard";
import { createClient } from "@/lib/supabase";

type Profile = {
  id: string;
  name: string | null;
  avatar_url: string | null;
  is_premium?: boolean;
  bio?: string | null;
  gallery_urls?: string[];
};

type Event = {
  id: string;
  title: string;
  sport_type: string;
  datetime: string;
  location: string;
  max_participants: number;
  skill_level?: string;
  creator_id?: string;
  cover_url?: string | null;
  participant_count?: number;
};

type Badge = {
  icon: string;
  label: string;
  description: string;
  color: string;
};

type Toast = {
  type: "success" | "error";
  text: string;
};

const MAX_GALLERY_IMAGES = 9;
const MAX_GALLERY_UPLOAD_BATCH = 4;
const MAX_AVATAR_FILE_SIZE_BYTES = 2 * 1024 * 1024;
const MAX_GALLERY_FILE_SIZE_BYTES = 3 * 1024 * 1024;
const ALLOWED_IMAGE_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

function isAllowedImageType(file: File) {
  return ALLOWED_IMAGE_MIME_TYPES.has(file.type);
}

function getInitials(name: string | null) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function splitName(name: string | null) {
  if (!name) return { first: "Anonymous", last: "User" };
  const parts = name.trim().split(" ");
  if (parts.length === 1) return { first: parts[0], last: "" };
  return { first: parts.slice(0, -1).join(" "), last: parts[parts.length - 1] };
}

function normalizeGalleryUrls(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

function isLegacyProfileColumnError(error: unknown): boolean {
  const message = typeof error === "object" && error !== null && "message" in error
    ? String((error as { message?: unknown }).message)
    : "";
  return (
    message.includes("column profiles.bio does not exist") ||
    message.includes("column profiles.gallery_urls does not exist")
  );
}

export default function PublicProfilePage() {
  const params = useParams();
  const userId = params.id as string;

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [pastEvents, setPastEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activityTab, setActivityTab] = useState<"upcoming" | "past">("upcoming");

  const [isEditing, setIsEditing] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [editName, setEditName] = useState("");
  const [editBio, setEditBio] = useState("");
  const [galleryUrls, setGalleryUrls] = useState<string[]>([]);
  const [toast, setToast] = useState<Toast | null>(null);

  const isOwnProfile = currentUser?.id === userId;

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 3000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (!profile) return;
    setEditName(profile.name || "");
    setEditBio(profile.bio || "");
    setGalleryUrls(profile.gallery_urls || []);
  }, [profile]);

  useEffect(() => {
    async function fetchData() {
      const supabase = createClient();
      setLoading(true);
      setError(null);

      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        setCurrentUser(user);

        const profileQuery = await supabase
          .from("profiles")
          .select("id, name, avatar_url, is_premium, bio, gallery_urls")
          .eq("id", userId)
          .single();

        let profileData: Profile | null = null;

        if (!profileQuery.error && profileQuery.data) {
          profileData = profileQuery.data as Profile;
        } else if (isLegacyProfileColumnError(profileQuery.error)) {
          const fallbackQuery = await supabase
            .from("profiles")
            .select("id, name, avatar_url, is_premium")
            .eq("id", userId)
            .single();

          if (fallbackQuery.error || !fallbackQuery.data) {
            setError("User not found");
            setLoading(false);
            return;
          }

          profileData = fallbackQuery.data as Profile;
        } else {
          setError("User not found");
          setLoading(false);
          return;
        }

        const ownMeta = user?.id === userId ? user.user_metadata : null;
        const mergedProfile: Profile = {
          id: profileData.id,
          name:
            profileData.name ||
            (typeof ownMeta?.name === "string" ? ownMeta.name : null) ||
            (typeof ownMeta?.full_name === "string" ? ownMeta.full_name : null),
          avatar_url:
            profileData.avatar_url ||
            (typeof ownMeta?.avatar_url === "string" ? ownMeta.avatar_url : null) ||
            (typeof ownMeta?.picture === "string" ? ownMeta.picture : null),
          is_premium: profileData.is_premium,
          bio:
            profileData.bio ||
            (typeof ownMeta?.bio === "string" ? ownMeta.bio : null),
          gallery_urls:
            normalizeGalleryUrls(profileData.gallery_urls) ||
            normalizeGalleryUrls(ownMeta?.gallery_urls),
        };

        setProfile(mergedProfile);

        const nowIso = new Date().toISOString();
        const [{ data: hostedUpcoming }, { data: hostedPast }] = await Promise.all([
          supabase
            .from("events")
            .select("*")
            .eq("creator_id", userId)
            .gte("datetime", nowIso)
            .order("datetime", { ascending: true })
            .limit(4),
          supabase
            .from("events")
            .select("*")
            .eq("creator_id", userId)
            .lt("datetime", nowIso)
            .order("datetime", { ascending: false })
            .limit(4),
        ]);

        setUpcomingEvents(hostedUpcoming || []);
        setPastEvents(hostedPast || []);
      } finally {
        setLoading(false);
      }
    }

    if (userId) {
      fetchData();
    } else {
      setError("User not found");
      setLoading(false);
    }
  }, [userId]);

  async function persistOwnProfile(next: {
    name: string;
    bio: string;
    avatarUrl: string | null;
    gallery: string[];
  }) {
    if (!currentUser || currentUser.id !== userId) {
      throw new Error("Not authorized to edit this profile.");
    }

    const supabase = createClient();

    const { error: authError } = await supabase.auth.updateUser({
      data: {
        name: next.name || null,
        bio: next.bio || null,
        avatar_url: next.avatarUrl,
        gallery_urls: next.gallery,
      },
    });

    if (authError) throw authError;

    const extendedPayload = {
      id: currentUser.id,
      name: next.name || null,
      avatar_url: next.avatarUrl,
      bio: next.bio || null,
      gallery_urls: next.gallery,
    };

    const basePayload = {
      id: currentUser.id,
      name: next.name || null,
      avatar_url: next.avatarUrl,
    };

    const { error: profileError } = await supabase
      .from("profiles")
      .upsert(extendedPayload, { onConflict: "id" });

    if (profileError) {
      if (!isLegacyProfileColumnError(profileError)) {
        throw profileError;
      }

      const { error: fallbackError } = await supabase
        .from("profiles")
        .upsert(basePayload, { onConflict: "id" });

      if (fallbackError) throw fallbackError;
    }
  }

  async function handleSaveProfile() {
    if (!profile || !isOwnProfile) return;

    const nextName = editName.trim();
    const nextBio = editBio.trim();

    if (!nextName) {
      setToast({ type: "error", text: "Display name is required." });
      return;
    }

    setSavingProfile(true);
    try {
      await persistOwnProfile({
        name: nextName,
        bio: nextBio,
        avatarUrl: profile.avatar_url,
        gallery: galleryUrls,
      });

      setProfile((prev) =>
        prev
          ? {
              ...prev,
              name: nextName,
              bio: nextBio || null,
              gallery_urls: galleryUrls,
            }
          : prev
      );
      setIsEditing(false);
      setToast({ type: "success", text: "Profile updated." });
    } catch (saveError) {
      const message =
        saveError instanceof Error ? saveError.message : "Failed to save profile.";
      setToast({ type: "error", text: message });
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !profile || !currentUser || !isOwnProfile) return;

    if (!isAllowedImageType(file)) {
      setToast({ type: "error", text: "Avatar must be JPG, PNG, or WebP." });
      return;
    }

    if (file.size > MAX_AVATAR_FILE_SIZE_BYTES) {
      setToast({ type: "error", text: "Image must be less than 2MB." });
      return;
    }

    setUploadingAvatar(true);
    try {
      const supabase = createClient();
      const fileExt = file.name.split(".").pop() || "jpg";
      const fileName = `${currentUser.id}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(fileName);

      await persistOwnProfile({
        name: editName.trim() || profile.name || "",
        bio: editBio.trim(),
        avatarUrl: publicUrl,
        gallery: galleryUrls,
      });

      setProfile((prev) =>
        prev
          ? {
              ...prev,
              avatar_url: publicUrl,
            }
          : prev
      );

      setToast({ type: "success", text: "Photo updated." });
    } catch (uploadError) {
      const message =
        uploadError instanceof Error ? uploadError.message : "Failed to upload photo.";
      setToast({ type: "error", text: message });
    } finally {
      setUploadingAvatar(false);
      if (e.target) e.target.value = "";
    }
  }

  async function handleGalleryUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0 || !profile || !isOwnProfile || !currentUser) return;

    const remainingSlots = MAX_GALLERY_IMAGES - galleryUrls.length;
    if (remainingSlots <= 0) {
      setToast({ type: "error", text: "Gallery is full." });
      return;
    }

    if (files.length > remainingSlots) {
      setToast({
        type: "error",
        text: `You can upload ${remainingSlots} more photo${remainingSlots === 1 ? "" : "s"}.`,
      });
      return;
    }

    if (files.length > MAX_GALLERY_UPLOAD_BATCH) {
      setToast({
        type: "error",
        text: `Upload up to ${MAX_GALLERY_UPLOAD_BATCH} photos at a time.`,
      });
      return;
    }

    const selectedFiles = Array.from(files);

    for (const file of selectedFiles) {
      if (!isAllowedImageType(file)) {
        setToast({ type: "error", text: "Gallery photos must be JPG, PNG, or WebP." });
        return;
      }
      if (file.size > MAX_GALLERY_FILE_SIZE_BYTES) {
        setToast({ type: "error", text: "Each gallery image must be less than 3MB." });
        return;
      }
    }

    setUploadingGallery(true);

    try {
      const supabase = createClient();
      const uploadedUrls: string[] = [];

      for (const [index, file] of selectedFiles.entries()) {
        const fileExt = file.name.split(".").pop() || "jpg";
        const filePath = `${currentUser.id}/gallery/${Date.now()}-${index}-${Math.random()
          .toString(36)
          .slice(2, 8)}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(filePath, file, { upsert: false });

        if (uploadError) throw uploadError;

        const {
          data: { publicUrl },
        } = supabase.storage.from("avatars").getPublicUrl(filePath);

        uploadedUrls.push(publicUrl);
      }

      const nextGallery = [...galleryUrls, ...uploadedUrls].slice(0, MAX_GALLERY_IMAGES);

      await persistOwnProfile({
        name: editName.trim() || profile.name || "",
        bio: editBio.trim(),
        avatarUrl: profile.avatar_url,
        gallery: nextGallery,
      });

      setGalleryUrls(nextGallery);
      setProfile((prev) =>
        prev
          ? {
              ...prev,
              gallery_urls: nextGallery,
            }
          : prev
      );

      setToast({ type: "success", text: "Gallery updated." });
    } catch (galleryError) {
      const message =
        galleryError instanceof Error
          ? galleryError.message
          : "Failed to upload gallery photos.";
      setToast({ type: "error", text: message });
    } finally {
      setUploadingGallery(false);
      if (e.target) e.target.value = "";
    }
  }

  async function handleRemoveGalleryImage(index: number) {
    if (!profile || !isOwnProfile) return;

    const nextGallery = galleryUrls.filter((_, imageIndex) => imageIndex !== index);

    setSavingProfile(true);
    try {
      await persistOwnProfile({
        name: editName.trim() || profile.name || "",
        bio: editBio.trim(),
        avatarUrl: profile.avatar_url,
        gallery: nextGallery,
      });

      setGalleryUrls(nextGallery);
      setProfile((prev) =>
        prev
          ? {
              ...prev,
              gallery_urls: nextGallery,
            }
          : prev
      );
      setToast({ type: "success", text: "Photo removed." });
    } catch (removeError) {
      const message =
        removeError instanceof Error ? removeError.message : "Failed to remove photo.";
      setToast({ type: "error", text: message });
    } finally {
      setSavingProfile(false);
    }
  }

  const getBadges = (): Badge[] => {
    const badges: Badge[] = [];
    if (pastEvents.length >= 3) {
      badges.push({
        icon: "team",
        label: "Team Player",
        description: `Hosted ${pastEvents.length}+ events`,
        color: "bg-blue-500",
      });
    }
    return badges;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8 animate-pulse">
          <div className="grid md:grid-cols-[1fr_auto] gap-8">
            <div className="space-y-3">
              <div className="h-6 w-40 bg-zinc-100 rounded-full" />
              <div className="h-12 w-72 bg-zinc-200 rounded-xl" />
              <div className="h-4 w-48 bg-zinc-100 rounded" />
              <div className="h-10 w-36 bg-zinc-200 rounded-full" />
            </div>
            <div className="w-36 h-36 sm:w-40 sm:h-40 rounded-full bg-zinc-100" />
          </div>
          <div className="grid md:grid-cols-[1fr_340px] gap-8">
            <div className="space-y-4">
              <div className="h-6 w-32 bg-zinc-200 rounded" />
              <div className="grid grid-cols-3 gap-2">
                {[1, 2, 3].map((item) => (
                  <div key={`public-profile-skeleton-gallery-${item}`} className="aspect-square rounded-xl bg-zinc-100" />
                ))}
              </div>
              <div className="h-6 w-36 bg-zinc-200 rounded mt-4" />
              <div className="h-40 rounded-2xl border border-zinc-200 bg-zinc-50" />
            </div>
            <div className="space-y-4">
              <div className="h-40 rounded-2xl border border-zinc-200 bg-zinc-50" />
              <div className="h-28 rounded-2xl border border-zinc-200 bg-zinc-50" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-white">
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <p className="text-zinc-500 mb-4">{error || "User not found"}</p>
            <Link href="/events" className="text-orange-500 hover:underline">
              Back to events
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const { first, last } = splitName(isOwnProfile && isEditing ? editName : profile.name);
  const badges = getBadges();
  const activityEvents = activityTab === "upcoming" ? upcomingEvents : pastEvents;

  return (
    <div className="min-h-screen bg-white">
      {toast && (
        <div
          className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-full font-medium shadow-lg transition-all text-sm ${
            toast.type === "success" ? "bg-zinc-900 text-white" : "bg-red-500 text-white"
          }`}
        >
          {toast.text}
        </div>
      )}

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="grid md:grid-cols-[1fr_auto] gap-8 mb-10">
          <div>
            <div className="flex items-center gap-2 mb-3">
              {profile.is_premium && (
                <span className="px-3 py-1 bg-orange-500 text-white text-xs font-bold rounded-full">
                  Pro Athlete
                </span>
              )}
              <span className="px-3 py-1 bg-blue-50 text-blue-600 text-xs font-medium rounded-full flex items-center gap-1">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                Verified
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl font-bold mb-3">
              <span className="text-zinc-900">{first} </span>
              <span className="text-orange-500">{last}</span>
            </h1>

            {!isOwnProfile || !isEditing ? (
              <p className="text-zinc-500 text-sm mb-5">
                {profile.bio || "Sports enthusiast"}
              </p>
            ) : (
              <div className="mb-5 space-y-3 max-w-md">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-zinc-500 mb-1.5">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-3 py-2.5 border border-zinc-200 rounded-xl bg-zinc-50 text-zinc-900 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-zinc-500 mb-1.5">
                    Bio
                  </label>
                  <textarea
                    value={editBio}
                    onChange={(e) => setEditBio(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2.5 border border-zinc-200 rounded-xl bg-zinc-50 text-zinc-900 focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                    placeholder="Tell people about yourself"
                  />
                </div>
              </div>
            )}

            {!isOwnProfile && (
              <Link
                href="/events/create"
                className="inline-flex items-center px-5 py-2.5 bg-zinc-900 text-white text-sm font-medium rounded-full hover:bg-zinc-800 transition-colors"
              >
                Invite to Game
              </Link>
            )}

            {isOwnProfile && !isEditing && (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="inline-flex items-center px-5 py-2.5 border border-zinc-300 text-zinc-700 text-sm font-medium rounded-full hover:bg-zinc-50 transition-colors"
              >
                Edit Profile
              </button>
            )}

            {isOwnProfile && isEditing && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSaveProfile}
                  disabled={savingProfile || uploadingAvatar || uploadingGallery}
                  className="inline-flex items-center px-5 py-2.5 bg-zinc-900 text-white text-sm font-medium rounded-full hover:bg-zinc-800 transition-colors disabled:opacity-50"
                >
                  {savingProfile ? "Saving..." : "Save Profile"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setEditName(profile.name || "");
                    setEditBio(profile.bio || "");
                    setGalleryUrls(profile.gallery_urls || []);
                  }}
                  className="inline-flex items-center px-5 py-2.5 border border-zinc-300 text-zinc-700 text-sm font-medium rounded-full hover:bg-zinc-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>

          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              {profile.avatar_url ? (
                <Image
                  src={profile.avatar_url}
                  alt={profile.name || "User"}
                  width={160}
                  height={160}
                  className="w-36 h-36 sm:w-40 sm:h-40 rounded-full object-cover border-4 border-zinc-100"
                />
              ) : (
                <div className="w-36 h-36 sm:w-40 sm:h-40 rounded-full bg-zinc-200 text-zinc-400 text-4xl font-bold flex items-center justify-center border-4 border-zinc-100">
                  {getInitials(profile.name)}
                </div>
              )}
            </div>

            {isOwnProfile && (
              <>
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={uploadingAvatar || savingProfile}
                  className="px-4 py-2 text-xs font-medium rounded-full border border-zinc-300 text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
                >
                  {uploadingAvatar ? "Uploading..." : "Change Photo"}
                </button>
              </>
            )}
          </div>
        </div>

        <div className="grid md:grid-cols-[1fr_340px] gap-8">
          <div className="space-y-8">
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-zinc-900">Photo Gallery</h2>
                {isOwnProfile && (
                  <>
                    <input
                      ref={galleryInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      multiple
                      onChange={handleGalleryUpload}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (!isEditing) setIsEditing(true);
                        galleryInputRef.current?.click();
                      }}
                      disabled={uploadingGallery || savingProfile || galleryUrls.length >= MAX_GALLERY_IMAGES}
                      className="px-4 py-2 text-xs font-medium rounded-full border border-zinc-300 text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
                    >
                      {uploadingGallery ? "Uploading..." : "Add Photos"}
                    </button>
                  </>
                )}
              </div>

              {galleryUrls.length > 0 ? (
                <div className="grid grid-cols-3 gap-2">
                  {galleryUrls.map((url, index) => (
                    <div key={`${url}-${index}`} className="relative aspect-square rounded-xl overflow-hidden bg-zinc-100">
                      <Image
                        src={url}
                        alt={`Gallery ${index + 1}`}
                        fill
                        sizes="(max-width: 768px) 33vw, 240px"
                        className="object-cover"
                      />
                      {isOwnProfile && isEditing && (
                        <button
                          type="button"
                          onClick={() => handleRemoveGalleryImage(index)}
                          className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/65 text-white text-xs flex items-center justify-center hover:bg-black/80"
                          aria-label={`Remove gallery image ${index + 1}`}
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="aspect-square bg-zinc-100 rounded-xl flex items-center justify-center">
                      <svg className="w-8 h-8 text-zinc-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z" />
                      </svg>
                    </div>
                  ))}
                </div>
              )}

              {isOwnProfile && (
                <p className="text-xs text-zinc-500 mt-3">
                  {galleryUrls.length}/{MAX_GALLERY_IMAGES} photos. JPG/PNG/WebP only, max 3MB each, up to 4 uploads per action.
                </p>
              )}
            </section>

            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-zinc-900">Activity Feed</h2>
                <div className="flex items-center bg-zinc-100 rounded-full p-0.5">
                  <button
                    onClick={() => setActivityTab("upcoming")}
                    className={`px-4 py-1.5 text-xs font-medium rounded-full transition-colors ${
                      activityTab === "upcoming" ? "bg-zinc-900 text-white" : "text-zinc-500"
                    }`}
                  >
                    Upcoming
                  </button>
                  <button
                    onClick={() => setActivityTab("past")}
                    className={`px-4 py-1.5 text-xs font-medium rounded-full transition-colors ${
                      activityTab === "past" ? "bg-zinc-900 text-white" : "text-zinc-500"
                    }`}
                  >
                    Past
                  </button>
                </div>
              </div>

              {activityEvents.length === 0 ? (
                <div className="bg-zinc-50 rounded-2xl p-8 text-center">
                  <p className="text-zinc-400 text-sm">No {activityTab} events</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {activityEvents.map((event) => (
                    <EventCard
                      key={event.id}
                      event={event}
                      variant={activityTab === "past" ? "past" : "default"}
                    />
                  ))}
                </div>
              )}
            </section>
          </div>

          <div className="space-y-6">
            <section className="bg-white rounded-2xl border border-zinc-200 p-5">
              <h3 className="text-base font-bold text-zinc-900 mb-4">Badges</h3>
              {badges.length === 0 ? (
                <p className="text-zinc-400 text-sm text-center py-4">No badges yet</p>
              ) : (
                <div className="space-y-3">
                  {badges.map((badge) => (
                    <div key={badge.label} className="flex items-center gap-3">
                      <div className={`w-10 h-10 ${badge.color} rounded-full flex items-center justify-center`}>
                        {badge.icon === "team" && (
                          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
                          </svg>
                        )}
                        {badge.icon === "star" && (
                          <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        )}
                        {badge.icon === "bolt" && (
                          <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                      <div>
                        <div className="font-semibold text-zinc-900 text-sm">{badge.label}</div>
                        <div className="text-xs text-zinc-500">{badge.description}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
