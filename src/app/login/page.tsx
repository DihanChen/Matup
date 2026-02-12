"use client";

import Link from "next/link";
import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase";

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white px-4">
        <main className="max-w-md mx-auto py-16 animate-pulse">
          <div className="h-8 w-40 bg-zinc-200 rounded-xl mx-auto mb-3" />
          <div className="h-4 w-56 bg-zinc-100 rounded mx-auto mb-8" />
          <div className="rounded-2xl border border-zinc-200 p-8 space-y-4">
            <div className="h-4 w-16 bg-zinc-200 rounded" />
            <div className="h-12 w-full bg-zinc-100 rounded-xl" />
            <div className="h-4 w-20 bg-zinc-200 rounded" />
            <div className="h-12 w-full bg-zinc-100 rounded-xl" />
            <div className="h-12 w-full bg-zinc-200 rounded-full mt-2" />
          </div>
        </main>
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}

function LoginContent() {
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
    <div className="min-h-screen flex items-center justify-center bg-white px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-6">
            <svg width="40" height="40" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-zinc-900 mx-auto">
              <rect x="3" y="15" width="12" height="12" rx="2.5" fill="currentColor"/>
              <rect x="17" y="5" width="12" height="12" rx="2.5" fill="currentColor"/>
            </svg>
          </Link>
          <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">
            Welcome back
          </h1>
          <p className="text-zinc-500 mt-2">
            Sign in to find your fitness partners
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white p-8 rounded-2xl border border-zinc-200 shadow-sm"
        >
          {message && (
            <div className="mb-4 p-3 bg-orange-50 border border-orange-200 text-orange-700 rounded-xl text-sm">
              {message}
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-zinc-700 mb-1.5"
              >
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                required
                className="w-full px-4 py-3 border border-zinc-200 rounded-xl bg-zinc-50 text-zinc-900 focus:ring-2 focus:ring-orange-500 focus:border-transparent focus:bg-white transition-all"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-zinc-700 mb-1.5"
              >
                Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                required
                className="w-full px-4 py-3 border border-zinc-200 rounded-xl bg-zinc-50 text-zinc-900 focus:ring-2 focus:ring-orange-500 focus:border-transparent focus:bg-white transition-all"
                placeholder="••••••••"
              />
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center text-zinc-600">
                <input type="checkbox" className="mr-2 rounded border-zinc-300" />
                Remember me
              </label>
              <Link
                href="/forgot-password"
                className="text-orange-500 hover:text-orange-600 font-medium"
              >
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-zinc-900 text-white rounded-full font-medium hover:bg-zinc-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </div>
        </form>

        <p className="text-center text-zinc-500 mt-6">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-orange-500 hover:text-orange-600 font-medium">
            Get started
          </Link>
        </p>
      </div>
    </div>
  );
}
