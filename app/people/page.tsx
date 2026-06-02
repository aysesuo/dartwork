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
  photoURL?:     string | null;
}

const INK = "#1a1a1a";
const STAMP_RED = "rgba(160, 28, 20, 0.82)";

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

  // When a search is active, compute which ids match.
  // null means no search — no stamps shown.
  const matchSet = useMemo<Set<string> | null>(() => {
    if (!search.trim()) return null;
    const q = search.toLowerCase();
    return new Set(
      people
        .filter(
          (p) =>
            p.name.toLowerCase().includes(q) ||
            p.skills.some((s) => s.toLowerCase().includes(q)) ||
            p.disciplines.some((d) => d.toLowerCase().includes(q)),
        )
        .map((p) => p.id),
    );
  }, [people, search]);

  // When searching: matches float to the top, non-matches sink below.
  // Fill columns right-to-left so the first match lands in the top-right column.
  const sorted = useMemo(() => {
    if (!matchSet) return people;
    return [
      ...people.filter((p) =>  matchSet.has(p.id)),  // matches first
      ...people.filter((p) => !matchSet.has(p.id)),  // non-matches after
    ];
  }, [people, matchSet]);

  const cols: [Person[], Person[], Person[]] = [[], [], []];
  sorted.forEach((p, i) => {
    // When search active: fill right → middle → left so matches appear top-right.
    // When idle: normal left → right order.
    const col = matchSet ? (2 - (i % 3)) : (i % 3);
    cols[col].push(p);
  });

  return (
    <main
      style={{
        minHeight:            "100vh",
        color:                INK,
        backgroundImage:      "url(/textures/grunge-paper-background.jpg)",
        backgroundSize:       "cover",
        backgroundPosition:   "center",
        backgroundAttachment: "fixed",
      }}
    >
      {/* ══ MASTHEAD ══════════════════════════════════════════════════════════ */}
      <header style={{ padding: "2rem 2.5rem 0", textAlign: "center" }}>
        <DoubleRule />

        <h1
          style={{
            fontFamily:    "var(--font-playfair)",
            fontSize:      "clamp(2.2rem, 6vw, 5rem)",
            fontWeight:    900,
            letterSpacing: "-0.01em",
            lineHeight:    1,
            color:         INK,
            margin:        "0.5rem 0 0.3rem",
          }}
        >
          The Dartwork Gazette
        </h1>

        <p
          style={{
            fontFamily:    "var(--font-special-elite)",
            fontSize:      "0.72rem",
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color:         INK,
            opacity:       0.65,
            margin:        "0 0 0.5rem",
          }}
        >
          &ldquo;All the talent that&rsquo;s fit to print&rdquo;
        </p>

        <DoubleRule />

        {/* Dateline + search */}
        <div
          style={{
            display:        "flex",
            alignItems:     "center",
            justifyContent: "space-between",
            flexWrap:       "wrap",
            gap:            "0.5rem",
            padding:        "0.45rem 0",
          }}
        >
          <span
            style={{
              fontFamily:    "var(--font-special-elite)",
              fontSize:      "0.7rem",
              fontWeight:    700,
              letterSpacing: "0.1em",
              color:         INK,
            }}
          >
            Hanover, N.H.&nbsp;&nbsp;·&nbsp;&nbsp;Est. 2025&nbsp;&nbsp;·&nbsp;&nbsp;Vol. I
          </span>

          <input
            type="text"
            placeholder="Search name, skill, discipline…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              fontFamily:    "var(--font-special-elite)",
              fontSize:      "0.72rem",
              fontWeight:    700,
              letterSpacing: "0.05em",
              color:         INK,
              background:    "transparent",
              border:        "none",
              borderBottom:  `1.5px solid ${INK}`,
              outline:       "none",
              padding:       "0.2rem 0.4rem",
              width:         230,
            }}
          />
        </div>

        <div style={{ borderTop: `1px solid ${INK}`, opacity: 0.35 }} />
      </header>

      {/* ══ BROADSHEET BODY ═══════════════════════════════════════════════════ */}
      <div style={{ display: "flex", alignItems: "flex-start", padding: "0 1rem 4rem" }}>

        {loading && <StatusLine>Composing the type…</StatusLine>}
        {!loading && error && <StatusLine>The presses jammed. Please refresh.</StatusLine>}
        {!loading && !error && people.length === 0 && (
          <StatusLine>No public profiles yet.</StatusLine>
        )}

        {!loading && !error && people.length > 0 && (
          <>
            <Column people={cols[0]} matchSet={matchSet} />
            <ColumnRule />
            <Column people={cols[1]} matchSet={matchSet} />
            <ColumnRule />
            <Column people={cols[2]} matchSet={matchSet} />
          </>
        )}
      </div>
    </main>
  );
}

// ── Column ────────────────────────────────────────────────────────────────────
function Column({ people, matchSet }: { people: Person[]; matchSet: Set<string> | null }) {
  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      {people.map((person) => (
        <Poster
          key={person.id}
          person={person}
          located={matchSet !== null && !matchSet.has(person.id)}
        />
      ))}
    </div>
  );
}

// ── Poster ────────────────────────────────────────────────────────────────────
function Poster({ person, located = false }: { person: Person; located?: boolean }) {
  const safeName = sanitize(person.name);
  const safeBio  = sanitize(person.bio ?? "");
  const initials = safeName.split(" ").map((n) => n[0] ?? "").join("").slice(0, 2).toUpperCase();

  // Seeded stamp rotation so each card has a consistent but unique angle
  const stampRot = -6 - (person.id.charCodeAt(0) % 10); // –6° to –16°

  return (
    <Link href={`/profile/${person.id}`} style={{ display: "block", textDecoration: "none", color: INK }}>
      <article style={{ padding: "1.6rem 2rem 0", position: "relative", cursor: "pointer" }}>

        {/* ── LOCATED stamp — only when search active + no match ──────────── */}
        {located && (
          <div
            aria-hidden="true"
            style={{
              position:       "absolute",
              top:            "50%",
              left:           "50%",
              transform:      `translate(-50%, -50%) rotate(${stampRot}deg)`,
              zIndex:         10,
              border:         `4px solid ${STAMP_RED}`,
              color:          STAMP_RED,
              padding:        "6px 20px 8px",
              fontFamily:     "var(--font-barlow)",
              fontSize:       "2rem",
              fontWeight:     900,
              letterSpacing:  "0.3em",
              textTransform:  "uppercase",
              pointerEvents:  "none",
              userSelect:     "none",
              lineHeight:     1,
              boxShadow:      `inset 0 0 0 2px ${STAMP_RED}`,
              opacity:        0.82,
              whiteSpace:     "nowrap",
            }}
          >
            LOCATED
          </div>
        )}

        {/* ── WANTED banner ───────────────────────────────────────────────── */}
        <div
          style={{
            textAlign:    "center",
            borderTop:    `2px solid ${INK}`,
            borderBottom: `2px solid ${INK}`,
            padding:      "0.35rem 0",
            marginBottom: "1.1rem",
          }}
        >
          <span
            style={{
              fontFamily:    "var(--font-barlow)",
              fontSize:      "1.6rem",
              fontWeight:    900,
              letterSpacing: "0.45em",
              textTransform: "uppercase",
              color:         INK,
            }}
          >
            WANTED
          </span>
        </div>

        {/* ── Photo (newspaper-ink) or initials box ───────────────────────── */}
        {/* Photo (or Dr. Seuss default) — newspaper ink filter */}
        <div
          style={{
            width:      80,
            height:     80,
            margin:     "0 auto 1rem",
            border:     `2px solid ${INK}`,
            overflow:   "hidden",
            flexShrink: 0,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={person.photoURL ?? "/images/dr_seuss.webp"}
            alt={safeName}
            style={{
              width:     "100%",
              height:    "100%",
              objectFit: "cover",
              filter:    "grayscale(1) contrast(2.4) brightness(0.55) sepia(0.15)",
              display:   "block",
            }}
          />
        </div>

        {/* ── Name ──────────────────────────────────────────────────────────── */}
        <h2
          style={{
            fontFamily:    "var(--font-barlow)",
            fontSize:      "1.2rem",
            fontWeight:    800,
            textTransform: "uppercase",
            letterSpacing: "0.07em",
            textAlign:     "center",
            lineHeight:    1.1,
            color:         INK,
            marginBottom:  "0.5rem",
          }}
        >
          {safeName}
        </h2>

        {/* ── FOR: disciplines (interests) ──────────────────────────────────── */}
        {person.disciplines.length > 0 && (
          <p
            style={{
              fontFamily:    "var(--font-special-elite)",
              fontSize:      "0.63rem",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              textAlign:     "center",
              color:         INK,
              marginBottom:  "0.6rem",
            }}
          >
            <strong>FOR:</strong>&nbsp; {person.disciplines.join("  ·  ")}
          </p>
        )}

        <InkRule />

        {/* ── Bio ───────────────────────────────────────────────────────────── */}
        {safeBio && (
          <p
            style={{
              fontFamily:   "var(--font-special-elite)",
              fontSize:     "0.73rem",
              lineHeight:   1.7,
              color:        INK,
              opacity:      0.88,
              marginBottom: "0.7rem",
            }}
          >
            {safeBio}
          </p>
        )}

        {/* ── REWARD: skills ────────────────────────────────────────────────── */}
        {person.skills.length > 0 && (
          <p
            style={{
              fontFamily:    "var(--font-special-elite)",
              fontSize:      "0.63rem",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color:         INK,
              opacity:       0.85,
              marginBottom:  "0.5rem",
            }}
          >
            <strong>REWARD:</strong>&nbsp; {person.skills.join("  ·  ")}
          </p>
        )}

        {/* ── Portfolio ─────────────────────────────────────────────────────── */}
        {person.portfolioUrl && (
          <p
            style={{
              fontFamily:   "var(--font-special-elite)",
              fontSize:     "0.6rem",
              letterSpacing: "0.06em",
              color:        INK,
              opacity:      0.55,
              marginBottom: "0.5rem",
              overflow:     "hidden",
              textOverflow: "ellipsis",
              whiteSpace:   "nowrap",
            }}
          >
            ↗ {person.portfolioUrl}
          </p>
        )}

        {/* Closing rule */}
        <div style={{ borderTop: `1px solid ${INK}`, opacity: 0.25, marginTop: "1.5rem" }} />
      </article>
    </Link>
  );
}

// ── Reusable atoms ────────────────────────────────────────────────────────────
function DoubleRule() {
  return (
    <div style={{ margin: "0.3rem 0" }}>
      <div style={{ borderTop: `3px solid ${INK}`, opacity: 0.85 }} />
      <div style={{ borderTop: `1px solid ${INK}`, opacity: 0.5, marginTop: 3 }} />
    </div>
  );
}

function InkRule() {
  return <div style={{ borderTop: `1px solid ${INK}`, opacity: 0.25, margin: "0.55rem 0" }} />;
}

function ColumnRule() {
  return (
    <div
      aria-hidden="true"
      style={{
        width:           1,
        alignSelf:       "stretch",
        backgroundColor: INK,
        opacity:         0.2,
        flexShrink:      0,
        margin:          "0 0.5rem",
      }}
    />
  );
}

function StatusLine({ children }: { children: React.ReactNode }) {
  return (
    <p
      style={{
        width:      "100%",
        textAlign:  "center",
        padding:    "4rem",
        fontFamily: "var(--font-special-elite)",
        fontSize:   "0.85rem",
        opacity:    0.6,
        color:      INK,
      }}
    >
      {children}
    </p>
  );
}
