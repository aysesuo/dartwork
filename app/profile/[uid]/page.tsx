"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { sanitize } from "@/lib/sanitize";
import { getDisciplineColor } from "@/lib/disciplines";
import AuthGuard from "@/components/auth/AuthGuard";
import ProjectCard from "@/components/project/ProjectCard";

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
  tags: string[];
  creatorName: string;
  mediaUrl?: string | null;
  datePosted: string;
  // owner-only fields
  showOnProfile?: boolean;
  status?: string;
  creatorUid?: string;
}

export default function ProfilePage() {
  return (
    <AuthGuard>
      <ProfileContent />
    </AuthGuard>
  );
}

function ProfileContent() {
  const { uid }    = useParams<{ uid: string }>();
  const { user }   = useAuth();
  const router     = useRouter();

  const [profile,  setProfile]  = useState<ProfileData | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [error,    setError]    = useState<string | null>(null);
  const [loading,  setLoading]  = useState(true);

  const isOwner = user?.uid === uid;

  useEffect(() => {
    if (!user || !uid) return;
    (async () => {
      try {
        const idToken = await user.getIdToken(true);
        const headers = { Authorization: `Bearer ${idToken}` };

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
        if (projectsRes.ok) setProjects(await projectsRes.json());
      } catch {
        setError("Network error — please refresh");
      } finally {
        setLoading(false);
      }
    })();
  }, [user, uid]);

  // ── Project controls ───────────────────────────────────────────────────────
  const [busyId, setBusyId] = useState<string | null>(null);

  const patchProject = useCallback(
    async (projectId: string, patch: Record<string, unknown>) => {
      if (!user) return;
      setBusyId(projectId);
      try {
        const token = await user.getIdToken(true);
        const res   = await fetch(`/api/projects/${projectId}`, {
          method:  "PATCH",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body:    JSON.stringify(patch),
        });
        if (!res.ok) {
          const d = await res.json().catch(() => ({}));
          alert(d.error ?? "Could not update project.");
          return;
        }
        setProjects((prev) =>
          prev.map((p) => (p.id === projectId ? { ...p, ...patch } : p)),
        );
      } catch {
        alert("Network error — please try again.");
      } finally {
        setBusyId(null);
      }
    },
    [user],
  );

  const deleteProject = useCallback(
    async (projectId: string) => {
      if (!user) return;
      if (!confirm("Permanently delete this project? This cannot be undone.")) return;
      setBusyId(projectId);
      try {
        const token = await user.getIdToken(true);
        const res   = await fetch(`/api/projects/${projectId}`, {
          method:  "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          const d = await res.json().catch(() => ({}));
          alert(d.error ?? "Could not delete project.");
          return;
        }
        setProjects((prev) => prev.filter((p) => p.id !== projectId));
      } catch {
        alert("Network error — please try again.");
      } finally {
        setBusyId(null);
      }
    },
    [user],
  );

  // ── Loading / error / empty ────────────────────────────────────────────────
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

  const safeName          = sanitize(profile.displayName ?? "");
  const safeBio           = sanitize(profile.bio ?? "");
  const safeConcentration = sanitize(profile.concentration ?? "");
  const initials          = safeName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

  return (
    <main className="max-w-2xl mx-auto px-4 py-10">

      {/* ── Header ── */}
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
            Edit Profile
          </Link>
        )}
      </div>

      {/* ── Disciplines ── */}
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

      {/* ── Bio ── */}
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

      {/* ── Projects ── */}
      {projects.length > 0 && (
        <div className="mt-10">
          <h2
            className="text-xs font-bold uppercase tracking-widest mb-6"
            style={{ color: "#7fa88a" }}
          >
            Projects
          </h2>

          <div style={{ display: "flex", flexWrap: "wrap", gap: "2.5rem", justifyContent: "flex-start" }}>
            {projects.map((project, i) => {
              const busy = busyId === project.id;

              return (
                <div key={project.id} style={{ width: 270, flexShrink: 0 }}>
                  {/* Card */}
                  <ProjectCard project={project} index={i} decorated />

                  {/* Owner controls */}
                  {isOwner && (
                    <div
                      style={{
                        marginTop:     "0.75rem",
                        display:       "flex",
                        flexDirection: "column",
                        gap:           "0.45rem",
                      }}
                    >
                      {/* Show in Projects toggle */}
                      <ToggleRow
                        label="Show in Projects"
                        checked={project.status !== "closed"}
                        disabled={busy}
                        onChange={(on) =>
                          patchProject(project.id, { status: on ? "active" : "closed" })
                        }
                      />

                      {/* Show on Profile toggle */}
                      <ToggleRow
                        label="Show on Profile"
                        checked={project.showOnProfile !== false}
                        disabled={busy}
                        onChange={(on) =>
                          patchProject(project.id, { showOnProfile: on })
                        }
                      />

                      {/* Edit + Delete */}
                      <div style={{ display: "flex", gap: "0.4rem", marginTop: "0.2rem" }}>
                        <Link
                          href={`/projects/${project.id}/edit`}
                          style={controlBtn("#1e4430")}
                        >
                          Edit
                        </Link>
                        <button
                          disabled={busy}
                          onClick={() => deleteProject(project.id)}
                          style={controlBtn("#3b0f0f", "#ff8a80")}
                        >
                          {busy ? "…" : "Delete"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Post a project CTA (owner only, visible even if projects is empty) */}
      {isOwner && (
        <div className="mt-8 flex items-center gap-4">
          <Link
            href="/projects/new"
            className="px-5 py-2 rounded-full text-xs font-bold uppercase tracking-widest text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: "#FF6B35" }}
          >
            + Post a Project
          </Link>
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

function controlBtn(bg: string, color = "#f5f5f0"): React.CSSProperties {
  return {
    padding:         "0.25rem 0.7rem",
    borderRadius:    "999px",
    border:          `1px solid ${bg}`,
    backgroundColor: bg,
    color,
    fontSize:        "0.68rem",
    fontWeight:      700,
    textTransform:   "uppercase" as const,
    letterSpacing:   "0.1em",
    cursor:          "pointer",
    textDecoration:  "none",
    display:         "inline-block",
  };
}

function ToggleRow({
  label,
  checked,
  disabled,
  onChange,
}: {
  label:    string;
  checked:  boolean;
  disabled?: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div
      style={{
        display:        "flex",
        alignItems:     "center",
        justifyContent: "space-between",
        gap:            "0.5rem",
      }}
    >
      <span
        style={{
          fontSize:      "0.65rem",
          fontWeight:    700,
          textTransform: "uppercase",
          letterSpacing: "0.09em",
          color:         "#7fa88a",
        }}
      >
        {label}
      </span>

      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        style={{
          width:           36,
          height:          20,
          borderRadius:    10,
          border:          "none",
          backgroundColor: checked ? "#00693E" : "#374151",
          cursor:          disabled ? "not-allowed" : "pointer",
          position:        "relative",
          flexShrink:      0,
          transition:      "background-color 0.2s",
          opacity:         disabled ? 0.5 : 1,
        }}
      >
        <span
          style={{
            position:        "absolute",
            top:             3,
            left:            checked ? 19 : 3,
            width:           14,
            height:          14,
            borderRadius:    "50%",
            backgroundColor: "#fff",
            transition:      "left 0.2s",
            boxShadow:       "0 1px 3px rgba(0,0,0,0.3)",
          }}
        />
      </button>
    </div>
  );
}
