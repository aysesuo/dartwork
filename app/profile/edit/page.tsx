"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useAuth, requireDartmouth } from "@/lib/auth";
import { sanitize } from "@/lib/sanitize";
import { DISCIPLINES } from "@/lib/disciplines";

const GRAD_YEARS = [2025, 2026, 2027, 2028, 2029];

interface ProfileData {
  displayName: string;
  gradYear: number;
  concentration: string;
  disciplines: string[];
  bio: string;
  isPrivate: boolean;
  authorizedViewers: string[];
  onboardingComplete: boolean;
}

export default function EditProfilePage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [displayName, setDisplayName] = useState("");
  const [gradYear, setGradYear] = useState<number>(2028);
  const [concentration, setConcentration] = useState("");
  const [disciplines, setDisciplines] = useState<string[]>([]);
  const [bio, setBio] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [authorizedViewers, setAuthorizedViewers] = useState<string[]>([]);
  const [newViewer, setNewViewer] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const idToken = await user.getIdToken();
        const res = await fetch(`/api/users/${user.uid}`, {
          headers: { Authorization: `Bearer ${idToken}` },
        });
        if (res.status === 404) { router.replace("/onboarding"); return; }
        if (!res.ok) { setFetchError("Could not load your profile"); return; }
        const data: ProfileData = await res.json();
        // Sanitize before populating form fields
        setDisplayName(sanitize(data.displayName ?? ""));
        setGradYear(data.gradYear ?? 2028);
        setConcentration(sanitize(data.concentration ?? ""));
        setDisciplines(data.disciplines ?? []);
        setBio(sanitize(data.bio ?? ""));
        setIsPrivate(data.isPrivate ?? false);
        setAuthorizedViewers(data.authorizedViewers ?? []);
        setProfile(data);
      } catch {
        setFetchError("Network error — please refresh");
      }
    })();
  }, [user, router]);

  function toggleDiscipline(d: string) {
    setDisciplines((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]
    );
  }

  function addViewer() {
    const v = newViewer.trim().toLowerCase();
    if (!v) return;
    if (!requireDartmouth(v)) {
      setError("Viewer must have a @dartmouth.edu address");
      return;
    }
    if (authorizedViewers.includes(v)) {
      setError("Already added");
      return;
    }
    setAuthorizedViewers((prev) => [...prev, v]);
    setNewViewer("");
    setError(null);
  }

  function removeViewer(v: string) {
    setAuthorizedViewers((prev) => prev.filter((x) => x !== v));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!displayName.trim()) { setError("Display name is required"); return; }
    if (disciplines.length === 0) { setError("Select at least one discipline"); return; }

    setBusy(true);
    try {
      const idToken = await user!.getIdToken();
      const res = await fetch(`/api/users/${user!.uid}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          displayName: displayName.trim(),
          gradYear,
          concentration: concentration.trim(),
          disciplines,
          bio: bio.trim(),
          isPrivate,
          authorizedViewers,
          onboardingComplete: profile?.onboardingComplete ?? true,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Something went wrong");
        return;
      }

      setSuccess(true);
    } catch {
      setError("Network error — please try again");
    } finally {
      setBusy(false);
    }
  }

  if (loading || !user) return null;

  if (fetchError) {
    return (
      <main className="max-w-lg mx-auto px-4 py-10">
        <p style={{ color: "#ff8a80" }}>{fetchError}</p>
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="max-w-lg mx-auto px-4 py-10">
        <p style={{ color: "#7fa88a" }}>Loading…</p>
      </main>
    );
  }

  return (
    <main className="max-w-lg mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-8">
        <h1
          className="text-4xl font-extrabold uppercase tracking-tight font-[family-name:var(--font-barlow)]"
          style={{ color: "#f5f5f0" }}
        >
          Edit Profile
        </h1>
        <button
          onClick={() => signOut(auth).then(() => router.replace("/login"))}
          className="text-xs font-bold uppercase tracking-widest transition-opacity hover:opacity-70"
          style={{ color: "#7fa88a" }}
        >
          Sign out
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <Field label="Display name">
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            maxLength={80}
            required
            className={inputCls}
            style={inputStyle}
          />
        </Field>

        <Field label="Graduation year">
          <select
            value={gradYear}
            onChange={(e) => setGradYear(Number(e.target.value))}
            className={inputCls}
            style={inputStyle}
          >
            {GRAD_YEARS.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </Field>

        <Field label="Concentration (optional)">
          <input
            type="text"
            value={concentration}
            onChange={(e) => setConcentration(e.target.value)}
            maxLength={80}
            className={inputCls}
            style={inputStyle}
          />
        </Field>

        <Field label="Disciplines">
          <div className="flex flex-wrap gap-2 mt-1">
            {DISCIPLINES.map((d) => {
              const active = disciplines.includes(d);
              return (
                <button
                  key={d}
                  type="button"
                  onClick={() => toggleDiscipline(d)}
                  className="px-3 py-1 rounded-full text-xs font-semibold transition-colors"
                  style={{
                    backgroundColor: active ? "#00693E" : "#132d1c",
                    color: active ? "#fff" : "#7fa88a",
                    border: `1px solid ${active ? "#00693E" : "#1e4430"}`,
                  }}
                >
                  {d}
                </button>
              );
            })}
          </div>
        </Field>

        <Field label="Bio (optional)">
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            maxLength={400}
            rows={4}
            className={`${inputCls} rounded-2xl resize-none`}
            style={inputStyle}
          />
        </Field>

        {/* Privacy */}
        <label className="flex items-center gap-3 cursor-pointer select-none">
          <div
            onClick={() => setIsPrivate((p) => !p)}
            className="w-10 h-6 rounded-full transition-colors flex items-center px-1"
            style={{ backgroundColor: isPrivate ? "#FF6B35" : "#1e4430" }}
          >
            <div
              className="w-4 h-4 rounded-full bg-white transition-transform"
              style={{ transform: isPrivate ? "translateX(16px)" : "translateX(0)" }}
            />
          </div>
          <span className="text-sm" style={{ color: "#f5f5f0" }}>Private profile</span>
        </label>

        {/* Authorized viewers */}
        {isPrivate && (
          <Field label="Authorized viewers">
            <div className="space-y-2">
              {authorizedViewers.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {authorizedViewers.map((v) => (
                    <span
                      key={v}
                      className="flex items-center gap-1 px-3 py-1 rounded-full text-xs"
                      style={{ backgroundColor: "#132d1c", border: "1px solid #1e4430", color: "#7fa88a" }}
                    >
                      {v}
                      <button
                        type="button"
                        onClick={() => removeViewer(v)}
                        className="ml-1 hover:text-white"
                        aria-label={`Remove ${v}`}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <input
                  type="email"
                  value={newViewer}
                  onChange={(e) => setNewViewer(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addViewer())}
                  placeholder="peer@dartmouth.edu"
                  className={`${inputCls} flex-1`}
                  style={inputStyle}
                />
                <button
                  type="button"
                  onClick={addViewer}
                  className="px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest text-white"
                  style={{ backgroundColor: "#00693E" }}
                >
                  Add
                </button>
              </div>
            </div>
          </Field>
        )}

        {error && (
          <p className="text-sm rounded-xl px-4 py-2" style={{ backgroundColor: "#3b0f0f", color: "#ff8a80" }}>
            {error}
          </p>
        )}
        {success && (
          <p className="text-sm rounded-xl px-4 py-2" style={{ backgroundColor: "#0d2e1a", color: "#69e5a0" }}>
            Profile saved.
          </p>
        )}

        <button
          type="submit"
          disabled={busy}
          className="w-full py-3 rounded-full text-xs font-bold uppercase tracking-widest text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          style={{ backgroundColor: "#00693E" }}
        >
          {busy ? "Saving…" : "Save changes"}
        </button>
      </form>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-bold uppercase tracking-widest mb-1.5" style={{ color: "#7fa88a" }}>
        {label}
      </label>
      {children}
    </div>
  );
}

const inputCls =
  "w-full rounded-full px-5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-700";
const inputStyle = {
  backgroundColor: "#132d1c",
  border: "1px solid #1e4430",
  color: "#f5f5f0",
} as const;
