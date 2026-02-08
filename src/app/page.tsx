"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const [email, setEmail] = useState("");

  function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    if (email.trim()) {
      router.push(`/signup?email=${encodeURIComponent(email.trim())}`);
    } else {
      router.push("/signup");
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 antialiased flex flex-col">
      {/* Navigation */}

      {/* Hero Section */}
      <section className="flex-1 flex items-center">
        <div className="max-w-[1200px] mx-auto px-6 py-16 md:py-24 w-full">
          <div className="grid md:grid-cols-5 gap-10 md:gap-20 items-start">
            {/* Left column */}
            <div className="md:col-span-2 pt-8">
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-zinc-900 tracking-tight leading-[1.1] mb-12">
                Find people<br />
                who <span className="text-orange-500">move</span><br />
                <span style={{ color: 'rgba(186, 220, 108)' }}>like you do</span>.
              </h1>

              <form onSubmit={handleSignUp} className="max-w-xs">
                <div className="mb-3">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email Address"
                    className="w-full px-4 py-4 border border-zinc-200 rounded-xl bg-white text-zinc-900 placeholder-zinc-400 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-300 transition-colors"
                  />
                </div>
                <div className="flex gap-3 items-center">
                  <button
                    type="submit"
                    className="flex-1 px-8 py-4 bg-zinc-900 text-white rounded-xl font-semibold hover:bg-zinc-800 transition-colors whitespace-nowrap"
                  >
                    Sign Up - Free!
                  </button>
                  <button
                    type="submit"
                    className="flex-shrink-0 w-14 h-14 bg-zinc-200 text-zinc-500 rounded-xl flex items-center justify-center hover:bg-zinc-300 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </button>
                </div>
              </form>

            </div>

            {/* Right column — 3 feature cards */}
            <div className="md:col-span-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-8 md:mt-0">
              {/* Card 1: Join Activities */}
              <div className="bg-zinc-100 rounded-2xl p-5 flex flex-col">
                <div className="flex items-start justify-between mb-4">
                  <span className="text-sm font-bold text-zinc-900">
                    All Ages
                  </span>
                  <svg className="w-5 h-5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17l9.2-9.2M17 17V7H7" />
                  </svg>
                </div>
                <h3 className="text-2xl font-extrabold text-zinc-900 mb-2 leading-tight">
                  Join<br />Activities
                </h3>
                <p className="text-sm text-zinc-500 mb-6 flex-1 leading-relaxed">
                  Connect with fitness partners in your area. Explore all fitness, outdoor, sports events.
                </p>
                <div className="h-36 rounded-xl bg-purple-200 relative overflow-hidden">
                  <div className="absolute bottom-2 left-4 w-20 h-20 rounded-full bg-purple-300" />
                  <div className="absolute bottom-4 right-4 w-24 h-24 rounded-full border-4 border-purple-300 bg-transparent" />
                  <div className="absolute top-4 left-3 w-10 h-10 rounded-full bg-purple-400 opacity-60" />
                </div>
              </div>

              {/* Card 2: Host Events */}
              <div className="bg-zinc-100 rounded-2xl p-5 flex flex-col">
                <div className="flex items-start justify-between mb-4">
                  <span className="text-sm font-bold text-zinc-900">
                    Advanced
                  </span>
                  <svg className="w-5 h-5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17l9.2-9.2M17 17V7H7" />
                  </svg>
                </div>
                <h3 className="text-2xl font-extrabold text-zinc-900 mb-2 leading-tight">
                  Host<br />Events
                </h3>
                <p className="text-sm text-zinc-500 mb-6 flex-1 leading-relaxed">
                  High-intensity training sessions that focus on rhythm and power.
                </p>
                <div className="h-36 rounded-xl bg-lime-200 relative overflow-hidden">
                  <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2 items-end">
                    <div className="w-6 h-12 rounded-sm bg-blue-400" />
                    <div className="w-6 h-16 rounded-sm bg-blue-500" />
                    <div className="w-6 h-20 rounded-sm bg-blue-400" />
                  </div>
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-4">
                    <div className="w-7 h-6 rounded-sm border-2 border-blue-400" />
                    <div className="w-7 h-6 rounded-sm border-2 border-blue-400" />
                  </div>
                </div>
              </div>

              {/* Card 3: Earn Rewards */}
              <div className="bg-zinc-100 rounded-2xl p-5 flex flex-col">
                <div className="flex items-start justify-between mb-4">
                  <span className="text-sm font-bold text-zinc-900">
                    Advanced
                  </span>
                  <svg className="w-5 h-5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17l9.2-9.2M17 17V7H7" />
                  </svg>
                </div>
                <h3 className="text-2xl font-extrabold text-zinc-900 mb-2 leading-tight">
                  Earn Rewards
                </h3>
                <p className="text-sm text-zinc-500 mb-6 flex-1 leading-relaxed">
                  Vertical training and basketball fundamentals for competitive athletes.
                </p>
                <div className="h-36 rounded-xl bg-blue-100 relative overflow-hidden">
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-orange-400" />
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded border-2 border-orange-300" />
                  <div className="absolute top-3 left-1/2 -translate-x-1/2 w-0.5 h-8 bg-zinc-400 opacity-50" />
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 w-0.5 h-8 bg-zinc-400 opacity-50" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-zinc-50">
        <div className="max-w-[1200px] mx-auto px-6 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-zinc-400">
              &copy; 2026 MatUp rights reserved.
            </p>
            <div className="flex gap-6 text-sm text-zinc-400">
              <Link href="#" className="hover:text-zinc-900 transition-colors">
                Privacy Policy
              </Link>
              <Link href="#" className="hover:text-zinc-900 transition-colors">
                Terms of Service
              </Link>
              <Link href="#" className="hover:text-zinc-900 transition-colors">
                Contact Us
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
