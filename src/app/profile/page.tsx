"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function redirectToPublicProfile() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/login");
        return;
      }

      router.replace(`/users/${user.id}`);
    }

    redirectToPublicProfile().finally(() => {
      setLoading(false);
    });
  }, [router]);

  return (
    <div className="min-h-screen bg-white">
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12 animate-pulse">
        <div className="h-8 w-56 bg-zinc-200 rounded-xl mb-3" />
        <div className="h-4 w-72 bg-zinc-100 rounded mb-8" />
        <div className="rounded-2xl border border-zinc-200 p-6 sm:p-8">
          <div className="h-6 w-48 bg-zinc-200 rounded mb-4" />
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 mb-6">
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <div key={`profile-redirect-skeleton-${item}`} className="h-24 rounded-2xl bg-zinc-100" />
            ))}
          </div>
          {loading && <div className="h-12 w-full bg-zinc-100 rounded-full" />}
        </div>
      </main>
    </div>
  );
}
