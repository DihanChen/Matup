"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

const featurePanels = [
  {
    id: "join-activities",
    badge: "All Ages",
    title: "Join\nActivities",
    description:
      "Connect with fitness partners in your area. Explore all fitness, outdoor, sports events.",
    toneClass: "bg-purple-200",
    art: (
      <>
        <div className="absolute bottom-2 left-4 w-20 h-20 rounded-full bg-purple-300" />
        <div className="absolute bottom-4 right-4 w-24 h-24 rounded-full border-4 border-purple-300 bg-transparent" />
        <div className="absolute top-4 left-3 w-10 h-10 rounded-full bg-purple-400 opacity-60" />
      </>
    ),
  },
  {
    id: "host-events",
    badge: "Advanced",
    title: "Host\nEvents",
    description:
      "High-intensity training sessions that focus on rhythm and power.",
    toneClass: "bg-lime-200",
    art: (
      <>
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2 items-end">
          <div className="w-6 h-12 rounded-sm bg-blue-400" />
          <div className="w-6 h-16 rounded-sm bg-blue-500" />
          <div className="w-6 h-20 rounded-sm bg-blue-400" />
        </div>
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-4">
          <div className="w-7 h-6 rounded-sm border-2 border-blue-400" />
          <div className="w-7 h-6 rounded-sm border-2 border-blue-400" />
        </div>
      </>
    ),
  },
  {
    id: "earn-rewards",
    badge: "Advanced",
    title: "Earn Rewards",
    description:
      "Vertical training and basketball fundamentals for competitive athletes.",
    toneClass: "bg-blue-100",
    art: (
      <>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-orange-400" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded border-2 border-orange-300" />
        <div className="absolute top-3 left-1/2 -translate-x-1/2 w-0.5 h-8 bg-zinc-400 opacity-50" />
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 w-0.5 h-8 bg-zinc-400 opacity-50" />
      </>
    ),
  },
];

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
          <div className="grid md:grid-cols-5 gap-10 md:gap-20 items-start md:items-stretch">
            {/* Left column */}
            <div className="md:col-span-2">
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

            {/* Right column — scrollable feature panels */}
            <div className="md:col-span-3 mt-8 md:mt-0 md:h-full">
              <div className="overflow-x-auto overflow-y-hidden pb-2 snap-x snap-mandatory scrollbar-hide md:h-full">
                <div className="flex gap-4 w-max md:h-full">
                  {featurePanels.map((panel) => (
                    <article
                      key={panel.id}
                      className="bg-zinc-100 rounded-2xl p-5 flex flex-col snap-start w-[210px] sm:w-[245px] md:w-[265px] md:h-full"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <span className="text-sm font-bold text-zinc-900">
                          {panel.badge}
                        </span>
                        <svg
                          className="w-5 h-5 text-zinc-400"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M7 17l9.2-9.2M17 17V7H7"
                          />
                        </svg>
                      </div>
                      <h3 className="text-2xl font-extrabold text-zinc-900 mb-2 leading-tight whitespace-pre-line">
                        {panel.title}
                      </h3>
                      <p className="text-sm text-zinc-500 mb-6 flex-1 leading-relaxed">
                        {panel.description}
                      </p>
                      <div
                        className={`h-36 rounded-xl relative overflow-hidden ${panel.toneClass}`}
                      >
                        {panel.art}
                      </div>
                    </article>
                  ))}
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
