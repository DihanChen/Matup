"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const message = searchParams.get("message");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    const supabase = createClient();

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    // Sync profile to profiles table (for existing users)
    if (data.user) {
      await supabase.from("profiles").upsert({
        id: data.user.id,
        name: data.user.user_metadata?.name || null,
        avatar_url: data.user.user_metadata?.avatar_url || null,
      }, { onConflict: "id" });
    }

    router.push("/dashboard");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-900 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="text-3xl font-bold text-emerald-600">
            MatUp
          </Link>
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-white mt-6">
            Welcome back
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400 mt-2">
            Log in to find your fitness partners
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white dark:bg-zinc-800 p-8 rounded-xl border border-zinc-200 dark:border-zinc-700"
        >
          {message && (
            <div className="mb-4 p-3 bg-emerald-100 border border-emerald-300 text-emerald-700 rounded-lg text-sm">
              {message}
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1"
              >
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                required
                className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1"
              >
                Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                required
                className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="••••••••"
              />
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center text-zinc-600 dark:text-zinc-400">
                <input type="checkbox" className="mr-2 rounded" />
                Remember me
              </label>
              <Link
                href="/forgot-password"
                className="text-emerald-600 hover:underline"
              >
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Logging in..." : "Log in"}
            </button>
          </div>
        </form>

        <p className="text-center text-zinc-600 dark:text-zinc-400 mt-6">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-emerald-600 hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
