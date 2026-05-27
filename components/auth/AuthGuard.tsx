"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.replace("/login");
      return;
    }

    if (!user.emailVerified) {
      router.replace("/login?reason=unverified");
      return;
    }

    (async () => {
      try {
        const idToken = await user.getIdToken();
        const res = await fetch(`/api/users/${user.uid}`, {
          headers: { Authorization: `Bearer ${idToken}` },
        });
        if (res.status === 404) {
          router.replace("/onboarding");
          return;
        }
        if (res.ok) {
          const data = await res.json();
          if (!data.onboardingComplete) {
            router.replace("/onboarding");
            return;
          }
        }
        setReady(true);
      } catch {
        router.replace("/login");
      }
    })();
  }, [user, loading, router]);

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="text-sm" style={{ color: "#7fa88a" }}>Loading…</span>
      </div>
    );
  }

  return <>{children}</>;
}
