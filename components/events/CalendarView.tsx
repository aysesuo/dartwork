"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import { DartworkEvent } from "@/lib/calendarAdapter";
import { getDisciplineColor } from "@/lib/disciplines";

interface CalendarViewProps {
  events: DartworkEvent[];
  onEventSelect: (event: DartworkEvent) => void;
}

const WEEKDAYS = ["Sun", "Mon", "Tues", "Wed", "Thurs", "Fri", "Sat"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const INK = "#3a342b";

function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export default function CalendarView({ events, onEventSelect }: CalendarViewProps) {
  const today = useMemo(() => new Date(), []);

  // Earliest event month — used as the initial view so events are visible.
  const earliest = useMemo(() => {
    if (events.length === 0) return null;
    return events
      .map((e) => new Date(e.dateTime))
      .reduce((min, d) => (d < min ? d : min));
  }, [events]);

  const [view, setView] = useState<Date>(() => new Date(today.getFullYear(), today.getMonth(), 1));

  // Jump to the earliest event's month once, unless the user has navigated.
  const userNavigated = useRef(false);
  useEffect(() => {
    if (!userNavigated.current && earliest) {
      setView(new Date(earliest.getFullYear(), earliest.getMonth(), 1));
    }
  }, [earliest]);

  const viewYear = view.getFullYear();
  const viewMonth = view.getMonth();

  const firstDay = new Date(viewYear, viewMonth, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  // Group this month's events by day-of-month.
  const eventsByDay = useMemo(() => {
    const map: Record<number, DartworkEvent[]> = {};
    for (const e of events) {
      const d = new Date(e.dateTime);
      if (d.getFullYear() === viewYear && d.getMonth() === viewMonth) {
        (map[d.getDate()] ??= []).push(e);
      }
    }
    for (const day of Object.keys(map)) {
      map[+day].sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());
    }
    return map;
  }, [events, viewYear, viewMonth]);

  // Build the grid of cells (null = blank padding day).
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  const rows = cells.length / 7;

  function go(delta: number) {
    userNavigated.current = true;
    setView(new Date(viewYear, viewMonth + delta, 1));
  }

  return (
    <div className="flex flex-col w-full h-full" style={{ color: INK }}>
      {/* Hand-drawn wobble filter (applied to the grid lines only) */}
      <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden>
        <filter id="cal-wobble">
          <feTurbulence type="fractalNoise" baseFrequency="0.018" numOctaves="2" seed="7" result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="4.5" />
        </filter>
      </svg>

      {/* ── Month header + nav ── */}
      <div className="flex items-center justify-between shrink-0">
        <button
          onClick={() => go(-1)}
          aria-label="Previous month"
          className="px-3 leading-none hover:opacity-50 transition-opacity"
          style={{ fontFamily: "var(--font-caveat), cursive", fontSize: "2rem", color: INK }}
        >
          ‹
        </button>
        <h3
          className="text-center leading-none"
          style={{ fontFamily: "var(--font-caveat), cursive", fontSize: "2.4rem", fontWeight: 700, color: INK }}
        >
          {MONTHS[viewMonth]} {viewYear}
        </h3>
        <button
          onClick={() => go(1)}
          aria-label="Next month"
          className="px-3 leading-none hover:opacity-50 transition-opacity"
          style={{ fontFamily: "var(--font-caveat), cursive", fontSize: "2rem", color: INK }}
        >
          ›
        </button>
      </div>

      {/* ── Weekday header ── */}
      <div className="grid grid-cols-7 shrink-0">
        {WEEKDAYS.map((w) => (
          <div
            key={w}
            className="text-center pb-0.5"
            style={{ fontFamily: "var(--font-caveat), cursive", fontSize: "1.15rem", fontWeight: 700, color: INK }}
          >
            {w}
          </div>
        ))}
      </div>

      {/* ── Day grid (fills remaining height) ── */}
      <div className="relative flex-1 min-h-0">
        {/* Hand-drawn ink grid lines */}
        <svg
          className="absolute inset-0 pointer-events-none"
          width="100%"
          height="100%"
          viewBox={`0 0 700 ${rows * 100}`}
          preserveAspectRatio="none"
          style={{ filter: "url(#cal-wobble)" }}
          aria-hidden
        >
          <g stroke={INK} strokeWidth={1.6} strokeLinecap="round" fill="none">
            <rect x="2" y="2" width="696" height={rows * 100 - 4} />
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <line key={`v${i}`} x1={i * 100} y1="2" x2={i * 100} y2={rows * 100 - 2} />
            ))}
            {Array.from({ length: rows - 1 }, (_, j) => (
              <line key={`h${j}`} x1="2" y1={(j + 1) * 100} x2="698" y2={(j + 1) * 100} />
            ))}
          </g>
        </svg>

        {/* Cells */}
        <div
          className="grid grid-cols-7 absolute inset-0"
          style={{ gridTemplateRows: `repeat(${rows}, 1fr)` }}
        >
          {cells.map((day, i) => {
            const isToday = day != null && sameDay(new Date(viewYear, viewMonth, day), today);
            const dayEvents = day != null ? eventsByDay[day] ?? [] : [];
            const rot = ((i * 7) % 5) - 2; // -2..2deg, stable per cell
            return (
              <div key={i} className="relative overflow-hidden" style={{ minHeight: 0 }}>
                {day != null && (
                  <>
                    {/* Day number */}
                    <span
                      className="absolute top-0.5 left-1.5 leading-none select-none"
                      style={{
                        fontFamily: "var(--font-caveat), cursive",
                        fontSize: "1.25rem",
                        fontWeight: 700,
                        color: INK,
                        transform: `rotate(${rot}deg)`,
                        ...(isToday
                          ? {
                              color: "#fff",
                              background: "#9F1239",
                              borderRadius: "9999px",
                              width: "1.5em",
                              height: "1.5em",
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }
                          : {}),
                      }}
                    >
                      {day}
                    </span>

                    {/* Events — jotted as dot + handwritten title */}
                    <div className="absolute inset-x-1 flex flex-col gap-0.5" style={{ top: "1.6rem" }}>
                      {dayEvents.slice(0, 3).map((ev) => {
                        const primary = ev.disciplines[0] ?? "Other";
                        const { hex } = getDisciplineColor(primary);
                        return (
                          <button
                            key={ev.id}
                            type="button"
                            onClick={() => onEventSelect(ev)}
                            title={ev.title}
                            className="flex items-center gap-1 w-full text-left hover:opacity-70 transition-opacity"
                          >
                            <span
                              className="shrink-0 rounded-full"
                              style={{ width: 7, height: 7, backgroundColor: hex, border: `1px solid ${INK}` }}
                            />
                            <span
                              className="truncate"
                              style={{
                                fontFamily: "var(--font-caveat), cursive",
                                fontSize: "1rem",
                                lineHeight: 1.1,
                                color: INK,
                              }}
                            >
                              {ev.title}
                            </span>
                          </button>
                        );
                      })}
                      {dayEvents.length > 3 && (
                        <span
                          style={{
                            fontFamily: "var(--font-caveat), cursive",
                            fontSize: "0.9rem",
                            color: INK,
                            opacity: 0.65,
                            paddingLeft: 12,
                          }}
                        >
                          +{dayEvents.length - 3} more
                        </span>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
