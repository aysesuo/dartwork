"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { getDisciplineColor } from "@/lib/disciplines";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

// ── Types ──────────────────────────────────────────────────────────────────────
export interface SheetProject {
  id: string;
  title: string;
  creatorName: string;
  creatorUid?: string;
  discipline: string;
  positionsNeeded: string[];
  description: string;
  mediaUrl?: string | null;
  datePosted: string;
}

interface UserProfile {
  displayName?: string;
  gradYear?: number;
  concentration?: string;
}

interface Props {
  project: SheetProject | null;
  onClose: () => void;
}

// ── Shared field styles ────────────────────────────────────────────────────────
const textareaStyle: React.CSSProperties = {
  width:       "100%",
  padding:     "0.55rem 0.75rem",
  background:  "rgba(255,255,255,0.06)",
  border:      "1px solid rgba(255,255,255,0.14)",
  borderRadius: 6,
  color:       "#f5f5f0",
  fontSize:    "0.85rem",
  resize:      "vertical",
  lineHeight:  1.6,
  outline:     "none",
  fontFamily:  "var(--font-sans), sans-serif",
  boxSizing:   "border-box" as const,
};

const urlInputStyle: React.CSSProperties = {
  ...textareaStyle,
  resize: undefined,
};

// ── Sub-components ────────────────────────────────────────────────────────────
function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.1rem" }}>
      <span style={{ fontSize: "0.6rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#7fa88a" }}>
        {label}
      </span>
      <span style={{ fontSize: "0.82rem", color: "#c8ddd1" }}>{value || "—"}</span>
    </div>
  );
}

function FormField({
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
    <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
      <label style={{ fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#7fa88a" }}>
        {label}
        {required && <span style={{ color: "#FF6B35", marginLeft: 4 }}>*</span>}
        {hint && (
          <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0, opacity: 0.7, marginLeft: 6 }}>
            — {hint}
          </span>
        )}
      </label>
      {children}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function ProjectDetailSheet({ project, onClose }: Props) {
  const { user } = useAuth();

  // ── Responsive side ──────────────────────────────────────────────────────
  const [side, setSide] = useState<"right" | "bottom">("right");
  useEffect(() => {
    function check() {
      setSide(window.innerWidth < 768 ? "bottom" : "right");
    }
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // ── User profile (pre-fill application form) — fetched once ─────────────
  const profileRef = useRef<UserProfile | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    if (!user || profileRef.current !== null) return;
    (async () => {
      try {
        const token = await user.getIdToken(true);
        const res   = await fetch(`/api/users/${user.uid}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data: UserProfile = await res.json();
          profileRef.current = data;
          setProfile(data);
        }
      } catch { /* silent — pre-fill will fall back to auth values */ }
    })();
  }, [user]);

  // ── Application dialog state ─────────────────────────────────────────────
  const [selectedRole,  setSelectedRole]  = useState<string | null>(null);
  const [whyThisRole,   setWhyThisRole]   = useState("");
  const [experience,    setExperience]    = useState("");
  const [portfolioLink, setPortfolioLink] = useState("");
  const [submitting,    setSubmitting]    = useState(false);
  const [submitted,     setSubmitted]     = useState(false);
  const [formError,     setFormError]     = useState<string | null>(null);

  function openApplication(role: string) {
    setSelectedRole(role);
    setWhyThisRole("");
    setExperience("");
    setPortfolioLink("");
    setSubmitted(false);
    setFormError(null);
  }

  function closeApplication() {
    setSelectedRole(null);
    setSubmitted(false);
    setFormError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !project || !selectedRole) return;

    if (whyThisRole.trim().length < 50) {
      setFormError("Please write at least 50 characters about why you want this role.");
      return;
    }

    setFormError(null);
    setSubmitting(true);
    try {
      const token = await user.getIdToken(true);
      const res   = await fetch("/api/applications", {
        method:  "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body:    JSON.stringify({
          projectId:    project.id,
          roleAppliedFor: selectedRole,
          whyThisRole:  whyThisRole.trim(),
          experience:   experience.trim(),
          portfolioLink: portfolioLink.trim(),
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setFormError(data.error ?? "Something went wrong. Please try again.");
        return;
      }

      setSubmitted(true);
    } catch {
      setFormError("Network error — please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  // ── Derived values ───────────────────────────────────────────────────────
  const isOwner     = !!project && !!user && user.uid === project.creatorUid;
  const isSeedCard  = !!project && !project.creatorUid; // seed data — not in Firestore
  const canApply    = !isOwner && !isSeedCard;

  const disciplineColors = project ? getDisciplineColor(project.discipline) : null;

  // Pre-fill display values
  const prefillName  = profile?.displayName ?? user?.displayName ?? "";
  const prefillEmail = user?.email ?? "";
  const prefillMeta  = [
    profile?.gradYear  ? `Class of ${profile.gradYear}` : null,
    profile?.concentration || null,
  ].filter(Boolean).join(" · ");

  return (
    <>
      {/* ── Project detail slide-over ── */}
      <Sheet open={!!project} onOpenChange={(open) => { if (!open) onClose(); }}>
        <SheetContent
          side={side}
          className="overflow-y-auto p-0"
          style={{
            backgroundColor: "#0f2318",
            borderColor:     "#1e4430",
            color:           "#f5f5f0",
            maxWidth:        side === "right" ? 480 : undefined,
            maxHeight:       side === "bottom" ? "85vh" : undefined,
          }}
        >
          {project && (
            <>
              {/* Header */}
              <SheetHeader
                className="p-6 pb-5"
                style={{ borderBottom: "1px solid #1e4430" }}
              >
                {/* Accessibility description (visually hidden) */}
                <SheetDescription className="sr-only">
                  Project posted by {project.creatorName}
                </SheetDescription>

                {/* Discipline pill */}
                {disciplineColors && (
                  <div className="mb-2">
                    <span
                      className={`${disciplineColors.tailwindBg} ${disciplineColors.tailwindText} px-3 py-1 rounded-full text-xs font-semibold`}
                    >
                      {project.discipline}
                    </span>
                  </div>
                )}

                {/* Title */}
                <SheetTitle
                  className="font-[family-name:var(--font-barlow)] uppercase tracking-tight leading-tight"
                  style={{ fontSize: "1.65rem", fontWeight: 800, color: "#f5f5f0" }}
                >
                  {project.title}
                </SheetTitle>

                {/* Creator + date */}
                <p style={{ fontSize: "0.8rem", color: "#7fa88a", marginTop: "0.3rem" }}>
                  {project.creatorUid ? (
                    <Link
                      href={`/profile/${project.creatorUid}`}
                      onClick={onClose}
                      style={{ color: "#7fa88a", textDecoration: "underline", textUnderlineOffset: 3 }}
                    >
                      {project.creatorName}
                    </Link>
                  ) : (
                    project.creatorName
                  )}
                  {project.datePosted && (
                    <span style={{ opacity: 0.55 }}> · {project.datePosted}</span>
                  )}
                </p>
              </SheetHeader>

              {/* Body */}
              <div
                style={{
                  padding:       "1.5rem",
                  display:       "flex",
                  flexDirection: "column",
                  gap:           "1.75rem",
                }}
              >
                {/* Description */}
                <p style={{ fontSize: "0.88rem", lineHeight: 1.8, color: "#c8ddd1" }}>
                  {project.description}
                </p>

                {/* Looking for */}
                {project.positionsNeeded.length > 0 && (
                  <div>
                    <p
                      style={{
                        fontSize:      "0.6rem",
                        fontWeight:    700,
                        textTransform: "uppercase",
                        letterSpacing: "0.12em",
                        color:         "#7fa88a",
                        marginBottom:  "0.75rem",
                      }}
                    >
                      Looking for
                    </p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                      {project.positionsNeeded.map((role) => (
                        <button
                          key={role}
                          disabled={!canApply}
                          onClick={() => canApply && openApplication(role)}
                          title={
                            isOwner    ? "You can't apply to your own project" :
                            isSeedCard ? "Sample project — applications not available" :
                            `Apply as ${role}`
                          }
                          style={{
                            padding:         "0.4rem 1rem",
                            borderRadius:    "999px",
                            border:          "1.5px solid #1e4430",
                            backgroundColor: canApply ? "#132d1c" : "transparent",
                            color:           canApply ? "#f5f5f0" : "#7fa88a",
                            fontSize:        "0.8rem",
                            fontWeight:      600,
                            cursor:          canApply ? "pointer" : "default",
                            transition:      "background-color 0.15s, border-color 0.15s",
                          }}
                          onMouseEnter={(e) => {
                            if (canApply) {
                              (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#00693E";
                              (e.currentTarget as HTMLButtonElement).style.borderColor     = "#00693E";
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (canApply) {
                              (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#132d1c";
                              (e.currentTarget as HTMLButtonElement).style.borderColor     = "#1e4430";
                            }
                          }}
                        >
                          {role}
                        </button>
                      ))}
                    </div>
                    {canApply && (
                      <p style={{ fontSize: "0.68rem", color: "#7fa88a", marginTop: "0.5rem", opacity: 0.65 }}>
                        Click a role to apply
                      </p>
                    )}
                    {isOwner && (
                      <p style={{ fontSize: "0.68rem", color: "#7fa88a", marginTop: "0.5rem", opacity: 0.65 }}>
                        This is your project.
                      </p>
                    )}
                  </div>
                )}

                {/* Media link */}
                {project.mediaUrl && (
                  <div>
                    <p
                      style={{
                        fontSize:      "0.6rem",
                        fontWeight:    700,
                        textTransform: "uppercase",
                        letterSpacing: "0.12em",
                        color:         "#7fa88a",
                        marginBottom:  "0.4rem",
                      }}
                    >
                      Media / Demo
                    </p>
                    <a
                      href={project.mediaUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        color:              "#FF6B35",
                        fontSize:           "0.82rem",
                        wordBreak:          "break-all",
                        textDecoration:     "underline",
                        textUnderlineOffset: 3,
                      }}
                    >
                      {project.mediaUrl}
                    </a>
                  </div>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* ── Application dialog ── */}
      <Dialog open={!!selectedRole} onOpenChange={(open) => { if (!open) closeApplication(); }}>
        <DialogContent
          style={{
            backgroundColor: "#0f2318",
            border:          "1px solid #1e4430",
            color:           "#f5f5f0",
            padding:         0,
          }}
        >
          <DialogHeader style={{ padding: "1.4rem 1.5rem 0", borderBottom: "1px solid #1e4430", paddingBottom: "1rem" }}>
            <DialogTitle
              style={{
                fontFamily:    "var(--font-barlow), sans-serif",
                fontSize:      "1.15rem",
                fontWeight:    800,
                textTransform: "uppercase",
                letterSpacing: "0.04em",
                color:         "#f5f5f0",
              }}
            >
              Apply — {selectedRole}
            </DialogTitle>
            <DialogDescription style={{ color: "#7fa88a", fontSize: "0.78rem", marginTop: "0.2rem" }}>
              {project?.title}
            </DialogDescription>
          </DialogHeader>

          {submitted ? (
            /* ── Confirmation ── */
            <div
              style={{
                padding:        "2.5rem 1.5rem",
                textAlign:      "center",
                display:        "flex",
                flexDirection:  "column",
                gap:            "0.6rem",
                alignItems:     "center",
              }}
            >
              <span style={{ fontSize: "2.5rem", lineHeight: 1 }}>✓</span>
              <p style={{ fontWeight: 700, color: "#f5f5f0", fontSize: "1rem", marginTop: "0.25rem" }}>
                Application sent!
              </p>
              <p style={{ color: "#7fa88a", fontSize: "0.85rem" }}>
                The project owner will be in touch.
              </p>
            </div>
          ) : (
            /* ── Application form ── */
            <form
              onSubmit={handleSubmit}
              style={{
                padding:       "1.25rem 1.5rem 1.5rem",
                display:       "flex",
                flexDirection: "column",
                gap:           "1.1rem",
              }}
            >
              {/* Pre-filled read-only info */}
              <div
                style={{
                  display:         "flex",
                  flexDirection:   "column",
                  gap:             "0.6rem",
                  padding:         "0.85rem 1rem",
                  backgroundColor: "rgba(255,255,255,0.04)",
                  borderRadius:    8,
                  border:          "1px solid rgba(255,255,255,0.08)",
                }}
              >
                <ReadOnlyField label="Your name"           value={prefillName} />
                <ReadOnlyField label="Dartmouth email"     value={prefillEmail} />
                <ReadOnlyField label="Year & concentration" value={prefillMeta || "—"} />
              </div>

              {/* Why this role */}
              <FormField label="Why you want this role" required hint="min 50 chars">
                <textarea
                  value={whyThisRole}
                  onChange={(e) => setWhyThisRole(e.target.value)}
                  rows={4}
                  maxLength={2000}
                  disabled={submitting}
                  placeholder="Tell the creator why you're the right fit…"
                  style={textareaStyle}
                />
                <p
                  style={{
                    fontSize: "0.62rem",
                    color:    whyThisRole.length < 50 ? "#ff8a80" : "#7fa88a",
                    opacity:  0.8,
                  }}
                >
                  {whyThisRole.length}/2000
                  {whyThisRole.length < 50 && ` — ${50 - whyThisRole.length} more needed`}
                </p>
              </FormField>

              {/* Experience */}
              <FormField label="Relevant experience or links" hint="optional">
                <textarea
                  value={experience}
                  onChange={(e) => setExperience(e.target.value)}
                  rows={3}
                  maxLength={1500}
                  disabled={submitting}
                  placeholder="Previous projects, courses, collaborations…"
                  style={textareaStyle}
                />
              </FormField>

              {/* Portfolio */}
              <FormField label="Portfolio or work sample" hint="optional URL">
                <input
                  type="url"
                  value={portfolioLink}
                  onChange={(e) => setPortfolioLink(e.target.value)}
                  disabled={submitting}
                  placeholder="https://…"
                  style={urlInputStyle}
                />
              </FormField>

              {/* Error */}
              {formError && (
                <p
                  style={{
                    fontSize:     "0.78rem",
                    color:        "#ff8a80",
                    background:   "rgba(255,138,128,0.08)",
                    border:       "1px solid rgba(255,138,128,0.25)",
                    borderRadius: 6,
                    padding:      "0.5rem 0.75rem",
                  }}
                >
                  {formError}
                </p>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={submitting}
                style={{
                  padding:         "0.7rem 1.5rem",
                  backgroundColor: submitting ? "rgba(0,105,62,0.45)" : "#00693E",
                  color:           "#fff",
                  border:          "none",
                  borderRadius:    "999px",
                  fontWeight:      700,
                  fontSize:        "0.78rem",
                  textTransform:   "uppercase",
                  letterSpacing:   "0.12em",
                  cursor:          submitting ? "not-allowed" : "pointer",
                  alignSelf:       "flex-start",
                  minWidth:        180,
                  transition:      "opacity 0.15s",
                }}
              >
                {submitting ? "Sending…" : "Submit Application"}
              </button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
