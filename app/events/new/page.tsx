"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AuthGuard from "@/components/auth/AuthGuard";
import { useAuth } from "@/lib/auth";
import { DISCIPLINES } from "@/lib/disciplines";

const ORANGE = "#FF6B35";
const GREEN  = "#00693E";

const inputStyle: React.CSSProperties = {
  width:           "100%",
  padding:         "0.6rem 0.75rem",
  background:      "rgba(255,255,255,0.07)",
  border:          "1px solid rgba(255,255,255,0.18)",
  borderRadius:    "6px",
  color:           "#f5f5f0",
  fontSize:        "0.9rem",
  fontFamily:      "var(--font-sans), sans-serif",
  outline:         "none",
  boxSizing:       "border-box",
};

const labelStyle: React.CSSProperties = {
  display:         "block",
  fontSize:        "0.7rem",
  fontWeight:      700,
  textTransform:   "uppercase",
  letterSpacing:   "0.12em",
  color:           "#f5f5f0",
  opacity:         0.7,
  marginBottom:    "0.4rem",
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
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
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

export default function NewEventPage() {
  const router     = useRouter();
  const { user }   = useAuth();

  const [title,       setTitle]       = useState("");
  const [description, setDescription] = useState("");
  const [location,    setLocation]    = useState("");
  const [date,        setDate]        = useState("");
  const [startTime,   setStartTime]   = useState("");
  const [endTime,     setEndTime]     = useState("");
  const [disciplines, setDisciplines] = useState<string[]>([]);
  const [imageUrl,    setImageUrl]    = useState("");

  const [submitting, setSubmitting]   = useState(false);
  const [error,      setError]        = useState<string | null>(null);

  function toggleDiscipline(d: string) {
    setDisciplines((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d],
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setError(null);

    // Client-side validation
    if (!title.trim())               return setError("Event title is required.");
    if (description.trim().length < 10)
                                     return setError("Description must be at least 10 characters.");
    if (!location.trim())            return setError("Location is required.");
    if (!date)                       return setError("Date is required.");
    if (!startTime)                  return setError("Start time is required.");
    if (imageUrl.trim() && !/^https?:\/\/.+/.test(imageUrl.trim()))
                                     return setError("Image URL must start with https://");

    // Build ISO-ish datetime strings from separate date + time inputs
    const dateTime    = `${date}T${startTime}`;
    const endDateTime = endTime ? `${date}T${endTime}` : undefined;

    setSubmitting(true);
    try {
      const token = await user.getIdToken(true);
      const res   = await fetch("/api/events", {
        method:  "POST",
        headers: {
          "Content-Type":  "application/json",
          Authorization:   `Bearer ${token}`,
        },
        body: JSON.stringify({
          title,
          description,
          location,
          dateTime,
          endDateTime,
          disciplines,
          imageUrl: imageUrl.trim() || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? `Server error ${res.status}`);
      }

      router.push("/events");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <AuthGuard>
      <div
        style={{
          minHeight:      "100vh",
          padding:        "3rem 1rem 6rem",
          display:        "flex",
          flexDirection:  "column",
          alignItems:     "center",
        }}
      >
        <div style={{ width: "100%", maxWidth: 560 }}>
          {/* Back link */}
          <a
            href="/events"
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
            ← Events
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
            Post an Event
          </h1>
          <p style={{ fontSize: "0.85rem", color: "#f5f5f0", opacity: 0.55, marginBottom: "2.5rem" }}>
            Share a Dartmouth arts event with the dArtwork community.
          </p>

          <form
            onSubmit={handleSubmit}
            style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}
            noValidate
          >
            {/* Title */}
            <Field label="Event Title" required>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Spring Film Showcase, Open Mic Night"
                maxLength={150}
                style={inputStyle}
                disabled={submitting}
              />
            </Field>

            {/* Description */}
            <Field
              label="Description"
              required
              hint="Minimum 10 characters. What's the event, who should come?"
            >
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the event, who it's for, and what to expect…"
                rows={5}
                maxLength={1000}
                style={{ ...inputStyle, resize: "vertical", lineHeight: 1.6 }}
                disabled={submitting}
              />
            </Field>

            {/* Location */}
            <Field label="Location" required>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Loew Auditorium, Hopkins Center"
                maxLength={200}
                style={inputStyle}
                disabled={submitting}
              />
            </Field>

            {/* Date */}
            <Field label="Date" required>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                style={{ ...inputStyle, colorScheme: "dark" }}
                disabled={submitting}
              />
            </Field>

            {/* Start / End time */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <Field label="Start Time" required>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  style={{ ...inputStyle, colorScheme: "dark" }}
                  disabled={submitting}
                />
              </Field>
              <Field label="End Time" hint="Optional">
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  style={{ ...inputStyle, colorScheme: "dark" }}
                  disabled={submitting}
                />
              </Field>
            </div>

            {/* Disciplines */}
            <Field label="Disciplines" hint="Select all that apply">
              <div
                style={{
                  display:         "flex",
                  flexWrap:        "wrap",
                  gap:             "0.5rem",
                  marginTop:       "0.25rem",
                }}
              >
                {DISCIPLINES.map((d) => {
                  const checked = disciplines.includes(d);
                  return (
                    <button
                      key={d}
                      type="button"
                      onClick={() => toggleDiscipline(d)}
                      disabled={submitting}
                      style={{
                        padding:         "0.35rem 0.85rem",
                        borderRadius:    "999px",
                        border:          `1px solid ${checked ? GREEN : "rgba(255,255,255,0.2)"}`,
                        backgroundColor: checked ? GREEN : "transparent",
                        color:           "#f5f5f0",
                        fontSize:        "0.78rem",
                        fontWeight:      600,
                        cursor:          submitting ? "not-allowed" : "pointer",
                        transition:      "background 0.15s, border-color 0.15s",
                        opacity:         submitting ? 0.5 : 1,
                      }}
                    >
                      {d}
                    </button>
                  );
                })}
              </div>
            </Field>

            {/* Image URL */}
            <Field label="Image URL" hint="Optional — must start with https://. Used as the event card image.">
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://…"
                maxLength={500}
                style={inputStyle}
                disabled={submitting}
              />
            </Field>

            {/* Error */}
            {error && (
              <p
                style={{
                  fontSize:        "0.82rem",
                  color:           "#ff6b6b",
                  background:      "rgba(255,107,107,0.1)",
                  border:          "1px solid rgba(255,107,107,0.3)",
                  borderRadius:    6,
                  padding:         "0.6rem 0.85rem",
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
                padding:         "0.75rem 2rem",
                backgroundColor: submitting ? "rgba(255,107,53,0.5)" : ORANGE,
                color:           "#fff",
                border:          "none",
                borderRadius:    "999px",
                fontWeight:      700,
                fontSize:        "0.8rem",
                textTransform:   "uppercase",
                letterSpacing:   "0.14em",
                cursor:          submitting ? "not-allowed" : "pointer",
                alignSelf:       "flex-start",
                transition:      "opacity 0.15s",
                minWidth:        160,
              }}
            >
              {submitting ? "Posting…" : "Post Event"}
            </button>
          </form>
        </div>
      </div>
    </AuthGuard>
  );
}
