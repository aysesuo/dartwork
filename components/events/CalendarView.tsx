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

  // Build a 6×7 grid of cells (null = blank padding day).
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  function go(delta: number) {
    userNavigated.current = true;
    setView(new Date(viewYear, viewMonth + delta, 1));
  }

  const ink = "#2a2a2a";

  return (
    <div
      className="relative w-full mx-auto"
      style={{
        maxWidth: 920,
        aspectRatio: "301 / 211",
        backgroundImage: "url(/textures/calendar.png)",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Inner paper panel — masks the printed grid so our digital grid is the source of truth */}
      <div
        className="absolute flex flex-col"
        style={{
          left: "3.5%",
          right: "3.5%",
          top: "13.5%",
          bottom: "5%",
          background: "rgba(247, 246, 238, 0.86)",
          color: ink,
        }}
      >
        {/* ── Month header (handwritten) + nav ── */}
        <div className="flex items-center justify-between px-2 pt-1 pb-0.5">
          <button
            onClick={() => go(-1)}
            aria-label="Previous month"
            className="px-2 leading-none hover:opacity-60 transition-opacity"
            style={{ fontFamily: "var(--font-caveat), cursive", fontSize: "1.8rem" }}
          >
            ‹
          </button>
          <h3
            className="text-center leading-none"
            style={{ fontFamily: "var(--font-caveat), cursive", fontSize: "2.2rem", fontWeight: 700 }}
          >
            {MONTHS[viewMonth]} {viewYear}
          </h3>
          <button
            onClick={() => go(1)}
            aria-label="Next month"
            className="px-2 leading-none hover:opacity-60 transition-opacity"
            style={{ fontFamily: "var(--font-caveat), cursive", fontSize: "1.8rem" }}
          >
            ›
          </button>
        </div>

        {/* ── Weekday header (handwritten) ── */}
        <div className="grid grid-cols-7 shrink-0" style={{ borderBottom: `1.5px solid ${ink}` }}>
          {WEEKDAYS.map((w) => (
            <div
              key={w}
              className="text-center pb-0.5"
              style={{ fontFamily: "var(--font-caveat), cursive", fontSize: "1.05rem", fontWeight: 700 }}
            >
              {w}
            </div>
          ))}
        </div>

        {/* ── Day grid ── */}
        <div
          className="grid grid-cols-7 flex-1"
          style={{ gridAutoRows: "1fr" }}
        >
          {cells.map((day, i) => {
            const isToday = day != null && sameDay(new Date(viewYear, viewMonth, day), today);
            const dayEvents = day != null ? eventsByDay[day] ?? [] : [];
            return (
              <div
                key={i}
                className="relative overflow-hidden"
                style={{
                  borderRight: (i % 7) !== 6 ? `1px solid ${ink}` : undefined,
                  borderBottom: i < cells.length - 7 ? `1px solid ${ink}` : undefined,
                  minHeight: 0,
                }}
              >
                {day != null && (
                  <>
                    {/* Day number (handwritten) */}
                    <span
                      className="absolute top-0.5 left-1 leading-none select-none"
                      style={{
                        fontFamily: "var(--font-caveat), cursive",
                        fontSize: "1rem",
                        fontWeight: 700,
                        ...(isToday
                          ? {
                              color: "#fff",
                              background: "#9F1239",
                              borderRadius: "9999px",
                              width: "1.4em",
                              height: "1.4em",
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }
                          : {}),
                      }}
                    >
                      {day}
                    </span>

                    {/* Events */}
                    <div className="absolute inset-x-0.5 top-5 flex flex-col gap-0.5">
                      {dayEvents.slice(0, 3).map((ev) => {
                        const primary = ev.disciplines[0] ?? "Other";
                        const { hex } = getDisciplineColor(primary);
                        return (
                          <button
                            key={ev.id}
                            type="button"
                            onClick={() => onEventSelect(ev)}
                            title={ev.title}
                            className="block w-full text-left truncate px-1 py-px rounded-sm hover:opacity-90 transition-opacity"
                            style={{
                              backgroundColor: hex,
                              color: "#fff",
                              fontFamily: "var(--font-special-elite), monospace",
                              fontSize: "0.6rem",
                              lineHeight: 1.25,
                            }}
                          >
                            {ev.title}
                          </button>
                        );
                      })}
                      {dayEvents.length > 3 && (
                        <span
                          className="px-1"
                          style={{
                            fontFamily: "var(--font-special-elite), monospace",
                            fontSize: "0.55rem",
                            opacity: 0.7,
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
