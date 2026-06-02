"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { auth, storage } from "@/lib/firebase";
import { useAuth, requireDartmouth } from "@/lib/auth";
import { sanitize } from "@/lib/sanitize";
import { DISCIPLINES } from "@/lib/disciplines";
import { SKILLS } from "@/lib/skills";
import { INTERESTS } from "@/lib/interests";

const GRAD_YEARS = [2025, 2026, 2027, 2028, 2029];

interface ProfileData {
  displayName:        string;
  gradYear:           number;
  disciplines:        string[];
  skills:             string[];
  interests:          string[];
  bio:                string;
  isPrivate:          boolean;
  authorizedViewers:  string[];
  onboardingComplete: boolean;
  photoURL?:          string | null;
}

export default function EditProfilePage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  const [profile,    setProfile]    = useState<ProfileData | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [displayName,   setDisplayName]   = useState("");
  const [gradYear,      setGradYear]      = useState<number>(2028);
  const [disciplines,   setDisciplines]   = useState<string[]>([]);
  const [skills,        setSkills]        = useState<string[]>([]);
  const [interests,     setInterests]     = useState<string[]>([]);
  const [bio,           setBio]           = useState("");
  const [isPrivate,     setIsPrivate]     = useState(false);
  const [authorizedViewers, setAuthorizedViewers] = useState<string[]>([]);
  const [newViewer,     setNewViewer]     = useState("");

  // Photo state
  const [currentPhotoURL, setCurrentPhotoURL] = useState<string | null>(null);
  const [photoFile,       setPhotoFile]       = useState<File | null>(null);
  const [photoPreview,    setPhotoPreview]     = useState<string | null>(null);
  const [uploading,       setUploading]        = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [error, setError] = useState<string | null>(null);
  const [busy,  setBusy]  = useState(false);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const idToken = await user.getIdToken(true);
        const res = await fetch(`/api/users/${user.uid}`, {
          headers: { Authorization: `Bearer ${idToken}` },
        });
        if (res.status === 404) { router.replace("/onboarding"); return; }
        if (!res.ok) { setFetchError("Could not load your profile"); return; }
        const data: ProfileData = await res.json();
        setDisplayName(sanitize(data.displayName ?? ""));
        setGradYear(data.gradYear ?? 2028);
        setDisciplines(data.disciplines ?? []);
        setSkills(data.skills ?? []);
        setInterests(data.interests ?? []);
        setBio(sanitize(data.bio ?? ""));
        setIsPrivate(data.isPrivate ?? false);
        setAuthorizedViewers(data.authorizedViewers ?? []);
        setCurrentPhotoURL(data.photoURL ?? null);
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

  function toggleSkill(s: string) {
    setSkills((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  }

  function toggleInterest(i: string) {
    setInterests((prev) =>
      prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]
    );
  }

  function addViewer() {
    const v = newViewer.trim().toLowerCase();
    if (!v) return;
    if (!requireDartmouth(v)) { setError("Viewer must have a @dartmouth.edu address"); return; }
    if (authorizedViewers.includes(v)) { setError("Already added"); return; }
    setAuthorizedViewers((prev) => [...prev, v]);
    setNewViewer("");
    setError(null);
  }

  function removeViewer(v: string) {
    setAuthorizedViewers((prev) => prev.filter((x) => x !== v));
  }

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setPhotoPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  async function uploadPhoto(): Promise<string | null> {
    if (!photoFile) return currentPhotoURL;
    setUploading(true);
    try {
      const compressed = await compressImage(photoFile, 480);
      const storageRef  = ref(storage, `profile-photos/${user!.uid}`);
      await uploadBytes(storageRef, compressed, { contentType: "image/jpeg" });
      const url = await getDownloadURL(storageRef);
      setCurrentPhotoURL(url);
      setPhotoFile(null);
      setPhotoPreview(null);
      return url;
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!displayName.trim()) { setError("Display name is required"); return; }
    if (disciplines.length === 0) { setError("Select at least one discipline"); return; }

    setBusy(true);
    try {
      const photoURL = await uploadPhoto();
      const idToken  = await user!.getIdToken(true);
      const res = await fetch(`/api/users/${user!.uid}`, {
        method:  "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({
          displayName:       displayName.trim(),
          gradYear,
          disciplines,
          skills,
          interests,
          bio:               bio.trim(),
          isPrivate,
          authorizedViewers,
          photoURL,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Something went wrong");
        return;
      }

      router.push(`/profile/${user!.uid}`);
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

  const displayedPhoto = photoPreview ?? currentPhotoURL;
  const initials = displayName.trim()
    ? displayName.trim().split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : user.email?.[0]?.toUpperCase() ?? "?";

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

        {/* ── Profile photo ── */}
        <Field label="Profile photo">
          <div className="flex items-center gap-5">
            <div
              style={{
                width: 80, height: 80, borderRadius: "50%",
                overflow: "hidden", flexShrink: 0,
                backgroundColor: "#1e4430", border: "2px solid #1e4430",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              {displayedPhoto ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={displayedPhoto} alt="Preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <span style={{ color: "#7fa88a", fontWeight: 700, fontSize: "1.4rem" }}>{initials}</span>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-opacity hover:opacity-80"
                style={{ border: "1px solid #1e4430", color: "#7fa88a" }}
              >
                {displayedPhoto ? "Change photo" : "Add photo"}
              </button>
              {displayedPhoto && (
                <button
                  type="button"
                  onClick={() => { setPhotoFile(null); setPhotoPreview(null); setCurrentPhotoURL(null); }}
                  className="text-xs hover:opacity-70 transition-opacity text-left"
                  style={{ color: "#7fa88a" }}
                >
                  Remove photo
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                style={{ display: "none" }}
              />
            </div>
          </div>
        </Field>

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
                    color:  active ? "#fff" : "#7fa88a",
                    border: `1px solid ${active ? "#00693E" : "#1e4430"}`,
                  }}
                >
                  {d}
                </button>
              );
            })}
          </div>
        </Field>

        <Field label="Skills">
          <div className="flex flex-wrap gap-2 mt-1">
            {SKILLS.map((s) => {
              const active = skills.includes(s);
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => toggleSkill(s)}
                  className="px-3 py-1 rounded-full text-xs font-semibold transition-colors"
                  style={{
                    backgroundColor: active ? "#00693E" : "#132d1c",
                    color:  active ? "#fff" : "#7fa88a",
                    border: `1px solid ${active ? "#00693E" : "#1e4430"}`,
                  }}
                >
                  {s}
                </button>
              );
            })}
          </div>
        </Field>

        <Field label="Interests">
          <div className="flex flex-wrap gap-2 mt-1">
            {INTERESTS.map((i) => {
              const active = interests.includes(i);
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => toggleInterest(i)}
                  className="px-3 py-1 rounded-full text-xs font-semibold transition-colors"
                  style={{
                    backgroundColor: active ? "#00693E" : "#132d1c",
                    color:  active ? "#fff" : "#7fa88a",
                    border: `1px solid ${active ? "#00693E" : "#1e4430"}`,
                  }}
                >
                  {i}
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

        <button
          type="submit"
          disabled={busy || uploading}
          className="w-full py-3 rounded-full text-xs font-bold uppercase tracking-widest text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          style={{ backgroundColor: "#00693E" }}
        >
          {uploading ? "Uploading photo…" : busy ? "Saving…" : "Save changes"}
        </button>
      </form>
    </main>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────
async function compressImage(file: File, maxDim = 480): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const scale  = Math.min(1, maxDim / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width  = Math.round(img.width  * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error("Compression failed"))),
        "image/jpeg",
        0.85,
      );
    };
    img.onerror = reject;
    img.src = url;
  });
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
