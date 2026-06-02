"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { auth, storage } from "@/lib/firebase";
import { useAuth } from "@/lib/auth";
import { DISCIPLINES } from "@/lib/disciplines";

const GRAD_YEARS = [2025, 2026, 2027, 2028, 2029];

export default function OnboardingPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  const [displayName,  setDisplayName]  = useState("");
  const [gradYear,     setGradYear]     = useState<number>(2028);
  const [concentration,setConcentration]= useState("");
  const [disciplines,  setDisciplines]  = useState<string[]>([]);
  const [bio,          setBio]          = useState("");
  const [isPrivate,    setIsPrivate]    = useState(false);

  // Photo state
  const [photoFile,    setPhotoFile]    = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [uploading,    setUploading]    = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [error,  setError]  = useState<string | null>(null);
  const [busy,   setBusy]   = useState(false);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
    // Pre-fill photo from Google account if available
    if (user?.photoURL) setPhotoPreview(user.photoURL);
  }, [user, loading, router]);

  function toggleDiscipline(d: string) {
    setDisciplines((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]
    );
  }

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setPhotoPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  async function uploadPhoto(uid: string): Promise<string | null> {
    if (!photoFile) return user?.photoURL ?? null;
    setUploading(true);
    try {
      const compressed = await compressImage(photoFile, 480);
      const storageRef  = ref(storage, `profile-photos/${uid}`);
      await uploadBytes(storageRef, compressed, { contentType: "image/jpeg" });
      return await getDownloadURL(storageRef);
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
      const photoURL = await uploadPhoto(user!.uid);
      const idToken  = await user!.getIdToken();
      const res = await fetch(`/api/users/${user!.uid}`, {
        method:  "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({
          displayName:        displayName.trim(),
          gradYear,
          concentration:      concentration.trim(),
          disciplines,
          bio:                bio.trim(),
          isPrivate,
          photoURL,
          authorizedViewers:  [],
          onboardingComplete: true,
          createdAt:          new Date().toISOString(),
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

  const initials = displayName.trim()
    ? displayName.trim().split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : user.email?.[0]?.toUpperCase() ?? "?";

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

        {/* ── Profile photo ── */}
        <Field label="Profile photo (optional)">
          <div className="flex items-center gap-5">
            {/* Preview */}
            <div
              style={{
                width: 80, height: 80, borderRadius: "50%",
                overflow: "hidden", flexShrink: 0,
                backgroundColor: "#1e4430", border: "2px solid #1e4430",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              {photoPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={photoPreview} alt="Preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
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
                {photoPreview ? "Change photo" : "Add photo"}
              </button>
              {photoPreview && (
                <button
                  type="button"
                  onClick={() => { setPhotoFile(null); setPhotoPreview(null); }}
                  className="text-xs hover:opacity-70 transition-opacity text-left"
                  style={{ color: "#7fa88a" }}
                >
                  Remove
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
          <span className="text-sm" style={{ color: "#f5f5f0" }}>Private profile</span>
          <span className="text-xs" style={{ color: "#7fa88a" }}>
            (only people you approve can see your full profile)
          </span>
        </label>

        {error && (
          <p className="text-sm rounded-xl px-4 py-2" style={{ backgroundColor: "#3b0f0f", color: "#ff8a80" }}>
            {error}
          </p>
        )}

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={busy || uploading}
            className="flex-1 py-3 rounded-full text-xs font-bold uppercase tracking-widest text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            style={{ backgroundColor: "#00693E" }}
          >
            {uploading ? "Uploading photo…" : busy ? "Saving…" : "Save & continue"}
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
