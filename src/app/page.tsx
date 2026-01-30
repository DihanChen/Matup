import Link from "next/link";
import Navbar from "@/components/Navbar";

const ACTIVITIES = [
  { icon: "🏃", label: "Running", color: "from-orange-400 to-red-500" },
  { icon: "🎾", label: "Tennis", color: "from-lime-400 to-green-500" },
  { icon: "🚴", label: "Cycling", color: "from-blue-400 to-indigo-500" },
  { icon: "💪", label: "Gym", color: "from-purple-400 to-pink-500" },
  { icon: "🧘", label: "Yoga", color: "from-teal-400 to-cyan-500" },
  { icon: "🏀", label: "Basketball", color: "from-amber-400 to-orange-500" },
  { icon: "⚽", label: "Soccer", color: "from-emerald-400 to-teal-500" },
  { icon: "🏊", label: "Swimming", color: "from-sky-400 to-blue-500" },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900 overflow-hidden">
      {/* Hero Section */}
      <div className="relative">
        {/* Animated Background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-400/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute top-20 -left-20 w-60 h-60 bg-cyan-400/20 rounded-full blur-3xl animate-pulse delay-1000" />
          <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-teal-400/20 rounded-full blur-3xl animate-pulse delay-500" />
        </div>

        {/* Navigation */}
        <div className="relative z-50">
          <Navbar />
        </div>

        {/* Hero Content */}
        <main className="relative z-10 max-w-7xl mx-auto px-6 pt-16 pb-24">
          <div className="text-center max-w-4xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-full text-sm font-medium mb-8">
              <span className="animate-bounce">🎉</span>
              <span>Join 1,000+ fitness enthusiasts today</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-5xl md:text-7xl font-extrabold text-zinc-900 dark:text-white mb-6 leading-tight">
              Find Your{" "}
              <span className="bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 bg-clip-text text-transparent">
                Workout Buddy
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-zinc-600 dark:text-zinc-400 mb-10 max-w-2xl mx-auto">
              Stop working out alone. Connect with people who share your passion for fitness. Create events, join activities, and make every workout count.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                href="/signup"
                className="group flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-2xl text-lg font-bold hover:from-emerald-600 hover:to-teal-600 transition-all shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:shadow-emerald-500/30 hover:scale-105"
              >
                <span>Get Started - It&apos;s Free</span>
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </Link>
              <Link
                href="/events"
                className="flex items-center gap-2 px-8 py-4 border-2 border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-2xl text-lg font-medium hover:border-emerald-500 hover:text-emerald-600 transition-all"
              >
                <span>🔍</span>
                <span>Explore Events</span>
              </Link>
            </div>

            {/* Quick Stats */}
            <div className="flex flex-wrap justify-center gap-8 mt-12 text-center">
              <div>
                <div className="text-3xl font-bold text-zinc-900 dark:text-white">500+</div>
                <div className="text-zinc-500">Active Events</div>
              </div>
              <div className="w-px h-12 bg-zinc-200 dark:bg-zinc-700 hidden sm:block" />
              <div>
                <div className="text-3xl font-bold text-zinc-900 dark:text-white">10+</div>
                <div className="text-zinc-500">Sports</div>
              </div>
              <div className="w-px h-12 bg-zinc-200 dark:bg-zinc-700 hidden sm:block" />
              <div>
                <div className="text-3xl font-bold text-zinc-900 dark:text-white">100%</div>
                <div className="text-zinc-500">Free to Join</div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Activities Grid */}
      <section className="py-20 bg-white dark:bg-zinc-800/50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-zinc-900 dark:text-white mb-4">
              Pick Your Sport, Find Your Crew
            </h2>
            <p className="text-lg text-zinc-600 dark:text-zinc-400">
              From early morning runs to weekend basketball games
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {ACTIVITIES.map((activity) => (
              <Link
                key={activity.label}
                href={`/events?sport=${activity.label.toLowerCase()}`}
                className="group relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br from-zinc-100 to-zinc-50 dark:from-zinc-800 dark:to-zinc-900 border border-zinc-200 dark:border-zinc-700 hover:border-emerald-500 transition-all hover:scale-105 hover:shadow-xl"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${activity.color} opacity-0 group-hover:opacity-10 transition-opacity`} />
                <div className="text-5xl mb-3 group-hover:scale-110 transition-transform">{activity.icon}</div>
                <div className="font-bold text-zinc-900 dark:text-white text-lg">{activity.label}</div>
                <div className="text-sm text-zinc-500 mt-1">Find partners →</div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-gradient-to-br from-emerald-50 via-white to-cyan-50 dark:from-zinc-900 dark:via-zinc-900 dark:to-zinc-800">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-zinc-900 dark:text-white mb-4">
              Ready in 3 Simple Steps
            </h2>
            <p className="text-lg text-zinc-600 dark:text-zinc-400">
              From signup to your first workout in minutes
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <StepCard
              number="1"
              icon="✍️"
              title="Create Your Profile"
              description="Sign up in 30 seconds. Add your favorite activities and set your fitness level."
            />
            <StepCard
              number="2"
              icon="🔍"
              title="Find or Create Events"
              description="Browse local events or create your own. Morning runs, tennis matches, gym sessions - you name it."
            />
            <StepCard
              number="3"
              icon="🤝"
              title="Meet & Move"
              description="Join events, meet awesome people, and crush your fitness goals together."
            />
          </div>

          <div className="text-center mt-12">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 px-8 py-4 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-2xl text-lg font-bold hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-all hover:scale-105"
            >
              <span>Start Your Journey</span>
              <span>🚀</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-20 bg-white dark:bg-zinc-800/50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-zinc-900 dark:text-white mb-4">
              Real People, Real Results
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <TestimonialCard
              quote="Finally found a running group that matches my pace. We meet every Saturday morning!"
              name="Sarah K."
              activity="Running"
              emoji="🏃‍♀️"
            />
            <TestimonialCard
              quote="I was looking for a tennis partner for months. Found one in my neighborhood within a week!"
              name="Mike T."
              activity="Tennis"
              emoji="🎾"
            />
            <TestimonialCard
              quote="Created a yoga event and 8 people showed up. Now we practice together every week."
              name="Lisa M."
              activity="Yoga"
              emoji="🧘‍♀️"
            />
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-10 left-10 text-8xl animate-bounce delay-100">🏃</div>
          <div className="absolute top-20 right-20 text-7xl animate-bounce delay-300">💪</div>
          <div className="absolute bottom-10 left-1/4 text-6xl animate-bounce delay-500">🎾</div>
          <div className="absolute bottom-20 right-1/3 text-8xl animate-bounce delay-700">🚴</div>
        </div>

        <div className="relative max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-6">
            Your Next Workout Buddy Is Waiting
          </h2>
          <p className="text-xl text-white/90 mb-10 max-w-2xl mx-auto">
            Join thousands of fitness enthusiasts who are already connecting, moving, and crushing their goals together.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-3 px-10 py-5 bg-white text-emerald-600 rounded-2xl text-xl font-bold hover:bg-zinc-100 transition-all shadow-2xl hover:scale-105"
          >
            <span>Create Free Account</span>
            <span className="text-2xl">→</span>
          </Link>
          <p className="text-white/70 mt-6 text-sm">
            No credit card required. Free forever.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-zinc-900 py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-2xl font-bold text-emerald-500">MatUp</div>
            <div className="flex gap-6 text-zinc-400">
              <Link href="/events" className="hover:text-white transition-colors">Events</Link>
              <Link href="/signup" className="hover:text-white transition-colors">Sign Up</Link>
              <Link href="/login" className="hover:text-white transition-colors">Log In</Link>
            </div>
            <p className="text-zinc-500 text-sm">&copy; 2025 MatUp. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function StepCard({
  number,
  icon,
  title,
  description,
}: {
  number: string;
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <div className="relative p-8 bg-white dark:bg-zinc-800 rounded-3xl border border-zinc-200 dark:border-zinc-700 shadow-sm hover:shadow-xl transition-all">
      {/* Step number badge */}
      <div className="absolute -top-4 -left-4 w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
        {number}
      </div>
      <div className="text-5xl mb-4">{icon}</div>
      <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-3">{title}</h3>
      <p className="text-zinc-600 dark:text-zinc-400">{description}</p>
    </div>
  );
}

function TestimonialCard({
  quote,
  name,
  activity,
  emoji,
}: {
  quote: string;
  name: string;
  activity: string;
  emoji: string;
}) {
  return (
    <div className="p-6 bg-gradient-to-br from-zinc-50 to-white dark:from-zinc-800 dark:to-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-700">
      <div className="text-4xl mb-4">{emoji}</div>
      <p className="text-zinc-700 dark:text-zinc-300 mb-4 italic">&quot;{quote}&quot;</p>
      <div className="flex items-center gap-2">
        <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center text-white font-bold">
          {name[0]}
        </div>
        <div>
          <div className="font-medium text-zinc-900 dark:text-white">{name}</div>
          <div className="text-sm text-zinc-500">{activity} enthusiast</div>
        </div>
      </div>
    </div>
  );
}
