"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import Navbar from "@/components/Navbar";

const ACTIVITIES = [
  { label: "Running", description: "Find your pace partners" },
  { label: "Tennis", description: "Match with players nearby" },
  { label: "Cycling", description: "Join group rides" },
  { label: "Gym", description: "Workout together" },
  { label: "Yoga", description: "Flow with others" },
  { label: "Basketball", description: "Find pickup games" },
  { label: "Soccer", description: "Join local matches" },
  { label: "Swimming", description: "Lap partners await" },
];

// Component definitions
function FeaturedEventCard({
  gradient,
  emoji1,
  emoji2,
  badge,
  title,
  description,
  location,
  date,
  participants,
}: {
  gradient: string;
  emoji1: string;
  emoji2: string;
  badge: string;
  title: string;
  description: string;
  location: string;
  date: string;
  participants: string;
}) {
  return (
    <div className={`w-[300px] sm:w-[400px] md:w-[480px] h-[320px] sm:h-[340px] md:h-[360px] flex-shrink-0 relative overflow-hidden rounded-3xl bg-gradient-to-br ${gradient} p-6 sm:p-8`}>
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-8 right-8 text-6xl">{emoji1}</div>
        <div className="absolute bottom-8 left-8 text-5xl">{emoji2}</div>
      </div>

      <div className="relative text-white h-full flex flex-col">
        <div className="inline-block px-2 sm:px-3 py-1 bg-white/20 backdrop-blur rounded-full text-xs sm:text-sm font-medium mb-3 sm:mb-4 self-start">
          {badge}
        </div>
        <h3 className="text-lg sm:text-xl md:text-2xl font-bold mb-2 sm:mb-3 line-clamp-1">
          {title}
        </h3>
        <p className="text-white/90 mb-4 leading-relaxed text-xs sm:text-sm line-clamp-2 flex-shrink-0">
          {description}
        </p>

        <div className="space-y-1.5 sm:space-y-2 mb-4 text-xs sm:text-sm flex-grow">
          <div className="flex items-center gap-2 text-white/90">
            <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="truncate">{location}</span>
          </div>
          <div className="flex items-center gap-2 text-white/90">
            <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="truncate">{date}</span>
          </div>
          <div className="flex items-center gap-2 text-white/90">
            <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <span className="truncate">{participants}</span>
          </div>
        </div>

        <Link
          href="/signup"
          className="inline-flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 bg-white text-zinc-900 rounded-full font-semibold hover:bg-white/90 transition-all duration-300 shadow-lg text-xs sm:text-sm self-start mt-auto"
        >
          Join event
          <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </Link>
      </div>
    </div>
  );
}

function AchievementCard({
  icon,
  title,
  description,
  reward,
  progress,
  total,
  bgColor,
  textColor,
}: {
  icon: string;
  title: string;
  description: string;
  reward: string;
  progress: number;
  total: number;
  bgColor: string;
  textColor: string;
}) {
  const percentage = (progress / total) * 100;

  return (
    <div className={`p-6 rounded-2xl ${bgColor} border border-zinc-200`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="text-3xl">{icon}</div>
          <div>
            <h4 className={`font-semibold ${textColor} mb-1`}>{title}</h4>
            <p className="text-sm text-zinc-600">{description}</p>
          </div>
        </div>
      </div>

      <div className="mb-3">
        <div className="flex justify-between items-center mb-3">
          <span className="text-sm font-semibold text-zinc-900">{reward}</span>
        </div>
        <div className="h-2 bg-white rounded-full overflow-hidden">
          <div
            className={`h-full ${textColor.replace('text-', 'bg-')} transition-all duration-500`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    </div>
  );
}

function FeaturedEventsCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const events = [
    {
      gradient: "from-emerald-500 via-teal-500 to-cyan-500",
      emoji1: "🏃",
      emoji2: "💪",
      badge: "Running · Beginner Friendly",
      title: "Saturday Morning Run Club",
      description: "Join us for a casual 5K run through Central Park. All paces welcome! We'll meet at the Bethesda Fountain and end with coffee.",
      location: "Central Park, New York",
      date: "Saturday, February 1 at 8:00 AM",
      participants: "12 people joined · 8 spots left",
    },
    {
      gradient: "from-blue-500 via-indigo-500 to-purple-500",
      emoji1: "🎾",
      emoji2: "🏆",
      badge: "Tennis · Intermediate",
      title: "Sunday Doubles Tournament",
      description: "Join our friendly doubles tournament! Compete with other tennis enthusiasts and improve your game. Prizes for winners!",
      location: "Brooklyn Tennis Courts",
      date: "Sunday, February 2 at 10:00 AM",
      participants: "16 people joined · 4 spots left",
    },
    {
      gradient: "from-purple-500 via-pink-500 to-rose-500",
      emoji1: "🧘",
      emoji2: "✨",
      badge: "Yoga · All Levels",
      title: "Sunrise Beach Yoga",
      description: "Start your day with peaceful yoga by the beach. Watch the sunrise while flowing through gentle poses. Bring your own mat!",
      location: "Santa Monica Beach, LA",
      date: "Sunday, February 2 at 6:30 AM",
      participants: "20 people joined · Full",
    },
    {
      gradient: "from-orange-500 via-amber-500 to-yellow-500",
      emoji1: "🚴",
      emoji2: "🌄",
      badge: "Cycling · Advanced",
      title: "Mountain Trail Ride",
      description: "Challenge yourself with a scenic 25-mile mountain trail. Experience breathtaking views and push your limits. E-bikes welcome!",
      location: "Rocky Mountain Trail, CO",
      date: "Saturday, February 1 at 7:00 AM",
      participants: "8 people joined · 12 spots left",
    },
  ];

  // Get responsive card width based on screen size
  const getCardWidth = () => {
    if (typeof window === "undefined") return 480;
    if (window.innerWidth < 640) return 300; // mobile
    if (window.innerWidth < 768) return 400; // sm
    return 480; // md+
  };

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const scrollLeft = container.scrollLeft;
      const cardWidth = getCardWidth() + 24; // card width + gap
      const newIndex = Math.round(scrollLeft / cardWidth);
      setActiveIndex(newIndex);
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToIndex = (index: number) => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const cardWidth = getCardWidth() + 24; // card width + gap
    container.scrollTo({
      left: index * cardWidth,
      behavior: "smooth",
    });
  };

  return (
    <div>
      {/* Scrollable container with snap */}
      <div
        ref={scrollContainerRef}
        className="overflow-x-auto pb-4 -mx-6 px-6 snap-x snap-mandatory scrollbar-hide"
      >
        <div className="flex gap-6 min-w-max">
          {events.map((event, index) => (
            <div key={index} className="snap-center">
              <FeaturedEventCard {...event} />
            </div>
          ))}
        </div>
      </div>

      {/* Interactive pagination dots */}
      <div className="flex justify-center gap-2 mt-6">
        {events.map((_, index) => (
          <button
            key={index}
            onClick={() => scrollToIndex(index)}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              activeIndex === index
                ? "bg-emerald-500 w-8"
                : "bg-zinc-300 hover:bg-zinc-400"
            }`}
            aria-label={`Go to event ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen bg-[#fbfbfd] antialiased">
      {/* Navigation */}
      <div className="relative z-50">
        <Navbar />
      </div>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Subtle gradient orb */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-to-b from-emerald-100/50 via-teal-50/30 to-transparent rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-[980px] mx-auto px-6 pt-20 pb-32 text-center">
          {/* Eyebrow */}
          <p className="text-emerald-600 font-medium text-sm tracking-wide uppercase mb-4">
            Introducing MatUp
          </p>

          {/* Hero Headline */}
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-semibold text-zinc-900 tracking-tight leading-[1.1] mb-6">
            Find people who move
            <br />
            <span className="bg-gradient-to-r from-emerald-600 via-teal-500 to-cyan-500 bg-clip-text text-transparent">
              like you do.
            </span>
          </h1>

          {/* Subheadline */}
          <p className="text-xl md:text-2xl text-zinc-500 font-normal max-w-2xl mx-auto mb-10 leading-relaxed">
            Connect with fitness partners in your area. Create events, join activities, and make every workout better.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/signup"
              className="px-8 py-4 bg-zinc-900 text-white rounded-full text-lg font-medium hover:bg-zinc-800 transition-all duration-300"
            >
              Get started — it&apos;s free
            </Link>
            <Link
              href="/events"
              className="group px-8 py-4 text-emerald-600 text-lg font-medium hover:text-emerald-700 transition-colors duration-300 flex items-center gap-2"
            >
              Browse events
              <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Events Carousel */}
      <section className="py-16 bg-zinc-100">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="text-center mb-8">
            <span className="inline-block px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-full uppercase tracking-wide mb-3">
              Featured Events
            </span>
            <h2 className="text-3xl font-semibold text-zinc-900 tracking-tight">
              Happening this week
            </h2>
          </div>

          <FeaturedEventsCarousel />
        </div>
      </section>

      {/* Rewards & Achievements */}
      <section className="py-24 bg-white border-y border-zinc-200">
        <div className="max-w-[980px] mx-auto px-6">
          <div className="text-center mb-16">
            <span className="inline-block px-3 py-1 bg-purple-100 text-purple-700 text-xs font-semibold rounded-full uppercase tracking-wide mb-3">
              Rewards Program
            </span>
            <h2 className="text-4xl md:text-5xl font-semibold text-zinc-900 tracking-tight mb-4">
              Earn rewards as you train.
            </h2>
            <p className="text-xl text-zinc-500">
              Complete events, unlock achievements, and claim exclusive prizes.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
            {/* Achievement cards */}
            <div className="space-y-4">
              <AchievementCard
                icon="💧"
                title="10 Events Milestone"
                description="Complete 10 events to unlock"
                reward="MatUp x Hydro Flask Water Bottle"
                progress={3}
                total={10}
                bgColor="bg-emerald-50"
                textColor="text-emerald-700"
              />
              <AchievementCard
                icon="👕"
                title="25 Events Milestone"
                description="Complete 25 events to unlock"
                reward="MatUp x Lululemon Workout Shirt"
                progress={3}
                total={25}
                bgColor="bg-blue-50"
                textColor="text-blue-700"
              />
              <AchievementCard
                icon="🎒"
                title="50 Events Milestone"
                description="Complete 50 events to unlock"
                reward="MatUp x Nike Premium Gym Bag"
                progress={3}
                total={50}
                bgColor="bg-purple-50"
                textColor="text-purple-700"
              />
            </div>

            {/* Share pics feature */}
            <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 rounded-3xl p-8 text-white">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                  📸
                </div>
                <span className="font-semibold">Share Your Journey</span>
              </div>

              <h3 className="text-2xl font-bold mb-4">
                Document your fitness wins
              </h3>

              <p className="text-white/80 mb-6 leading-relaxed">
                After each event, share photos from your workout. Build your fitness portfolio, inspire others, and create lasting memories with your workout crew.
              </p>

              {/* Example gallery */}
              <div className="grid grid-cols-3 gap-2 mb-6">
                <div className="aspect-square rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-3xl">
                  🏃
                </div>
                <div className="aspect-square rounded-xl bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-3xl">
                  🎾
                </div>
                <div className="aspect-square rounded-xl bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center text-3xl">
                  🧘
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex -space-x-2">
                  <div className="w-8 h-8 rounded-full bg-emerald-400 border-2 border-zinc-900"></div>
                  <div className="w-8 h-8 rounded-full bg-blue-400 border-2 border-zinc-900"></div>
                  <div className="w-8 h-8 rounded-full bg-purple-400 border-2 border-zinc-900"></div>
                  <div className="w-8 h-8 rounded-full bg-pink-400 border-2 border-zinc-900 flex items-center justify-center text-xs font-semibold">
                    +99
                  </div>
                </div>
                <p className="text-sm text-white/60">
                  Join 2.5K members sharing their fitness journey
                </p>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="text-center">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full font-semibold hover:from-purple-700 hover:to-pink-700 transition-all duration-300 shadow-lg shadow-purple-500/25"
            >
              Start earning rewards
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* Community Photos */}
      <section className="py-16 bg-zinc-50">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-semibold text-zinc-900 tracking-tight mb-4">
              Join the movement.
            </h2>
            <p className="text-lg text-zinc-500">
              Thousands of people already training together.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 sm:gap-4">
            <div className="aspect-[3/4] rounded-xl sm:rounded-2xl overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=400&h=600&fit=crop"
                alt="Group running together outdoors"
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
              />
            </div>
            <div className="aspect-[3/4] rounded-xl sm:rounded-2xl overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=400&h=600&fit=crop"
                alt="Friends playing doubles tennis"
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
              />
            </div>
            <div className="aspect-[3/4] rounded-xl sm:rounded-2xl overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1599901860904-17e6ed7083a0?w=400&h=600&fit=crop"
                alt="Outdoor group yoga class"
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Activities Section */}
      <section className="py-24 bg-white border-y border-zinc-200">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-semibold text-zinc-900 tracking-tight mb-4">
              Every activity. One place.
            </h2>
            <p className="text-xl text-zinc-500">
              From morning runs to evening yoga sessions.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {ACTIVITIES.map((activity) => (
              <Link
                key={activity.label}
                href={`/events?sport=${activity.label.toLowerCase()}`}
                className="group relative p-6 rounded-2xl bg-zinc-100 border border-zinc-200 hover:bg-zinc-200 hover:border-zinc-300 transition-all duration-300"
              >
                <h3 className="text-lg font-semibold text-zinc-900 mb-1">
                  {activity.label}
                </h3>
                <p className="text-sm text-zinc-500">
                  {activity.description}
                </p>
                <svg
                  className="absolute top-6 right-6 w-5 h-5 text-zinc-300 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all duration-300"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 bg-zinc-100">
        <div className="max-w-[980px] mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-semibold text-zinc-900 tracking-tight mb-4">
              Simple by design.
            </h2>
            <p className="text-xl text-zinc-500">
              Get started in three easy steps.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-12 md:gap-8">
            <FeatureCard
              step="01"
              title="Create profile"
              description="Sign up in seconds. Add your favorite activities and skill level."
            />
            <FeatureCard
              step="02"
              title="Discover events"
              description="Browse local events or create your own. Filter by sport, location, and time."
            />
            <FeatureCard
              step="03"
              title="Connect & train"
              description="Join events, meet like-minded people, and elevate your fitness journey."
            />
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 bg-white border-t border-zinc-200">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-semibold text-zinc-900 tracking-tight">
              People love MatUp.
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <QuoteCard
              quote="Finally found a running group that matches my pace. We meet every Saturday morning!"
              author="Sarah K."
              role="Runner"
              image="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=faces"
            />
            <QuoteCard
              quote="I was looking for a tennis partner for months. Found one in my neighborhood within a week!"
              author="Mike T."
              role="Tennis Player"
              image="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=faces"
            />
            <QuoteCard
              quote="Created a yoga event and 8 people showed up. Now we practice together every week."
              author="Lisa M."
              role="Yoga Instructor"
              image="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=faces"
            />
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-32 bg-gradient-to-b from-zinc-50 to-zinc-200">
        <div className="max-w-[680px] mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-5xl font-semibold text-zinc-900 tracking-tight mb-6">
            Start moving together.
          </h2>
          <p className="text-xl text-zinc-500 mb-10">
            Join thousands of people who are already connecting through fitness.
          </p>
          <Link
            href="/signup"
            className="inline-flex px-8 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full text-lg font-medium transition-all duration-300 shadow-lg shadow-emerald-600/25"
          >
            Create free account
          </Link>
          <p className="text-sm text-zinc-400 mt-6">
            No credit card required
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-zinc-900">
        <div className="max-w-[980px] mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-xl font-semibold text-white">
              MatUp
            </div>
            <div className="flex gap-8 text-sm text-zinc-400">
              <Link href="/events" className="hover:text-white transition-colors">
                Events
              </Link>
              <Link href="/signup" className="hover:text-white transition-colors">
                Sign Up
              </Link>
              <Link href="/login" className="hover:text-white transition-colors">
                Log In
              </Link>
            </div>
            <p className="text-sm text-zinc-500">
              © 2025 MatUp
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  step,
  title,
  description,
}: {
  step: string;
  title: string;
  description: string;
}) {
  return (
    <div className="text-center">
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 text-sm font-semibold mb-6">
        {step}
      </div>
      <h3 className="text-xl font-semibold text-zinc-900 mb-3">
        {title}
      </h3>
      <p className="text-zinc-500 leading-relaxed">
        {description}
      </p>
    </div>
  );
}

function QuoteCard({
  quote,
  author,
  role,
  image,
}: {
  quote: string;
  author: string;
  role: string;
  image?: string;
}) {
  return (
    <div className="p-8 rounded-2xl bg-zinc-100 border border-zinc-200">
      <p className="text-zinc-700 text-lg leading-relaxed mb-6">
        &ldquo;{quote}&rdquo;
      </p>
      <div className="flex items-center gap-3">
        {image ? (
          <img
            src={image}
            alt={author}
            className="w-10 h-10 rounded-full object-cover"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-medium text-sm">
            {author[0]}
          </div>
        )}
        <div>
          <p className="font-medium text-zinc-900">{author}</p>
          <p className="text-sm text-zinc-500">{role}</p>
        </div>
      </div>
    </div>
  );
}
