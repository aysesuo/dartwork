"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import AuthGuard from "@/components/auth/AuthGuard";
import { useAuth } from "@/lib/auth";
import { storage } from "@/lib/firebase";
import { DISCIPLINES } from "@/lib/disciplines";

const GREEN  = "#00693E";
const ORANGE = "#FF6B35";

// ── Shared input style ────────────────────────────────────────────────────────
const inputStyle: React.CSSProperties = {
  width:        "100%",
  padding:      "0.6rem 0.75rem",
  background:   "rgba(255,255,255,0.07)",
  border:       "1px solid rgba(255,255,255,0.18)",
  borderRadius: "6px",
  color:        "#f5f5f0",
  fontSize:     "0.9rem",
  fontFamily:   "var(--font-sans), sans-serif",
  outline:      "none",
  boxSizing:    "border-box",
};

const labelStyle: React.CSSProperties = {
  display:       "block",
  fontSize:      "0.7rem",
  fontWeight:    700,
  textTransform: "uppercase",
  letterSpacing: "0.12em",
  color:         "#f5f5f0",
  opacity:       0.7,
  marginBottom:  "0.4rem",
};

function Field({
  label,
  hint,
  required,
  children,
}: {
  label:     string;
  hint?:     string;
  required?: boolean;
  children:  React.ReactNode;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
      <label style={labelStyle}>
        {label}
        {required && <span style={{ color: ORANGE, marginLeft: 4 }}>*</span>}
      </label>
      {children}
      {hint && (
        <p style={{ fontSize: "0.7rem", color: "#f5f5f0", opacity: 0.45, marginTop: "0.3rem" }}>
          {hint}
        </p>
      )}
    </div>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      style={{
        width:           44,
        height:          24,
        borderRadius:    12,
        border:          "none",
        cursor:          "pointer",
        backgroundColor: checked ? GREEN : "rgba(255,255,255,0.2)",
        position:        "relative",
        transition:      "background 0.2s",
        flexShrink:      0,
      }}
    >
      <span
        style={{
          position:        "absolute",
          top:             3,
          left:            checked ? 23 : 3,
          width:           18,
          height:          18,
          borderRadius:    "50%",
          backgroundColor: "#fff",
          transition:      "left 0.2s",
          boxShadow:       "0 1px 3px rgba(0,0,0,0.3)",
        }}
      />
    </button>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function EditProjectPage() {
  return (
    <AuthGuard>
      <EditProjectContent />
    </AuthGuard>
  );
}

function EditProjectContent() {
  const { id }   = useParams<{ id: string }>();
  const router   = useRouter();
  const { user } = useAuth();

  const [fetchError, setFetchError] = useState<string | null>(null);
  const [loaded,     setLoaded]     = useState(false);

  const [title,         setTitle]         = useState("");
  const [description,   setDescription]   = useState("");
  const [discipline,    setDiscipline]    = useState("");
  const [rolesNeeded,   setRolesNeeded]   = useState("");
  const [teamSize,      setTeamSize]      = useState("");
  const [showOnProfile, setShowOnProfile] = useState(true);
  const [status,        setStatus]        = useState<"active" | "closed">("active");

  // Image upload state
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);
  const [imageFile,       setImageFile]       = useState<File | null>(null);
  const [imagePreview,    setImagePreview]     = useState<string | null>(null);
  const [uploading,       setUploading]        = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [submitting, setSubmitting] = useState(false);
  const [deleting,   setDeleting]   = useState(false);
  const [error,      setError]      = useState<string | null>(null);

  // Fetch existing project data
  useEffect(() => {
    if (!user || !id) return;
    (async () => {
      try {
        const token = await user.getIdToken(true);
        const res   = await fetch(`/api/projects/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.status === 403) { setFetchError("You don't have permission to edit this project."); return; }
        if (res.status === 404) { setFetchError("Project not found."); return; }
        if (!res.ok)            { setFetchError("Could not load project."); return; }

        const data = await res.json();
        setTitle(data.title ?? "");
        setDescription(data.description ?? "");
        setDiscipline(data.discipline ?? "");
        setRolesNeeded((data.positionsNeeded ?? []).join(", "));
        setTeamSize(data.teamSize == null ? "" : String(data.teamSize));
        setCurrentImageUrl(data.mediaUrl ?? null);
        setShowOnProfile(data.showOnProfile !== false);
        setStatus(data.status === "closed" ? "closed" : "active");
        setLoaded(true);
      } catch {
        setFetchError("Network error — please refresh.");
      }
    })();
  }, [user, id]);

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  async function uploadImage(): Promise<string | null> {
    if (!imageFile || !user) return currentImageUrl;
    setUploading(true);
    try {
      const compressed = await compressImage(imageFile, 1200);
      const imageId    = `${user.uid}_${id}`;
      const storageRef = ref(storage, `project-images/${imageId}`);
      await uploadBytes(storageRef, compressed, { contentType: "image/jpeg" });
      const url = await getDownloadURL(storageRef);
      setCurrentImageUrl(url);
      setImageFile(null);
      setImagePreview(null);
      return url;
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !id) return;
    setError(null);

    if (!title.trim())                   { setError("Project title is required."); return; }
    if (!discipline)                     { setError("Please select a discipline."); return; }
    if (description.trim().length < 10)  { setError("Description must be at least 10 characters."); return; }

    setSubmitting(true);
    try {
      const mediaUrl = await uploadImage();
      const token    = await user.getIdToken(true);
      const res = await fetch(`/api/projects/${id}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body:    JSON.stringify({
          title:         title.trim(),
          description:   description.trim(),
          discipline,
          rolesNeeded,
          teamSize:      teamSize === "" ? null : Number(teamSize),
          mediaUrl:      mediaUrl ?? "",
          showOnProfile,
          status,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? `Server error ${res.status}`);
      }

      router.push(`/profile/${user.uid}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!user || !id) return;
    if (!confirm("Are you sure? This cannot be undone.")) return;
    setDeleting(true);
    try {
      const token = await user.getIdToken(true);
      const res   = await fetch(`/api/projects/${id}`, {
        method:  "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error ?? `Server error ${res.status}`);
      }
      router.push(`/profile/${user.uid}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete project.");
      setDeleting(false);
    }
  }

  if (fetchError) {
    return (
      <main style={{ padding: "3rem 1rem" }}>
        <p style={{ color: "#ff8a80", maxWidth: 560, margin: "0 auto" }}>{fetchError}</p>
      </main>
    );
  }

  if (!loaded) {
    return (
      <main style={{ padding: "3rem 1rem" }}>
        <p style={{ color: "#7fa88a", maxWidth: 560, margin: "0 auto" }}>Loading…</p>
      </main>
    );
  }

  const displayedImage = imagePreview ?? currentImageUrl;

  return (
    <div
      style={{
        minHeight:     "100vh",
        padding:       "3rem 1rem 6rem",
        display:       "flex",
        flexDirection: "column",
        alignItems:    "center",
      }}
    >
      <div style={{ width: "100%", maxWidth: 560 }}>
        {/* Back link */}
        <a
          href={`/profile/${user?.uid}`}
          style={{
            display:        "inline-flex",
            alignItems:     "center",
            gap:            "0.3rem",
            fontSize:       "0.75rem",
            fontWeight:     700,
            textTransform:  "uppercase",
            letterSpacing:  "0.12em",
            color:          "#f5f5f0",
            opacity:        0.5,
            textDecoration: "none",
            marginBottom:   "2rem",
          }}
        >
          ← My profile
        </a>

        <h1
          style={{
            fontFamily:    "var(--font-barlow), sans-serif",
            fontSize:      "2rem",
            fontWeight:    800,
            textTransform: "uppercase",
            letterSpacing: "0.04em",
            color:         "#f5f5f0",
            marginBottom:  "0.4rem",
          }}
        >
          Edit Project
        </h1>
        <p style={{ fontSize: "0.85rem", color: "#f5f5f0", opacity: 0.55, marginBottom: "2.5rem" }}>
          Update your project details.
        </p>

        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}
          noValidate
        >
          {/* Title */}
          <Field label="Project Title" required>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={120}
              style={inputStyle}
              disabled={submitting}
            />
          </Field>

          {/* Discipline */}
          <Field label="Discipline" required>
            <select
              value={discipline}
              onChange={(e) => setDiscipline(e.target.value)}
              style={{ ...inputStyle, appearance: "none", cursor: "pointer" }}
              disabled={submitting}
            >
              <option value="" disabled>Select a discipline…</option>
              {DISCIPLINES.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </Field>

          {/* Description */}
          <Field label="Description" required hint="Minimum 10 characters.">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              maxLength={1200}
              style={{ ...inputStyle, resize: "vertical", lineHeight: 1.6 }}
              disabled={submitting}
            />
          </Field>

          {/* Roles needed */}
          <Field
            label="Roles you're looking for"
            hint="Separate multiple roles with commas or new lines."
          >
            <textarea
              value={rolesNeeded}
              onChange={(e) => setRolesNeeded(e.target.value)}
              rows={3}
              maxLength={400}
              style={{ ...inputStyle, resize: "vertical", lineHeight: 1.6 }}
              disabled={submitting}
            />
          </Field>

          {/* Team size */}
          <Field
            label="Team size"
            hint="How many people are working on this currently? Shown on your project page."
          >
            <input
              type="number"
              min={0}
              max={1000}
              value={teamSize}
              onChange={(e) => setTeamSize(e.target.value)}
              placeholder="e.g. 3"
              style={inputStyle}
              disabled={submitting}
            />
          </Field>

          {/* Project image upload */}
          <Field label="Project image" hint="Optional — a photo, poster, mood board, or anything that shows your vision.">
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>

              {/* Preview */}
              {displayedImage && (
                <div
                  style={{
                    width:        "100%",
                    maxHeight:    240,
                    overflow:     "hidden",
                    borderRadius: 8,
                    border:       "1px solid rgba(255,255,255,0.15)",
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={displayedImage}
                    alt="Project image"
                    style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                  />
                </div>
              )}

              {/* Buttons */}
              <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={submitting}
                  style={{
                    padding:       "0.5rem 1.2rem",
                    borderRadius:  "999px",
                    border:        "1px solid rgba(255,255,255,0.25)",
                    background:    "transparent",
                    color:         "#f5f5f0",
                    fontSize:      "0.75rem",
                    fontWeight:    700,
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    cursor:        "pointer",
                    opacity:       submitting ? 0.5 : 1,
                  }}
                >
                  {displayedImage ? "Change image" : "Upload image"}
                </button>

                {displayedImage && (
                  <button
                    type="button"
                    onClick={() => {
                      setImageFile(null);
                      setImagePreview(null);
                      setCurrentImageUrl(null);
                    }}
                    disabled={submitting}
                    style={{
                      background:    "transparent",
                      border:        "none",
                      color:         "#f5f5f0",
                      opacity:       0.45,
                      fontSize:      "0.75rem",
                      cursor:        "pointer",
                      padding:       "0.5rem 0",
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                    }}
                  >
                    Remove
                  </button>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                style={{ display: "none" }}
              />
            </div>
          </Field>

          {/* Show in Projects toggle */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem" }}>
            <div>
              <p style={{ ...labelStyle, marginBottom: "0.2rem" }}>Show in Projects</p>
              <p style={{ fontSize: "0.7rem", color: "#f5f5f0", opacity: 0.45 }}>
                List this project on the public /projects board.
              </p>
            </div>
            <Toggle
              checked={status === "active"}
              onChange={(on) => setStatus(on ? "active" : "closed")}
            />
          </div>

          {/* Show on Profile toggle */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem" }}>
            <div>
              <p style={{ ...labelStyle, marginBottom: "0.2rem" }}>Show on Profile</p>
              <p style={{ fontSize: "0.7rem", color: "#f5f5f0", opacity: 0.45 }}>
                Display this project on your public dArtwork profile.
              </p>
            </div>
            <Toggle checked={showOnProfile} onChange={setShowOnProfile} />
          </div>

          {/* Error */}
          {error && (
            <p
              style={{
                fontSize:     "0.82rem",
                color:        "#ff6b6b",
                background:   "rgba(255,107,107,0.1)",
                border:       "1px solid rgba(255,107,107,0.3)",
                borderRadius: 6,
                padding:      "0.6rem 0.85rem",
              }}
            >
              {error}
            </p>
          )}

          {/* Save + Delete row */}
          <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
            <button
              type="submit"
              disabled={submitting || uploading || deleting}
              style={{
                padding:         "0.75rem 2rem",
                backgroundColor: submitting || uploading ? "rgba(0,105,62,0.5)" : GREEN,
                color:           "#fff",
                border:          "none",
                borderRadius:    "999px",
                fontWeight:      700,
                fontSize:        "0.8rem",
                textTransform:   "uppercase",
                letterSpacing:   "0.14em",
                cursor:          submitting || uploading || deleting ? "not-allowed" : "pointer",
                transition:      "opacity 0.15s",
                minWidth:        160,
              }}
            >
              {uploading ? "Uploading image…" : submitting ? "Saving…" : "Save Changes"}
            </button>

            <button
              type="button"
              disabled={submitting || deleting}
              onClick={handleDelete}
              style={{
                padding:         "0.75rem 1.5rem",
                backgroundColor: "transparent",
                color:           deleting ? "rgba(255,107,107,0.5)" : "#ff6b6b",
                border:          `1px solid ${deleting ? "rgba(255,107,107,0.3)" : "rgba(255,107,107,0.4)"}`,
                borderRadius:    "999px",
                fontWeight:      700,
                fontSize:        "0.8rem",
                textTransform:   "uppercase",
                letterSpacing:   "0.14em",
                cursor:          submitting || deleting ? "not-allowed" : "pointer",
                transition:      "opacity 0.15s",
              }}
            >
              {deleting ? "Deleting…" : "Delete Project"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────
async function compressImage(file: File, maxDim = 1200): Promise<Blob> {
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
        0.88,
      );
    };
    img.onerror = reject;
    img.src = url;
  });
}
