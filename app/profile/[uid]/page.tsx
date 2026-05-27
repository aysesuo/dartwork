"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/lib/auth";
import { sanitize } from "@/lib/sanitize";
import { getDisciplineColor } from "@/lib/disciplines";
import AuthGuard from "@/components/auth/AuthGuard";

interface ProfileData {
  uid: string;
  displayName: string;
  gradYear: number;
  concentration: string;
  disciplines: string[];
  bio: string;
  isPrivate: boolean;
  onboardingComplete: boolean;
}

interface Project {
  id: string;
  title: string;
  description: string;
  discipline: string;
  positionsNeeded: string[];
  mediaUrl?: string | null;
  datePosted: string;
}

export default function ProfilePage() {
  return (
    <AuthGuard>
      <ProfileContent />
    </AuthGuard>
  );
}

function ProfileContent() {
  const { uid } = useParams<{ uid: string }>();
  const { user } = useAuth();
  const router = useRouter();

  const [profile,  setProfile]  = useState<ProfileData | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [error,    setError]    = useState<string | null>(null);
  const [loading,  setLoading]  = useState(true);

  const isOwner = user?.uid === uid;

  useEffect(() => {
    if (!user || !uid) return;
    (async () => {
      try {
        const idToken = await auth.currentUser!.getIdToken();
        const headers = { Authorization: `Bearer ${idToken}` };

        // Fetch profile and projects in parallel
        const [profileRes, projectsRes] = await Promise.all([
          fetch(`/api/users/${uid}`, { headers }),
          fetch(`/api/projects?uid=${uid}`, { headers }),
        ]);

        if (profileRes.status === 403) {
          const data = await profileRes.json();
          setError(data.error ?? "This profile is private");
          return;
        }
        if (profileRes.status === 404) { setError("Profile not found"); return; }
        if (!profileRes.ok)            { setError("Could not load profile"); return; }

        setProfile(await profileRes.json());
        if (projectsRes.ok) {
          setProjects(await projectsRes.json());
        } else {
          console.error("Projects fetch failed:", projectsRes.status, await projectsRes.text());
        }
      } catch {
        setError("Network error — please refresh");
      } finally {
        setLoading(false);
      }
    })();
  }, [user, uid]);

  if (loading) {
    return (
      <main className="max-w-2xl mx-auto px-4 py-10">
        <p className="text-sm" style={{ color: "#7fa88a" }}>Loading…</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="max-w-2xl mx-auto px-4 py-10 text-center">
        <div
          className="inline-flex flex-col items-center gap-4 rounded-3xl px-10 py-10"
          style={{ backgroundColor: "#132d1c", border: "1px solid #1e4430" }}
        >
          <span className="text-3xl">🔒</span>
          <p className="font-bold text-lg" style={{ color: "#f5f5f0" }}>{error}</p>
          <button
            onClick={() => router.back()}
            className="text-xs font-bold uppercase tracking-widest hover:opacity-70 transition-opacity"
            style={{ color: "#7fa88a" }}
          >
            ← Go back
          </button>
        </div>
      </main>
    );
  }

  if (!profile) return null;

  const safeName = sanitize(profile.displayName ?? "");
  const safeBio = sanitize(profile.bio ?? "");
  const safeConcentration = sanitize(profile.concentration ?? "");
  const initials = safeName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

  return (
    <main className="max-w-2xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="flex items-start gap-5 mb-8">
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center shrink-0 text-2xl font-bold text-white"
          style={{ backgroundColor: "#FF6B35" }}
        >
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <h1
            className="text-4xl font-extrabold uppercase tracking-tight font-[family-name:var(--font-barlow)] leading-tight"
            style={{ color: "#f5f5f0" }}
          >
            {safeName}
          </h1>
          <p className="text-sm mt-1" style={{ color: "#7fa88a" }}>
            {safeConcentration && <span>{safeConcentration} · </span>}
            {profile.gradYear && <span>Class of {profile.gradYear}</span>}
          </p>
        </div>
        {isOwner && (
          <Link
            href="/profile/edit"
            className="shrink-0 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-opacity hover:opacity-80"
            style={{ border: "1px solid #1e4430", color: "#7fa88a" }}
          >
            Edit
          </Link>
        )}
      </div>

      {/* Disciplines */}
      {profile.disciplines?.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          {profile.disciplines.map((d) => {
            const colors = getDisciplineColor(d);
            return (
              <span
                key={d}
                className={`${colors.tailwindBg} ${colors.tailwindText} px-3 py-1 rounded-full text-xs font-semibold`}
              >
                {d}
              </span>
            );
          })}
        </div>
      )}

      {/* Bio */}
      {safeBio && (
        <div
          className="rounded-2xl p-5 mb-6"
          style={{ backgroundColor: "#132d1c", border: "1px solid #1e4430" }}
        >
          <p className="text-sm leading-relaxed" style={{ color: "#c8ddd1" }}>
            {safeBio}
          </p>
        </div>
      )}

      {/* Projects */}
      {projects.length > 0 && (
        <div className="mt-8">
          <h2
            className="text-xs font-bold uppercase tracking-widest mb-4"
            style={{ color: "#7fa88a" }}
          >
            Projects
          </h2>
          <div className="flex flex-col gap-3">
            {projects.map((project) => (
              <div
                key={project.id}
                className="rounded-2xl p-5"
                style={{ backgroundColor: "#132d1c", border: "1px solid #1e4430" }}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <h3
                    className="font-bold text-base uppercase tracking-tight font-[family-name:var(--font-barlow)]"
                    style={{ color: "#f5f5f0" }}
                  >
                    {sanitize(project.title)}
                  </h3>
                  <span
                    className="shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full"
                    style={{
                      backgroundColor: "rgba(0,105,62,0.3)",
                      color: "#7fa88a",
                      border: "1px solid #1e4430",
                    }}
                  >
                    {project.discipline}
                  </span>
                </div>

                {project.positionsNeeded.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {project.positionsNeeded.map((pos) => (
                      <span
                        key={pos}
                        className="text-xs px-2 py-0.5 rounded"
                        style={{
                          backgroundColor: "rgba(255,107,53,0.15)",
                          color: "#FF6B35",
                          border: "1px solid rgba(255,107,53,0.3)",
                        }}
                      >
                        {sanitize(pos)}
                      </span>
                    ))}
                  </div>
                )}

                <p
                  className="text-sm leading-relaxed line-clamp-3"
                  style={{ color: "#c8ddd1" }}
                >
                  {sanitize(project.description)}
                </p>

                {project.mediaUrl && (
                  <a
                    href={project.mediaUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block mt-3 text-xs font-bold uppercase tracking-widest hover:opacity-70 transition-opacity"
                    style={{ color: "#7fa88a" }}
                  >
                    View media →
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Private badge */}
      {profile.isPrivate && isOwner && (
        <p className="text-xs mt-6" style={{ color: "#7fa88a" }}>
          🔒 Your profile is private — only people you approve can see it.
        </p>
      )}
    </main>
  );
}
