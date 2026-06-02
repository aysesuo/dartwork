"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import eventsData from "@/data/events.json";
import { useAuth } from "@/lib/auth";
import { getDisciplineColor } from "@/lib/disciplines";
import SignInCard from "@/components/SignInCard";

const INK = "#20180f";
const KRAFT = "#d8c19a";

// The desk calendar shows April 2025 — derive its data from the real events
const CAL_YEAR = 2025;
const CAL_MONTH = 3; // April (0-indexed)

const monthEvents = [...eventsData]
  .map((e) => ({ ...e, _date: new Date(e.dateTime) }))
  .sort((a, b) => a._date.getTime() - b._date.getTime());

// day-of-month → discipline hex, for events that fall in April 2025. Uses the
// SAME discipline→colour map as the Events page calendar so the two stay in sync.
const calEventHex: Record<number, string> = {};
for (const e of monthEvents) {
  if (e._date.getFullYear() === CAL_YEAR && e._date.getMonth() === CAL_MONTH) {
    calEventHex[e._date.getDate()] = getDisciplineColor(e.disciplines[0] ?? "Other").hex;
  }
}

// First few upcoming events for the "next up" footer
const nextUpEvents = monthEvents.slice(0, 3).map((e) => ({
  label: `${e._date.toLocaleDateString("en-US", { month: "short", day: "numeric" })} · ${e.title}`,
  hex: getDisciplineColor(e.disciplines[0] ?? "Other").hex,
}));

// Leading blank cells before April 1, 2025 (a Tuesday)
const CAL_LEAD = new Date(CAL_YEAR, CAL_MONTH, 1).getDay();
const CAL_DAYS = new Date(CAL_YEAR, CAL_MONTH + 1, 0).getDate();

export default function LandingPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  // Non-signed-in visitors get a blurred, text-free desk with a sign-in popup.
  const locked = !loading && !user;
  const stageRef = useRef<HTMLDivElement>(null);
  const dragRefN0 = useRef<HTMLDivElement>(null);
  const dragRefN1 = useRef<HTMLDivElement>(null);
  const dragRefN2 = useRef<HTMLDivElement>(null);
  const dragRefs = [dragRefN0, dragRefN1, dragRefN2];
  const dragDownRef = useRef<{ el: HTMLElement; x: number; y: number; l: number; t: number; moved: boolean } | null>(null);

  // Typewriter effect
  const [tagline, setTagline] = useState("");
  useEffect(() => {
    const full = "Where dArtists meet, collaborate & showcase.";
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setTagline(full.slice(0, i));
      if (i >= full.length) clearInterval(interval);
    }, 38 + Math.random() * 55);
    return () => clearInterval(interval);
  }, []);

  // Direct navigation — no animation
  const handleDoorClick = (e: React.MouseEvent, page: string, label: string) => {
    if (page === "projects.html") router.push("/projects");
    else if (page === "people.html") router.push("/people");
    else if (page === "events.html") router.push("/events");
    else if (page === "profile.html") router.push("/profile");
  };

  // Drag logic
  const handlePointerDown = (e: React.PointerEvent, key: string) => {
    const target = e.currentTarget as HTMLElement;
    if (stageRef.current) {
      const sr = stageRef.current.getBoundingClientRect();
      const r = target.getBoundingClientRect();
      const l = r.left - sr.left;
      const t = r.top - sr.top;
      dragDownRef.current = { el: target, x: e.clientX, y: e.clientY, l, t, moved: false };
      target.style.transition = "none";
      target.setPointerCapture?.(e.pointerId);
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (dragDownRef.current) {
      const dx = e.clientX - dragDownRef.current.x;
      const dy = e.clientY - dragDownRef.current.y;
      if (Math.abs(dx) + Math.abs(dy) > 5) dragDownRef.current.moved = true;
      dragDownRef.current.el.style.left = dragDownRef.current.l + dx + "px";
      dragDownRef.current.el.style.top = dragDownRef.current.t + dy + "px";
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (dragDownRef.current) {
      dragDownRef.current.el.style.transition = "";
      dragDownRef.current = null;
    }
  };

  return (
    <div className="desk" style={{ position: "fixed", inset: 0, overflow: "hidden" }}>
      <div
        style={{
          position:      "absolute",
          inset:         0,
          filter:        locked ? "blur(7px)" : "none",
          pointerEvents: locked ? "none" : "auto",
          userSelect:    locked ? "none" : "auto",
        }}
      >
      <div className="ruler"></div>

      {/* DECOR — scattered desk objects, behind the clickable props */}
      <div className="decor" aria-hidden style={{ position: "absolute", inset: 0, zIndex: 2, pointerEvents: "none" }}>
        <img src="/textures/ruler.png" alt="" style={{ position: "absolute", left: "28%", top: "3%", width: "330px", transform: "rotate(7deg)", opacity: 0.95 }} />
        <img src="/textures/pen.png" alt="" style={{ position: "absolute", left: "62%", top: "70%", width: "320px", transform: "rotate(-22deg)", opacity: 0.95 }} />
        <img src="/textures/fookie.png" alt="" style={{ position: "absolute", left: "41%", top: "74%", width: "180px", transform: "rotate(14deg)", opacity: 0.97 }} />
      </div>

      <div
        className="stage"
        ref={stageRef}
        style={{ position: "absolute", inset: 0, zIndex: 3 }}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        {/* MASTHEAD */}
        {!locked && (
        <div className="prop masthead lift" style={{ left: "2.5%", top: "11%", transform: "rotate(-3deg) scale(1.52)", transformOrigin: "top left" }}>
          <div className="tape tape--washi" style={{ position: "absolute", left: "-26px", top: "-14px", transform: "rotate(-24deg)" }}></div>
          <p className="masthead__eyebrow">Dartmouth's creative network</p>
          <h1 className="logo logo--ransom" id="logo">
            <span className="logo__line">
              <span className="rl" style={{ "--r": "3.5deg", "--bg": "#f3ead4", "--fg": "#20180f", fontFamily: "var(--font-anton)" } as any}>D</span>
              <span className="rl" style={{ "--r": "-5.8deg", "--bg": "#f0a6ad", "--fg": "#20180f", fontFamily: "var(--font-rye)" } as any}>A</span>
              <span className="rl" style={{ "--r": "2.8deg", "--bg": "#e7cd5e", "--fg": "#20180f", fontFamily: "var(--font-special-elite)" } as any}>R</span>
              <span className="rl" style={{ "--r": "-1.1deg", "--bg": "#a0d3e7", "--fg": "#20180f", fontFamily: "var(--font-alfa)" } as any}>T</span>
              <span className="rl" style={{ "--r": "-2.5deg", "--bg": "#20180f", "--fg": "#f3ead4", fontFamily: "var(--font-stardos)" } as any}>W</span>
              <span className="rl" style={{ "--r": "-5.0deg", "--bg": "#f3ead4", "--fg": "#20180f", fontFamily: "var(--font-anton)" } as any}>O</span>
              <span className="rl" style={{ "--r": "-1.9deg", "--bg": "#e7cd5e", "--fg": "#20180f", fontFamily: "var(--font-rye)" } as any}>R</span>
              <span className="rl" style={{ "--r": "-4.9deg", "--bg": "#f0a6ad", "--fg": "#20180f", fontFamily: "var(--font-special-elite)" } as any}>K</span>
            </span>
          </h1>
          <p className="tagline">{tagline}<span className="cursor">&nbsp;</span></p>
        </div>
        )}

        {/* JOURNAL → PROFILE */}
        <div className="prop journal door lift" onClick={(e) => handleDoorClick(e, "profile.html", "Profile")} style={{ left: "76%", top: "60%", transform: "rotate(-9deg) scale(1.02)" } as any}>
          <div className="journal__cover">
            <span className="journal__label">My<br />Profile</span>
            <span className="journal__tag">tap to open</span>
          </div>
        </div>

        {/* DESK CALENDAR → EVENTS */}
        <div className="prop deskcal door lift" onClick={(e) => handleDoorClick(e, "events.html", "Events")} style={{ left: "-5%", top: "40%", transform: "rotate(-2.5deg) scale(1.15)" } as any}>
          <div className="deskcal__sheet">
            <div className="deskcal__head"><span className="m">April</span><span className="y">'25</span></div>
            <div className="deskcal__dow"><span>S</span><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span></div>
            <div className="deskcal__grid" style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)" }}>
              {[...Array(CAL_LEAD)].map((_, i) => <div key={`empty-${i}`} className="deskcal__cell out"></div>)}
              {[...Array(CAL_DAYS)].map((_, d) => {
                const dayNum = d + 1;
                const hex = calEventHex[dayNum];
                return (
                  <div
                    key={dayNum}
                    className="deskcal__cell"
                    style={hex ? { backgroundColor: `${hex}59` } : undefined}
                  >
                    {dayNum}
                    {hex && <span className="dot" style={{ backgroundColor: hex, opacity: 1 }}></span>}
                  </div>
                );
              })}
            </div>
            <div className="deskcal__next">
              {nextUpEvents.map((e, i) => (
                <p key={i}><span className="dot" style={{ "--dot": e.hex } as any}></span>{e.label}</p>
              ))}
            </div>
          </div>
        </div>

        {/* NEWSPAPER → PEOPLE */}
        <div className="prop news door lift" onClick={(e) => handleDoorClick(e, "people.html", "People")} style={{ left: "34%", top: "47%", transform: "rotate(2.5deg) scale(1.2)" } as any}>
          <div className="news__paper">
            <div className="news__mast">The People's Gazette</div>
            <div className="news__sub">"Find dArtist to create with."</div>
            <div className="news__rule"></div>
            <div className="news__cols">
              {[
                { name: "Aysesu", role: "Visual Art", skills: "Painting · Risograph", interests: "Murals · Zines" },
                { name: "Theo K.", role: "Film · Editor", skills: "Premiere · Color", interests: "Documentary · Sound" },
                { name: "Michelle", role: "Writing", skills: "Poetry · Essays", interests: "Lit Magazines · Performance" },
              ].map((p) => (
                <div className="news__col" key={p.name}>
                  <b className="news__name">{p.name}</b>
                  <span className="news__role">{p.role}</span>
                  <span className="news__wanted">Wanted for: {p.interests}</span>
                  <span className="news__field"><b>Reward</b> {p.skills}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* COFFEE RING */}
        <div className="coffee" style={{ left: "54%", top: "72%" }}></div>

        {/* CORK BOARD → PROJECTS */}
        <div
          className="prop cork door"
          onClick={(e) => handleDoorClick(e, "projects.html", "Projects")}
          style={{ left: "59%", top: "9%", width: "34%", height: "400px", transform: "scale(1.12)" }}
        >
        </div>

        {/* PROJECT NOTES */}
        {[
          { color: "pink", film: "Film", roles: ["Cinematographer", "Editor"], title: "Ledyard: A Short Film", desc: "A 15-minute documentary following the Ledyard Canoe Club through a season on the river.", rot: "-3deg" },
          { color: "yellow", film: "Theater", roles: ["Music Director", "Stage Manager"], title: "Hop Stop — Original Musical", desc: "An original musical set in a late-night campus diner. Seeking a small band and crew.", rot: "2.5deg" },
          { color: "blue", film: "Photography", roles: ["Co-Photographer"], title: "Unseen Dartmouth", desc: "A photo essay on the quiet corners of campus most students never notice.", rot: "-1.5deg" },
        ].map((note, i) => (
          <div
            key={i}
            ref={dragRefs[i]}
            className={`prop note stock-${note.color} lift wobble door`}
            data-drag="true"
            onClick={(e) => {
              if (!dragDownRef.current?.moved) handleDoorClick(e, "projects.html", "Projects");
            }}
            onPointerDown={(e) => handlePointerDown(e, `n${i}`)}
            style={{
              left: i === 0 ? "60.5%" : i === 1 ? "77%" : "67%",
              top: i === 0 ? "12%" : i === 1 ? "13%" : "32%",
              transform: `rotate(${note.rot}) scale(1.12)`,
              "--rot": note.rot,
            } as any}
          >
            <span className="pin" style={{ "--pin": i === 0 ? "#e23b2e" : i === 1 ? "#2f6fe0" : "#eae6dd" } as any}></span>
            <div className="note__paper"></div>
            <div className="note__body">
              <p className="note__kicker">{note.film}</p>
              <div className="note__looking">
                <span className="lbl">Looking for:</span>
                {note.roles.map((role) => (
                  <span key={role} className="tag">{role}</span>
                ))}
              </div>
              <hr className="note__rule" />
              <h3 className="note__title">{note.title}</h3>
              <p className="note__by">Dartmouth Student</p>
              <p className="note__desc">{note.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* HINT */}
      {!locked && (
        <div className="hint">✦ <span>tap an object to open its page · drag the notes · peel the flap</span></div>
      )}
      </div>

      {/* LOCKED — blurry scrim + sign-in popup for non-signed-in visitors */}
      {locked && (
        <>
          <div
            aria-hidden
            style={{
              position:       "absolute",
              inset:          0,
              zIndex:         50,
              backdropFilter: "blur(2px)",
              backgroundColor: "rgba(20,16,10,0.45)",
            }}
          />
          <div
            style={{
              position:       "absolute",
              inset:          0,
              zIndex:         51,
              display:        "flex",
              alignItems:     "center",
              justifyContent: "center",
              padding:        "1rem",
            }}
          >
            <SignInCard theme="paper" />
          </div>
        </>
      )}
    </div>
  );
}
