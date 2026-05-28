"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import AuthGuard from "@/components/auth/AuthGuard";

// ── Types ─────────────────────────────────────────────────────────────────────
interface Application {
  id:                     string;
  projectId:              string;
  projectTitle:           string;
  roleAppliedFor:         string;
  applicantName:          string;
  applicantEmail:         string;
  applicantYear:          number | null;
  applicantConcentration: string;
  whyThisRole:            string;
  experience:             string;
  portfolioLink:          string;
  createdAt:              string;
  status:                 string;
}

// ── Page shell ────────────────────────────────────────────────────────────────
export default function InboxPage() {
  return (
    <AuthGuard>
      <InboxContent />
    </AuthGuard>
  );
}

// ── Main content ──────────────────────────────────────────────────────────────
function InboxContent() {
  const { user } = useAuth();

  const [applications, setApplications] = useState<Application[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState<string | null>(null);
  const [expanded,     setExpanded]     = useState<string | null>(null); // expanded app id

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const idToken = await user.getIdToken(true);
        const res     = await fetch("/api/applications", {
          headers: { Authorization: `Bearer ${idToken}` },
        });
        if (!res.ok) throw new Error("Failed to load applications");
        setApplications(await res.json());
      } catch {
        setError("Could not load applications — please refresh");
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <main className="max-w-2xl mx-auto px-4 py-10">
        <p className="text-sm" style={{ color: "#7fa88a" }}>Loading…</p>
      </main>
    );
  }

  // ── Error ──────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <main className="max-w-2xl mx-auto px-4 py-10">
        <p className="text-sm" style={{ color: "#c8524a" }}>{error}</p>
      </main>
    );
  }

  // ── Group by project ───────────────────────────────────────────────────────
  const grouped = groupByProject(applications);
  const projectIds = Object.keys(grouped);

  return (
    <main className="max-w-2xl mx-auto px-4 py-10">

      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-8">
        <h1
          className="text-3xl font-extrabold uppercase tracking-tight font-[family-name:var(--font-barlow)]"
          style={{ color: "#f5f5f0" }}
        >
          Inbox
        </h1>
        <span
          className="text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full"
          style={{ backgroundColor: "#1e4430", color: "#7fa88a" }}
        >
          {applications.length} {applications.length === 1 ? "application" : "applications"}
        </span>
      </div>

      {/* ── Empty state ── */}
      {applications.length === 0 && (
        <div
          className="rounded-3xl px-8 py-12 text-center"
          style={{ backgroundColor: "#132d1c", border: "1px solid #1e4430" }}
        >
          <p className="text-4xl mb-4">📭</p>
          <p className="font-bold" style={{ color: "#f5f5f0" }}>No applications yet</p>
          <p className="text-sm mt-2" style={{ color: "#7fa88a" }}>
            When someone applies to one of your projects, it will appear here.
          </p>
          <Link
            href="/projects"
            className="inline-block mt-6 px-5 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-opacity hover:opacity-80"
            style={{ border: "1px solid #1e4430", color: "#7fa88a" }}
          >
            Browse Projects
          </Link>
        </div>
      )}

      {/* ── Grouped by project ── */}
      {projectIds.map((projectId) => {
        const apps = grouped[projectId];
        const projectTitle = apps[0].projectTitle;

        return (
          <section key={projectId} className="mb-10">

            {/* Project header */}
            <div className="flex items-center justify-between mb-3">
              <h2
                className="text-xs font-bold uppercase tracking-widest"
                style={{ color: "#7fa88a" }}
              >
                {projectTitle}
              </h2>
              <Link
                href={`/projects/${projectId}/edit`}
                className="text-xs font-bold uppercase tracking-widest hover:opacity-70 transition-opacity"
                style={{ color: "#4a8c5e" }}
              >
                Edit project →
              </Link>
            </div>

            {/* Application cards */}
            <div className="flex flex-col gap-3">
              {apps.map((app) => (
                <ApplicationCard
                  key={app.id}
                  app={app}
                  isExpanded={expanded === app.id}
                  onToggle={() => setExpanded(expanded === app.id ? null : app.id)}
                />
              ))}
            </div>
          </section>
        );
      })}
    </main>
  );
}

// ── Application card ──────────────────────────────────────────────────────────
function ApplicationCard({
  app,
  isExpanded,
  onToggle,
}: {
  app:        Application;
  isExpanded: boolean;
  onToggle:   () => void;
}) {
  const dateStr = formatDate(app.createdAt);

  return (
    <div
      className="rounded-2xl overflow-hidden transition-all"
      style={{ backgroundColor: "#132d1c", border: "1px solid #1e4430" }}
    >
      {/* ── Summary row (always visible) ── */}
      <button
        onClick={onToggle}
        className="w-full text-left px-5 py-4 flex items-start justify-between gap-4 hover:bg-[#1a3826] transition-colors"
      >
        <div className="flex-1 min-w-0">

          {/* Role pill + name */}
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="text-xs font-bold uppercase tracking-widest px-2 py-0.5 rounded-full shrink-0"
              style={{ backgroundColor: "#1e4430", color: "#7fa88a" }}
            >
              {app.roleAppliedFor}
            </span>
            <span className="font-bold text-sm truncate" style={{ color: "#f5f5f0" }}>
              {app.applicantName}
            </span>
          </div>

          {/* Meta line */}
          <p className="text-xs mt-1" style={{ color: "#4a8c5e" }}>
            {app.applicantEmail}
            {app.applicantYear ? ` · Class of ${app.applicantYear}` : ""}
            {app.applicantConcentration ? ` · ${app.applicantConcentration}` : ""}
          </p>
        </div>

        {/* Date + status + chevron */}
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span className="text-xs" style={{ color: "#4a8c5e" }}>{dateStr}</span>
          <StatusPill status={app.status} />
          <span className="text-xs" style={{ color: "#4a8c5e" }}>
            {isExpanded ? "▲" : "▼"}
          </span>
        </div>
      </button>

      {/* ── Expanded detail ── */}
      {isExpanded && (
        <div
          className="px-5 pb-5 flex flex-col gap-4"
          style={{ borderTop: "1px solid #1e4430" }}
        >

          {/* Why this role */}
          <div className="pt-4">
            <p
              className="text-xs font-bold uppercase tracking-widest mb-2"
              style={{ color: "#7fa88a" }}
            >
              Why this role
            </p>
            <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: "#c8ddd1" }}>
              {app.whyThisRole}
            </p>
          </div>

          {/* Experience */}
          {app.experience && (
            <div>
              <p
                className="text-xs font-bold uppercase tracking-widest mb-2"
                style={{ color: "#7fa88a" }}
              >
                Experience
              </p>
              <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: "#c8ddd1" }}>
                {app.experience}
              </p>
            </div>
          )}

          {/* Portfolio */}
          {app.portfolioLink && (
            <div>
              <p
                className="text-xs font-bold uppercase tracking-widest mb-1"
                style={{ color: "#7fa88a" }}
              >
                Portfolio / work sample
              </p>
              <a
                href={app.portfolioLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm underline underline-offset-2 hover:opacity-70 transition-opacity break-all"
                style={{ color: "#7fa88a" }}
              >
                {app.portfolioLink}
              </a>
            </div>
          )}

          {/* Reply button */}
          <div className="pt-1">
            <a
              href={`mailto:${app.applicantEmail}?subject=Re: Your application for ${encodeURIComponent(app.roleAppliedFor)} — ${encodeURIComponent(app.projectTitle)}`}
              className="inline-block px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-opacity hover:opacity-80"
              style={{ backgroundColor: "#1e4430", color: "#f5f5f0" }}
            >
              Reply by email ↗
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Status pill ───────────────────────────────────────────────────────────────
function StatusPill({ status }: { status: string }) {
  const styles: Record<string, { bg: string; text: string }> = {
    pending:  { bg: "#2a3a1e", text: "#a8c890" },
    accepted: { bg: "#1a3a2e", text: "#5cb88a" },
    rejected: { bg: "#3a1e1e", text: "#c88a8a" },
  };
  const s = styles[status] ?? styles.pending;

  return (
    <span
      className="text-xs font-bold uppercase tracking-widest px-2 py-0.5 rounded-full"
      style={{ backgroundColor: s.bg, color: s.text }}
    >
      {status}
    </span>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function groupByProject(apps: Application[]): Record<string, Application[]> {
  const map: Record<string, Application[]> = {};
  for (const app of apps) {
    if (!map[app.projectId]) map[app.projectId] = [];
    map[app.projectId].push(app);
  }
  return map;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day:   "numeric",
      year:  "numeric",
    });
  } catch {
    return iso;
  }
}
