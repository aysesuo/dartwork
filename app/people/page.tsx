"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import AuthGuard from "@/components/auth/AuthGuard";
import { useAuth } from "@/lib/auth";
import { sanitize } from "@/lib/sanitize";

interface Person {
  id:            string;
  name:          string;
  disciplines:   string[];
  skills:        string[];
  bio:           string;
  contactEmail:  string | null;
  portfolioUrl?: string | null;
  gradYear?:     number | null;
  concentration?: string;
}

// ── Ink colour — every text element uses this ─────────────────────────────────
const INK = "#1a1a1a";

// ── Main page ─────────────────────────────────────────────────────────────────
export default function PeoplePage() {
  return (
    <AuthGuard>
      <GazetteContent />
    </AuthGuard>
  );
}

function GazetteContent() {
  const { user } = useAuth();
  const [people,  setPeople]  = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(false);
  const [search,  setSearch]  = useState("");

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      try {
        const token = await user.getIdToken(true);
        const res   = await fetch("/api/users", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error(`${res.status}`);
        const data: Person[] = await res.json();
        if (!cancelled) setPeople(data);
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user]);

  const filtered = useMemo(() => {
    if (!search.trim()) return people;
    const q = search.toLowerCase();
    return people.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.skills.some((s) => s.toLowerCase().includes(q)) ||
        p.disciplines.some((d) => d.toLowerCase().includes(q)),
    );
  }, [people, search]);

  // Distribute into 3 columns for the broadsheet layout
  const cols: [Person[], Person[], Person[]] = [[], [], []];
  filtered.forEach((p, i) => cols[i % 3].push(p));

  return (
    <>
      {/* ── Fixed full-bleed background ── */}
      <div
        aria-hidden="true"
        style={{
          position:           "fixed",
          inset:              0,
          zIndex:             -1,
          backgroundImage:    "url(/textures/vintage-grunge.jpg)",
          backgroundSize:     "cover",
          backgroundPosition: "center",
          backgroundAttachment: "fixed",
        }}
      />

      <main style={{ minHeight: "100vh", color: INK }}>

        {/* ══ MASTHEAD ══════════════════════════════════════════════════════ */}
        <header style={{ padding: "2rem 2rem 0", textAlign: "center" }}>

          {/* Top double rule */}
          <DoubleRule />

          {/* Title */}
          <h1
            style={{
              fontFamily:    "var(--font-playfair)",
              fontSize:      "clamp(2rem, 6vw, 4.5rem)",
              fontWeight:    900,
              letterSpacing: "-0.01em",
              lineHeight:    1,
              color:         INK,
              margin:        "0.5rem 0 0.25rem",
            }}
          >
            The Dartwork Gazette
          </h1>

          <p
            style={{
              fontFamily:    "var(--font-special-elite)",
              fontSize:      "0.75rem",
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color:         INK,
              opacity:       0.7,
              margin:        "0 0 0.5rem",
            }}
          >
            "All the talent that&rsquo;s fit to print"
          </p>

          {/* Bottom double rule */}
          <DoubleRule />

          {/* Dateline row + search */}
          <div
            style={{
              display:        "flex",
              alignItems:     "center",
              justifyContent: "space-between",
              flexWrap:       "wrap",
              gap:            "0.5rem",
              padding:        "0.4rem 0",
            }}
          >
            <span
              style={{
                fontFamily: "var(--font-special-elite)",
                fontSize:   "0.65rem",
                opacity:    0.6,
                letterSpacing: "0.08em",
                color: INK,
              }}
            >
              Hanover, N.H. &nbsp;·&nbsp; Est. 2025 &nbsp;·&nbsp; Vol. I
            </span>

            {/* Search */}
            <input
              type="text"
              placeholder="Search name, skill, discipline…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                fontFamily:      "var(--font-special-elite)",
                fontSize:        "0.7rem",
                letterSpacing:   "0.04em",
                color:           INK,
                background:      "transparent",
                border:          "none",
                borderBottom:    `1px solid ${INK}`,
                outline:         "none",
                padding:         "0.2rem 0.4rem",
                width:           220,
                opacity:         0.8,
              }}
            />
          </div>

          {/* Section rule */}
          <div style={{ borderTop: `1px solid ${INK}`, opacity: 0.4 }} />
        </header>

        {/* ══ BROADSHEET BODY ═══════════════════════════════════════════════ */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            padding: "0 1rem 3rem",
          }}
        >

          {/* ── Loading ── */}
          {loading && (
            <p
              style={{
                width: "100%",
                textAlign: "center",
                padding: "4rem",
                fontFamily: "var(--font-special-elite)",
                fontSize: "0.85rem",
                opacity: 0.6,
                color: INK,
              }}
            >
              Composing the type…
            </p>
          )}

          {/* ── Error ── */}
          {!loading && error && (
            <p
              style={{
                width: "100%",
                textAlign: "center",
                padding: "4rem",
                fontFamily: "var(--font-special-elite)",
                fontSize: "0.85rem",
                opacity: 0.6,
                color: INK,
              }}
            >
              The presses jammed. Please refresh.
            </p>
          )}

          {/* ── Empty ── */}
          {!loading && !error && filtered.length === 0 && (
            <p
              style={{
                width: "100%",
                textAlign: "center",
                padding: "4rem",
                fontFamily: "var(--font-special-elite)",
                fontSize: "0.85rem",
                opacity: 0.6,
                color: INK,
              }}
            >
              {people.length === 0
                ? "No public profiles yet."
                : "No one matches your search."}
            </p>
          )}

          {/* ── Three-column broadsheet ── */}
          {!loading && !error && filtered.length > 0 && (
            <>
              <Column people={cols[0]} />
              <ColumnRule />
              <Column people={cols[1]} />
              <ColumnRule />
              <Column people={cols[2]} />
            </>
          )}
        </div>
      </main>
    </>
  );
}

// ── Column ────────────────────────────────────────────────────────────────────
function Column({ people }: { people: Person[] }) {
  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      {people.map((person) => (
        <Poster key={person.id} person={person} />
      ))}
    </div>
  );
}

// ── Poster (one person) ───────────────────────────────────────────────────────
function Poster({ person }: { person: Person }) {
  const safeName = sanitize(person.name);
  const safeBio  = sanitize(person.bio ?? "");
  const initials = safeName
    .split(" ")
    .map((n) => n[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <Link
      href={`/profile/${person.id}`}
      style={{ display: "block", textDecoration: "none", color: INK }}
    >
      <article
        style={{
          padding:    "1.5rem 1.75rem 0",
          cursor:     "pointer",
        }}
      >
        {/* WANTED header */}
        <p
          style={{
            fontFamily:    "var(--font-barlow)",
            fontSize:      "0.6rem",
            fontWeight:    700,
            letterSpacing: "0.35em",
            textTransform: "uppercase",
            textAlign:     "center",
            color:         INK,
            marginBottom:  "0.75rem",
          }}
        >
          ✦&nbsp; W A N T E D &nbsp;✦
        </p>

        {/* Initials frame */}
        <div
          style={{
            width:          56,
            height:         56,
            border:         `2px solid ${INK}`,
            display:        "flex",
            alignItems:     "center",
            justifyContent: "center",
            margin:         "0 auto 0.75rem",
            fontFamily:     "var(--font-barlow)",
            fontSize:       "1.35rem",
            fontWeight:     800,
            letterSpacing:  "0.04em",
            color:          INK,
            opacity:        0.85,
          }}
        >
          {initials}
        </div>

        {/* Name */}
        <h2
          style={{
            fontFamily:    "var(--font-barlow)",
            fontSize:      "1.1rem",
            fontWeight:    800,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            textAlign:     "center",
            lineHeight:    1.15,
            color:         INK,
            marginBottom:  "0.4rem",
          }}
        >
          {safeName}
        </h2>

        {/* Disciplines */}
        {person.disciplines.length > 0 && (
          <p
            style={{
              fontFamily:    "var(--font-special-elite)",
              fontSize:      "0.6rem",
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              textAlign:     "center",
              color:         INK,
              opacity:       0.75,
              marginBottom:  "0.5rem",
            }}
          >
            {person.disciplines.join("  ·  ")}
          </p>
        )}

        <InkRule />

        {/* Year / concentration */}
        {(person.gradYear || person.concentration) && (
          <p
            style={{
              fontFamily:    "var(--font-special-elite)",
              fontSize:      "0.58rem",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              textAlign:     "center",
              color:         INK,
              opacity:       0.6,
              marginBottom:  "0.5rem",
            }}
          >
            {[
              person.gradYear ? `Class of ${person.gradYear}` : null,
              person.concentration ?? null,
            ]
              .filter(Boolean)
              .join("  ·  ")}
          </p>
        )}

        {/* Bio */}
        {safeBio && (
          <p
            style={{
              fontFamily:  "var(--font-special-elite)",
              fontSize:    "0.72rem",
              lineHeight:  1.65,
              color:       INK,
              opacity:     0.85,
              marginBottom: "0.6rem",
            }}
          >
            {safeBio}
          </p>
        )}

        {/* Skills */}
        {person.skills.length > 0 && (
          <p
            style={{
              fontFamily:    "var(--font-geist-mono)",
              fontSize:      "0.58rem",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              color:         INK,
              opacity:       0.65,
              marginBottom:  "0.5rem",
            }}
          >
            {person.skills.join("  ·  ")}
          </p>
        )}

        {/* Portfolio link */}
        {person.portfolioUrl && (
          <p
            style={{
              fontFamily:    "var(--font-special-elite)",
              fontSize:      "0.6rem",
              letterSpacing: "0.08em",
              color:         INK,
              opacity:       0.6,
              marginBottom:  "0.5rem",
              overflow:      "hidden",
              textOverflow:  "ellipsis",
              whiteSpace:    "nowrap",
            }}
          >
            ↗ {person.portfolioUrl}
          </p>
        )}

        {/* Closing rule — separates posters in the same column */}
        <div
          style={{
            borderTop:   `1px solid ${INK}`,
            opacity:     0.3,
            marginTop:   "1.25rem",
          }}
        />
      </article>
    </Link>
  );
}

// ── Small reusable pieces ─────────────────────────────────────────────────────
function DoubleRule() {
  return (
    <div style={{ margin: "0.3rem 0" }}>
      <div style={{ borderTop: `3px solid ${INK}`, opacity: 0.8 }} />
      <div style={{ borderTop: `1px solid ${INK}`, opacity: 0.5, marginTop: 3 }} />
    </div>
  );
}

function InkRule() {
  return (
    <div
      style={{
        borderTop:    `1px solid ${INK}`,
        opacity:      0.3,
        margin:       "0.5rem 0",
      }}
    />
  );
}

function ColumnRule() {
  return (
    <div
      aria-hidden="true"
      style={{
        width:           1,
        alignSelf:       "stretch",
        backgroundColor: INK,
        opacity:         0.25,
        flexShrink:      0,
        margin:          "0 0.25rem",
      }}
    />
  );
}
