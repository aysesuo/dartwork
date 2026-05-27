"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AuthGuard from "@/components/auth/AuthGuard";
import { useAuth } from "@/lib/auth";
import { auth } from "@/lib/firebase";
import { DISCIPLINES } from "@/lib/disciplines";

const INK = "#1a1008";
const GREEN = "#00693E";
const ORANGE = "#FF6B35";

// ── Shared input style ────────────────────────────────────────────────────────
const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "0.6rem 0.75rem",
  background: "rgba(255,255,255,0.07)",
  border: "1px solid rgba(255,255,255,0.18)",
  borderRadius: "6px",
  color: "#f5f5f0",
  fontSize: "0.9rem",
  fontFamily: "var(--font-sans), sans-serif",
  outline: "none",
  boxSizing: "border-box",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "0.7rem",
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.12em",
  color: "#f5f5f0",
  opacity: 0.7,
  marginBottom: "0.4rem",
};

function Field({
  label,
  hint,
  required,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
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

// ── Toggle switch ─────────────────────────────────────────────────────────────
function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      style={{
        width: 44,
        height: 24,
        borderRadius: 12,
        border: "none",
        cursor: "pointer",
        backgroundColor: checked ? GREEN : "rgba(255,255,255,0.2)",
        position: "relative",
        transition: "background 0.2s",
        flexShrink: 0,
      }}
    >
      <span
        style={{
          position: "absolute",
          top: 3,
          left: checked ? 23 : 3,
          width: 18,
          height: 18,
          borderRadius: "50%",
          backgroundColor: "#fff",
          transition: "left 0.2s",
          boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
        }}
      />
    </button>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function NewProjectPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [title,         setTitle]         = useState("");
  const [description,   setDescription]   = useState("");
  const [discipline,    setDiscipline]    = useState("");
  const [rolesNeeded,   setRolesNeeded]   = useState("");
  const [mediaUrl,      setMediaUrl]      = useState("");
  const [showOnProfile, setShowOnProfile] = useState(true);

  const [submitting, setSubmitting] = useState(false);
  const [error,      setError]      = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setError(null);

    // Client-side validation
    if (!title.trim())           return setError("Project title is required.");
    if (!discipline)             return setError("Please select a discipline.");
    if (description.trim().length < 10) return setError("Description must be at least 10 characters.");

    setSubmitting(true);
    try {
      const token = await auth.currentUser!.getIdToken();
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title, description, discipline, rolesNeeded, mediaUrl, showOnProfile }),
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
          minHeight: "100vh",
          padding: "3rem 1rem 6rem",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <div style={{ width: "100%", maxWidth: 560 }}>
          {/* Back link */}
          <a
            href="/projects"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.3rem",
              fontSize: "0.75rem",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.12em",
              color: "#f5f5f0",
              opacity: 0.5,
              textDecoration: "none",
              marginBottom: "2rem",
            }}
          >
            ← Projects
          </a>

          <h1
            style={{
              fontFamily: "var(--font-barlow), sans-serif",
              fontSize: "2rem",
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: "0.04em",
              color: "#f5f5f0",
              marginBottom: "0.4rem",
            }}
          >
            Post a Project
          </h1>
          <p style={{ fontSize: "0.85rem", color: "#f5f5f0", opacity: 0.55, marginBottom: "2.5rem" }}>
            Tell the dArtwork community what you're making and who you need.
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
              hint="Separate multiple roles with commas or new lines. e.g. Cinematographer, Sound Designer"
            >
              <textarea
                value={rolesNeeded}
                onChange={(e) => setRolesNeeded(e.target.value)}
                placeholder="e.g. Bassist, Mixing Engineer"
                rows={3}
                maxLength={400}
                style={{ ...inputStyle, resize: "vertical", lineHeight: 1.6 }}
                disabled={submitting}
              />
            </Field>

            {/* Media URL */}
            <Field label="Media link" hint="Optional — a portfolio link, demo, mood board, or anything that shows your vision.">
              <input
                type="url"
                value={mediaUrl}
                onChange={(e) => setMediaUrl(e.target.value)}
                placeholder="https://…"
                style={inputStyle}
                disabled={submitting}
              />
            </Field>

            {/* Show on profile toggle */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem" }}>
              <div>
                <p style={{ ...labelStyle, marginBottom: "0.2rem" }}>Show on my profile</p>
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
                  fontSize: "0.82rem",
                  color: "#ff6b6b",
                  background: "rgba(255,107,107,0.1)",
                  border: "1px solid rgba(255,107,107,0.3)",
                  borderRadius: 6,
                  padding: "0.6rem 0.85rem",
                }}
              >
                {error}
              </p>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting}
              style={{
                padding: "0.75rem 2rem",
                backgroundColor: submitting ? "rgba(255,107,53,0.5)" : ORANGE,
                color: "#fff",
                border: "none",
                borderRadius: "999px",
                fontWeight: 700,
                fontSize: "0.8rem",
                textTransform: "uppercase",
                letterSpacing: "0.14em",
                cursor: submitting ? "not-allowed" : "pointer",
                alignSelf: "flex-start",
                transition: "opacity 0.15s",
                minWidth: 160,
              }}
            >
              {submitting ? "Posting…" : "Post Project"}
            </button>
          </form>
        </div>
      </div>
    </AuthGuard>
  );
}
