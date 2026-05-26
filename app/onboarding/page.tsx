"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/lib/auth";
import { DISCIPLINES } from "@/lib/disciplines";

const GRAD_YEARS = [2025, 2026, 2027, 2028, 2029];

export default function OnboardingPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  const [displayName, setDisplayName] = useState("");
  const [gradYear, setGradYear] = useState<number>(2028);
  const [concentration, setConcentration] = useState("");
  const [disciplines, setDisciplines] = useState<string[]>([]);
  const [bio, setBio] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [user, loading, router]);

  function toggleDiscipline(d: string) {
    setDisciplines((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

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
          authorizedViewers: [],
          onboardingComplete: true,
          createdAt: new Date().toISOString(),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Something went wrong");
        return;
      }

      router.replace("/projects");
    } catch {
      setError("Network error — please try again");
    } finally {
      setBusy(false);
    }
  }

  if (loading || !user) return null;

  return (
    <main className="max-w-lg mx-auto px-4 py-10">
      <h1
        className="text-4xl font-extrabold uppercase tracking-tight font-[family-name:var(--font-barlow)] mb-2"
        style={{ color: "#f5f5f0" }}
      >
        Set up your profile
      </h1>
      <p className="text-sm mb-8" style={{ color: "#7fa88a" }}>
        Tell the dArtwork community who you are.
      </p>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Display name */}
        <Field label="Display name">
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Your name"
            maxLength={80}
            required
            className={inputCls}
            style={inputStyle}
          />
        </Field>

        {/* Grad year */}
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

        {/* Concentration */}
        <Field label="Concentration (optional)">
          <input
            type="text"
            value={concentration}
            onChange={(e) => setConcentration(e.target.value)}
            placeholder="e.g. Computer Science"
            maxLength={80}
            className={inputCls}
            style={inputStyle}
          />
        </Field>

        {/* Disciplines */}
        <Field label="Disciplines (select all that apply)">
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

        {/* Bio */}
        <Field label="Bio (optional)">
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="A few words about your work..."
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
          <span className="text-sm" style={{ color: "#f5f5f0" }}>
            Private profile
          </span>
          <span className="text-xs" style={{ color: "#7fa88a" }}>
            (only people you approve can see your full profile)
          </span>
        </label>

        {error && (
          <p
            className="text-sm rounded-xl px-4 py-2"
            style={{ backgroundColor: "#3b0f0f", color: "#ff8a80" }}
          >
            {error}
          </p>
        )}

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={busy}
            className="flex-1 py-3 rounded-full text-xs font-bold uppercase tracking-widest text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            style={{ backgroundColor: "#00693E" }}
          >
            {busy ? "Saving…" : "Save & continue"}
          </button>
          <button
            type="button"
            onClick={() => signOut(auth).then(() => router.replace("/login"))}
            className="px-5 py-3 rounded-full text-xs font-bold uppercase tracking-widest transition-opacity hover:opacity-70"
            style={{ color: "#7fa88a", border: "1px solid #1e4430" }}
          >
            Sign out
          </button>
        </div>
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
