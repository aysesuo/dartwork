"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import AuthGuard from "@/components/auth/AuthGuard";
import { useAuth } from "@/lib/auth";
import { auth, storage } from "@/lib/firebase";
import { DISCIPLINES } from "@/lib/disciplines";
import { DEFAULT_ROLES } from "@/lib/roles";
import { COMMITMENTS } from "@/lib/commitment";

const GREEN  = "#00693E";
const ORANGE = "#FF6B35";
const INK    = "#1a1008";

// ── Shared input style ────────────────────────────────────────────────────────
const inputStyle: React.CSSProperties = {
  width:        "100%",
  padding:      "0.6rem 0.75rem",
  background:   "rgba(255,255,255,0.55)",
  border:       "1px solid rgba(26,16,8,0.28)",
  borderRadius: "6px",
  color:        INK,
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
  color:         INK,
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
        <p style={{ fontSize: "0.7rem", color: INK, opacity: 0.6, marginTop: "0.3rem" }}>
          {hint}
        </p>
      )}
    </div>
  );
}

function Toggle({
  checked,
  onChange,
}: {
  checked:  boolean;
  onChange: (v: boolean) => void;
}) {
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
        backgroundColor: checked ? GREEN : "rgba(26,16,8,0.25)",
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
export default function NewProjectPage() {
  const router   = useRouter();
  const { user } = useAuth();

  const [title,         setTitle]         = useState("");
  const [description,   setDescription]   = useState("");
  const [discipline,    setDiscipline]    = useState("");
  const [commitment,    setCommitment]    = useState("");
  const [selectedRoles, setSelectedRoles] = useState<Set<string>>(new Set());
  const [roleOptions,   setRoleOptions]   = useState<string[]>(DEFAULT_ROLES);
  const [addingRole,    setAddingRole]    = useState(false);
  const [customRole,    setCustomRole]    = useState("");
  const [showOnProfile, setShowOnProfile] = useState(true);

  // Merge roles already used in posted projects with the default list
  useEffect(() => {
    let cancelled = false;
    fetch("/api/projects")
      .then((r) => (r.ok ? r.json() : []))
      .then((projects: { positionsNeeded?: string[] }[]) => {
        if (cancelled || !Array.isArray(projects)) return;
        const live = projects.flatMap((p) => p.positionsNeeded ?? []);
        setRoleOptions((prev) => [...new Set([...prev, ...live])]);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  function toggleRole(role: string) {
    setSelectedRoles((prev) => {
      const next = new Set(prev);
      if (next.has(role)) next.delete(role);
      else next.add(role);
      return next;
    });
  }

  function addCustomRole() {
    const role = customRole.trim().slice(0, 60);
    if (!role) return;
    setRoleOptions((prev) => (prev.includes(role) ? prev : [...prev, role]));
    setSelectedRoles((prev) => new Set(prev).add(role));
    setCustomRole("");
    setAddingRole(false);
  }

  // Image upload state
  const [imageFile,    setImageFile]    = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading,    setUploading]    = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [submitting, setSubmitting] = useState(false);
  const [error,      setError]      = useState<string | null>(null);

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  async function uploadImage(): Promise<string | null> {
    if (!imageFile || !user) return null;
    setUploading(true);
    try {
      const compressed = await compressImage(imageFile, 1200);
      const imageId    = `${user.uid}_${Date.now()}`;
      const storageRef = ref(storage, `project-images/${imageId}`);
      await uploadBytes(storageRef, compressed, { contentType: "image/jpeg" });
      return await getDownloadURL(storageRef);
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setError(null);

    if (!title.trim())                   return setError("Project title is required.");
    if (!discipline)                     return setError("Please select a discipline.");
    if (description.trim().length < 10)  return setError("Description must be at least 10 characters.");

    setSubmitting(true);
    try {
      const mediaUrl = await uploadImage();
      const token    = await auth.currentUser!.getIdToken();
      const res = await fetch("/api/projects", {
        method:  "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body:    JSON.stringify({ title, description, discipline, commitment, rolesNeeded: [...selectedRoles].join(", "), mediaUrl, showOnProfile }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? `Server error ${res.status}`);
      }

      router.push("/projects");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <AuthGuard>
      <div
        style={{
          minHeight:          "100vh",
          padding:            "3rem 1rem 6rem",
          display:            "flex",
          flexDirection:      "column",
          alignItems:         "center",
          backgroundImage:    "url(/textures/crumpled_page.png)",
          backgroundSize:     "cover",
          backgroundPosition: "center",
        }}
      >
        <div style={{ width: "100%", maxWidth: 560 }}>
          {/* Back link */}
          <a
            href="/projects"
            style={{
              display:       "inline-flex",
              alignItems:    "center",
              gap:           "0.3rem",
              fontSize:      "0.75rem",
              fontWeight:    700,
              textTransform: "uppercase",
              letterSpacing: "0.12em",
              color:         INK,
              opacity:       0.6,
              textDecoration: "none",
              marginBottom:  "2rem",
            }}
          >
            ← Projects
          </a>

          <h1
            style={{
              fontFamily:    "var(--font-barlow), sans-serif",
              fontSize:      "2rem",
              fontWeight:    800,
              textTransform: "uppercase",
              letterSpacing: "0.04em",
              color:         INK,
              marginBottom:  "0.4rem",
            }}
          >
            Post a Project
          </h1>
          <p style={{ fontSize: "0.85rem", color: INK, opacity: 0.7, marginBottom: "2.5rem" }}>
            Tell the dArtwork community what you&apos;re making and who you need.
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
                placeholder="e.g. Midnight EP, Unseen Dartmouth"
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

            {/* Time commitment */}
            <Field
              label="Time commitment"
              hint="How long is this project? Select the one that fits best."
            >
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                {COMMITMENTS.map((c) => {
                  const active = commitment === c;
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setCommitment(active ? "" : c)}
                      disabled={submitting}
                      aria-pressed={active}
                      style={{
                        padding:      "0.4rem 0.9rem",
                        borderRadius: "999px",
                        border:       `1px solid ${active ? GREEN : "rgba(26,16,8,0.3)"}`,
                        background:   active ? GREEN : "transparent",
                        color:        active ? "#fff" : INK,
                        fontSize:     "0.8rem",
                        fontFamily:   "var(--font-sans), sans-serif",
                        cursor:       submitting ? "not-allowed" : "pointer",
                        transition:   "background 0.15s, border-color 0.15s",
                      }}
                    >
                      {c}
                    </button>
                  );
                })}
              </div>
            </Field>

            {/* Description */}
            <Field label="Description" required hint="Minimum 10 characters. What's the project about, what stage is it at?">
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your project, its current stage, and what you hope to make…"
                rows={5}
                maxLength={1200}
                style={{ ...inputStyle, resize: "vertical", lineHeight: 1.6 }}
                disabled={submitting}
              />
            </Field>

            {/* Roles needed */}
            <Field
              label="Roles you're looking for"
              hint="Select all that apply, or add your own with “Other”."
            >
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                {roleOptions.map((role) => {
                  const active = selectedRoles.has(role);
                  return (
                    <button
                      key={role}
                      type="button"
                      onClick={() => toggleRole(role)}
                      disabled={submitting}
                      aria-pressed={active}
                      style={{
                        padding:       "0.4rem 0.9rem",
                        borderRadius:  "999px",
                        border:        `1px solid ${active ? GREEN : "rgba(26,16,8,0.3)"}`,
                        background:    active ? GREEN : "transparent",
                        color:         active ? "#fff" : INK,
                        fontSize:      "0.8rem",
                        fontFamily:    "var(--font-sans), sans-serif",
                        cursor:        submitting ? "not-allowed" : "pointer",
                        transition:    "background 0.15s, border-color 0.15s",
                      }}
                    >
                      {role}
                    </button>
                  );
                })}

                {addingRole ? (
                  <span style={{ display: "inline-flex", gap: "0.35rem", alignItems: "center" }}>
                    <input
                      type="text"
                      value={customRole}
                      onChange={(e) => setCustomRole(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") { e.preventDefault(); addCustomRole(); }
                        if (e.key === "Escape") { setAddingRole(false); setCustomRole(""); }
                      }}
                      placeholder="New role…"
                      maxLength={60}
                      autoFocus
                      style={{ ...inputStyle, width: 160, padding: "0.4rem 0.7rem", fontSize: "0.8rem" }}
                    />
                    <button
                      type="button"
                      onClick={addCustomRole}
                      style={{
                        padding:      "0.4rem 0.8rem",
                        borderRadius: "999px",
                        border:       "none",
                        background:   ORANGE,
                        color:        "#fff",
                        fontSize:     "0.8rem",
                        fontWeight:   700,
                        cursor:       "pointer",
                      }}
                    >
                      Add
                    </button>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => setAddingRole(true)}
                    disabled={submitting}
                    style={{
                      padding:       "0.4rem 0.9rem",
                      borderRadius:  "999px",
                      border:        "1px dashed rgba(26,16,8,0.4)",
                      background:    "transparent",
                      color:         INK,
                      fontSize:      "0.8rem",
                      fontFamily:    "var(--font-sans), sans-serif",
                      cursor:        submitting ? "not-allowed" : "pointer",
                    }}
                  >
                    + Other
                  </button>
                )}
              </div>
            </Field>

            {/* Project image upload */}
            <Field label="Project image" hint="Optional — a photo, poster, mood board, or anything that shows your vision.">
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>

                {/* Preview */}
                {imagePreview && (
                  <div
                    style={{
                      width:        "100%",
                      maxHeight:    240,
                      overflow:     "hidden",
                      borderRadius: 8,
                      border:       "1px solid rgba(26,16,8,0.2)",
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={imagePreview}
                      alt="Preview"
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
                      border:        "1px solid rgba(26,16,8,0.3)",
                      background:    "transparent",
                      color:         INK,
                      fontSize:      "0.75rem",
                      fontWeight:    700,
                      textTransform: "uppercase",
                      letterSpacing: "0.1em",
                      cursor:        "pointer",
                      opacity:       submitting ? 0.5 : 1,
                    }}
                  >
                    {imagePreview ? "Change image" : "Upload image"}
                  </button>

                  {imagePreview && (
                    <button
                      type="button"
                      onClick={() => { setImageFile(null); setImagePreview(null); }}
                      disabled={submitting}
                      style={{
                        background:    "transparent",
                        border:        "none",
                        color:         INK,
                        opacity:       0.55,
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

            {/* Show on profile toggle */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem" }}>
              <div>
                <p style={{ ...labelStyle, marginBottom: "0.2rem" }}>Show on my profile</p>
                <p style={{ fontSize: "0.7rem", color: INK, opacity: 0.6 }}>
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

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting || uploading}
              style={{
                padding:         "0.75rem 2rem",
                backgroundColor: submitting || uploading ? "rgba(255,107,53,0.5)" : ORANGE,
                color:           "#fff",
                border:          "none",
                borderRadius:    "999px",
                fontWeight:      700,
                fontSize:        "0.8rem",
                textTransform:   "uppercase",
                letterSpacing:   "0.14em",
                cursor:          submitting || uploading ? "not-allowed" : "pointer",
                alignSelf:       "flex-start",
                transition:      "opacity 0.15s",
                minWidth:        160,
              }}
            >
              {uploading ? "Uploading image…" : submitting ? "Posting…" : "Post Project"}
            </button>
          </form>
        </div>
      </div>
    </AuthGuard>
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
