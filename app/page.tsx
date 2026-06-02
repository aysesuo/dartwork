"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const INK = "#20180f";
const KRAFT = "#d8c19a";

export default function LandingPage() {
  const router = useRouter();
  const [expanding, setExpanding] = useState(false);
  const [expandPos, setExpandPos] = useState({ left: 0, top: 0, width: 0, height: 0, rot: 0 });
  const stageRef = useRef<HTMLDivElement>(null);
  const [dragStates, setDragStates] = useState<Record<string, { x: number; y: number }>>({});
  const dragRefN0 = useRef<HTMLDivElement>(null);
  const dragRefN1 = useRef<HTMLDivElement>(null);
  const dragRefN2 = useRef<HTMLDivElement>(null);
  const dragRefs = [dragRefN0, dragRefN1, dragRefN2];
  const dragDownRef = useRef<{ el: HTMLElement; x: number; y: number; l: number; t: number; moved: boolean } | null>(null);
  const openerRef = useRef<HTMLDivElement>(null);
  const [applyGo, setApplyGo] = useState(false);

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

  // Expand animation
  const handleDoorClick = (e: React.MouseEvent, page: string, label: string) => {
    if (expanding) return;
    const target = e.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    const style = getComputedStyle(target);
    const transform = style.transform;
    let rot = 0;
    if (transform && transform !== "none") {
      const m = transform.match(/matrix\(([^)]+)\)/);
      if (m) {
        const v = m[1].split(",");
        rot = Math.atan2(parseFloat(v[1]), parseFloat(v[0])) * (180 / Math.PI);
      }
    }

    setExpandPos({ left: rect.left, top: rect.top, width: rect.width, height: rect.height, rot });
    setExpanding(true);
    setApplyGo(false);

    // Trigger transition after DOM is painted with initial state
    setTimeout(() => setApplyGo(true), 16);

    // Navigate after transition completes
    setTimeout(() => {
      if (page === "projects.html") router.push("/projects");
      else if (page === "people.html") router.push("/people");
      else if (page === "events.html") router.push("/events");
      else if (page === "profile.html") router.push("/profile");
    }, 680);
  };

  // Drag logic
  const handlePointerDown = (e: React.PointerEvent, key: string) => {
    const target = e.currentTarget as HTMLElement;
    if (stageRef.current && !expanding) {
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
      <div className="ruler"></div>

      <div
        className="stage"
        ref={stageRef}
        style={{ position: "absolute", inset: 0, zIndex: 3 }}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        {/* MASTHEAD */}
        <div className="prop masthead lift" style={{ left: "3%", top: "7.5%", transform: "rotate(-1.4deg)" }}>
          <div className="tape tape--washi" style={{ position: "absolute", left: "-26px", top: "-14px", transform: "rotate(-24deg)" }}></div>
          <p className="masthead__eyebrow">Dartmouth's creative desk</p>
          <h1 className="logo logo--ransom" id="logo">
            <span className="logo__line">
              <span className="rl" style={{ "--r": "3.5deg", "--bg": "#f3ead4", "--fg": "#20180f", fontFamily: "'Anton'" } as any}>D</span>
              <span className="rl" style={{ "--r": "-5.8deg", "--bg": "#f0a6ad", "--fg": "#20180f", fontFamily: "'Rye'" } as any}>A</span>
              <span className="rl" style={{ "--r": "2.8deg", "--bg": "#e7cd5e", "--fg": "#20180f", fontFamily: "'Special Elite'" } as any}>R</span>
              <span className="rl" style={{ "--r": "-1.1deg", "--bg": "#a0d3e7", "--fg": "#20180f", fontFamily: "'Alfa Slab One'" } as any}>T</span>
              <span className="rl" style={{ "--r": "-2.5deg", "--bg": "#20180f", "--fg": "#f3ead4", fontFamily: "'Stardos Stencil'" } as any}>W</span>
              <span className="rl" style={{ "--r": "-5.0deg", "--bg": "#f3ead4", "--fg": "#20180f", fontFamily: "'Anton'" } as any}>O</span>
              <span className="rl" style={{ "--r": "-1.9deg", "--bg": "#e7cd5e", "--fg": "#20180f", fontFamily: "'Rye'" } as any}>R</span>
              <span className="rl" style={{ "--r": "-4.9deg", "--bg": "#f0a6ad", "--fg": "#20180f", fontFamily: "'Special Elite'" } as any}>K</span>
            </span>
          </h1>
          <p className="tagline">{tagline}<span className="cursor">&nbsp;</span></p>
          <button className="stamp" onClick={(e) => { e.currentTarget.classList.add("stamped"); setTimeout(() => e.currentTarget.classList.remove("stamped"), 320); }}>Post a project</button>
        </div>

        {/* PEEL CARD */}
        <div className="prop peel lift" style={{ left: "3.5%", top: "44%", transform: "rotate(2deg)" }}>
          <span className="pin pin-red"></span>
          <div className="peel__base">
            <p className="peel__hint">The fine print</p>
            <p className="peel__msg">A student-run home where d<em>Art</em>ists find collaborators, show work, and turn loose ideas into real projects.</p>
          </div>
          <div className="peel__flap" onClick={(e) => e.currentTarget.parentElement?.classList.toggle("open")}>
            <span className="corner">peel ↑</span>
            <div className="big">What is dartwork?</div>
            <div className="sm">peel to read</div>
          </div>
        </div>

        {/* JOURNAL → PROFILE */}
        <div className="prop journal door lift" onClick={(e) => handleDoorClick(e, "profile.html", "Profile")} style={{ left: "8%", top: "71%", "--j-rot": "5deg" } as any}>
          <div className="journal__cover">
            <span className="journal__edge"></span>
            <span className="journal__band"></span>
            <span className="journal__label">My<br />Profile</span>
            <span className="journal__tag">tap to open</span>
          </div>
          <span className="door__go">Profile ↗</span>
        </div>

        {/* DESK CALENDAR → EVENTS */}
        <div className="prop deskcal door lift" onClick={(e) => handleDoorClick(e, "events.html", "Events")} style={{ left: "24%", top: "40%", "--cal-rot": "-2.5deg" } as any}>
          <span className="deskcal__spiral"><i></i><i></i><i></i><i></i><i></i><i></i></span>
          <div className="deskcal__sheet">
            <div className="deskcal__head"><span className="m">April</span><span className="y">'25</span></div>
            <div className="deskcal__dow"><span>S</span><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span></div>
            <div className="deskcal__grid" style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)" }}>
              {[...Array(2)].map((_, i) => <div key={`empty-${i}`} className="deskcal__cell out"></div>)}
              {[...Array(30)].map((_, d) => {
                const dayNum = d + 1;
                const eventMap: Record<number, string> = { 4: "d-music", 10: "d-film", 12: "d-art", 17: "d-writing", 19: "d-theater", 24: "d-art", 26: "d-photo" };
                const c = eventMap[dayNum];
                return (
                  <div key={dayNum} className={`deskcal__cell${c ? " " + c : ""}`}>
                    {dayNum}
                    {c && <span className="dot"></span>}
                  </div>
                );
              })}
            </div>
            <div className="deskcal__next">
              <p><span className="dot" style={{ "--dot": "#d4632a" } as any}></span>Apr 12 · Riso Print Fair</p>
              <p><span className="dot" style={{ "--dot": "#5fb38a" } as any}></span>Apr 17 · Open Mic & Zine</p>
            </div>
          </div>
          <span className="door__go">Events ↗</span>
        </div>

        {/* NEWSPAPER → PEOPLE */}
        <div className="prop news door lift" onClick={(e) => handleDoorClick(e, "people.html", "People")} style={{ left: "42%", top: "50%", "--news-rot": "-2deg" } as any}>
          <div className="news__paper">
            <div className="news__mast">The Wanted Gazette</div>
            <div className="news__sub">"All the talent that's fit to print"</div>
            <div className="news__rule"></div>
            <div className="news__cols">
              <div className="news__col"><b className="news__name">Aysesu</b><span>Visual Art</span></div>
              <div className="news__col"><b className="news__name">Theo K.</b><span>Film · Editor</span></div>
              <div className="news__col"><b className="news__name">Michelle</b><span>Writing</span></div>
            </div>
          </div>
          <span className="door__go">People ↗</span>
        </div>

        {/* COFFEE RING */}
        <div className="coffee" style={{ left: "54%", top: "72%" }}></div>

        {/* CORK BOARD → PROJECTS */}
        <div
          className="prop cork door"
          onClick={(e) => handleDoorClick(e, "projects.html", "Projects")}
          style={{ left: "63%", top: "5%", width: "34%", height: "400px" }}
        >
          <span className="door__go" style={{ left: "18px", right: "auto", top: "18px", bottom: "auto" }}>Projects ↗</span>
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
              left: i === 0 ? "64.5%" : i === 1 ? "81%" : "71%",
              top: i === 0 ? "8%" : i === 1 ? "9%" : "28%",
              transform: `rotate(${note.rot})`,
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

      {/* EXPAND OVERLAY */}
      {expanding && (
        <div
          ref={openerRef}
          className={`opener opener--cork ${applyGo ? "go" : ""}`}
          style={{
            position: "fixed",
            left: applyGo ? 0 : expandPos.left,
            top: applyGo ? 0 : expandPos.top,
            width: applyGo ? "100vw" : expandPos.width,
            height: applyGo ? "100vh" : expandPos.height,
            zIndex: 300,
            transition: applyGo ? "all 0.66s cubic-bezier(0.25, 0.46, 0.45, 0.94)" : "none",
          }}
        >
          <div className="opener__label"></div>
        </div>
      )}

      {/* HINT */}
      <div className="hint">✦ <span>tap an object to open its page · drag the notes · peel the flap</span></div>
    </div>
  );
}
