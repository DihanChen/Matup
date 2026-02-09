"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase";

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-white px-4">
          <div className="text-zinc-500">Loading...</div>
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const code = searchParams.get("code");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [hasSession, setHasSession] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    let isMounted = true;

    async function init() {
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error && isMounted) {
          setError("This reset link is invalid or expired.");
        }
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!isMounted) return;
      setHasSession(!!session);
      setReady(true);
    }

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) return;
      setHasSession(!!session);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [code]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setMessage("Password updated. You can now sign in.");
    setLoading(false);
  }

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white px-4">
        <div className="text-zinc-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-6">
            <svg
              width="40"
              height="40"
              viewBox="0 0 32 32"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="text-zinc-900 mx-auto"
            >
              <rect x="3" y="15" width="12" height="12" rx="2.5" fill="currentColor" />
              <rect x="17" y="5" width="12" height="12" rx="2.5" fill="currentColor" />
            </svg>
          </Link>
          <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">
            Choose a new password
          </h1>
          <p className="text-zinc-500 mt-2">
            Create a strong password you will remember.
          </p>
        </div>

        {!hasSession ? (
          <div className="bg-white p-8 rounded-2xl border border-zinc-200 shadow-sm text-center">
            <p className="text-zinc-600 mb-4">
              This reset link is invalid or expired.
            </p>
            <Link
              href="/forgot-password"
              className="text-orange-500 hover:text-orange-600 font-medium"
            >
              Request a new reset link
            </Link>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="bg-white p-8 rounded-2xl border border-zinc-200 shadow-sm"
          >
            {message && (
              <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-sm">
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
                  htmlFor="password"
                  className="block text-sm font-medium text-zinc-700 mb-1.5"
                >
                  New password
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  minLength={8}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-zinc-200 rounded-xl bg-zinc-50 text-zinc-900 focus:ring-2 focus:ring-orange-500 focus:border-transparent focus:bg-white transition-all"
                  placeholder="At least 8 characters"
                />
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-zinc-700 mb-1.5"
                >
                  Confirm new password
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  minLength={8}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-zinc-200 rounded-xl bg-zinc-50 text-zinc-900 focus:ring-2 focus:ring-orange-500 focus:border-transparent focus:bg-white transition-all"
                  placeholder="Re-enter your password"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-zinc-900 text-white rounded-full font-medium hover:bg-zinc-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Updating..." : "Update password"}
              </button>
            </div>
          </form>
        )}

        <p className="text-center text-zinc-500 mt-6">
          Need to sign in?{" "}
          <Link href="/login" className="text-orange-500 hover:text-orange-600 font-medium">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
