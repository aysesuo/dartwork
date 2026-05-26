"use client";

import { useState, useMemo } from "react";
import { List, CalendarDays } from "lucide-react";
import eventsData from "@/data/events.json";
import EventCard from "@/components/events/EventCard";
import CalendarView from "@/components/events/CalendarView";
import DisciplineFilterBar from "@/components/shared/DisciplineFilterBar";
import { DISCIPLINES } from "@/lib/disciplines";
import { DartworkEvent } from "@/lib/calendarAdapter";
import { downloadIcs } from "@/lib/exportIcs";

export default function EventsPage() {
  const [view, setView] = useState<"list" | "calendar">("list");
  const [activeFilters, setActiveFilters] = useState<string[]>([...DISCIPLINES]);
  const [selectedEvent, setSelectedEvent] = useState<DartworkEvent | null>(null);

  const sorted = useMemo(
    () =>
      [...eventsData].sort(
        (a, b) =>
          new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime()
      ),
    []
  );

  const filteredEvents = useMemo(() => {
    if (activeFilters.length === 0) return [];
    const activeSet = new Set(activeFilters);
    return sorted.filter((event) =>
      event.disciplines.some((d) => activeSet.has(d))
    ) as DartworkEvent[];
  }, [sorted, activeFilters]);

  function handleToggle(discipline: string) {
    setActiveFilters((prev) => {
      // Already the only active discipline → reset to all
      if (prev.length === 1 && prev[0] === discipline) return [...DISCIPLINES];
      // Otherwise show only this discipline
      return [discipline];
    });
  }

  function handleToggleAll() {
    setActiveFilters([...DISCIPLINES]);
  }

  return (
    <main className="events-bg max-w-5xl mx-auto px-4 py-8 font-[family-name:var(--font-special-elite)]">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-5xl font-extrabold uppercase tracking-tight font-[family-name:var(--font-barlow)]" style={{ color: "#f5f5f0" }}>Events</h1>
        <div className="flex items-center gap-2">
          <div className="flex border border-gray-200 rounded-lg overflow-hidden text-sm">
            <button
              onClick={() => setView("list")}
              className={`flex items-center gap-1.5 px-3 py-1.5 transition-colors ${
                view === "list"
                  ? "bg-green-700 text-white"
                  : "bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              <List className="h-4 w-4" aria-hidden="true" />
              List
            </button>
            <button
              onClick={() => setView("calendar")}
              className={`flex items-center gap-1.5 px-3 py-1.5 transition-colors ${
                view === "calendar"
                  ? "bg-green-700 text-white"
                  : "bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              <CalendarDays className="h-4 w-4" aria-hidden="true" />
              Calendar
            </button>
          </div>
          <a
            href="https://tally.so/r/VL4QEN"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 text-white rounded-full text-xs font-bold uppercase tracking-widest transition-opacity hover:opacity-90"
            style={{ backgroundColor: "#FF6B35" }}
          >
            Post an Event
          </a>
        </div>
      </div>

      <div className="mb-6">
        <DisciplineFilterBar
          activeFilters={activeFilters}
          onToggle={handleToggle}
          onToggleAll={handleToggleAll}
        />
      </div>

      {view === "list" ? (
        filteredEvents.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-16">
            No events match your filters.
          </p>
        ) : (
          <div className="columns-1 sm:columns-2 lg:columns-3 gap-x-5">
            {filteredEvents.map((event, i) => (
              <button
                key={event.id}
                type="button"
                onClick={() => setSelectedEvent(event)}
                className="block w-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B35]"
                aria-label={`Open details for ${event.title}`}
              >
                <EventCard event={event} index={i} />
              </button>
            ))}
          </div>
        )
      ) : (
        <CalendarView events={filteredEvents} onEventSelect={setSelectedEvent} />
      )}

      {selectedEvent && (
        <div
          className="modal-backdrop fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedEvent(null)}
        >
          <div
            className="max-w-lg w-full max-h-[90vh] overflow-y-auto font-[family-name:var(--font-special-elite)]"
            style={{ transform: "rotate(-0.5deg)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="border-2 border-[#2a2a2a] bg-[#f0ead8] text-[#1a1a1a] p-6 flex flex-col gap-4">
              {/* Header row */}
              <div className="flex items-start justify-between gap-2">
                <span className="text-[10px] uppercase tracking-widest opacity-60">
                  {selectedEvent.disciplines.join(" · ")}
                </span>
                <button
                  onClick={() => setSelectedEvent(null)}
                  className="text-[#1a1a1a] hover:opacity-60 text-2xl leading-none shrink-0"
                  aria-label="Close"
                >
                  ×
                </button>
              </div>

              {/* Headline */}
              <h2 className="font-bold uppercase text-xl text-center border-y-2 border-[#2a2a2a] py-2 leading-tight tracking-wide">
                {selectedEvent.title}
              </h2>

              {/* Date / time / location */}
              <div className="text-[11px] uppercase tracking-widest opacity-70 space-y-0.5">
                <p>
                  {(() => {
                    const d = new Date(selectedEvent.dateTime);
                    const s = ["th","st","nd","rd"];
                    const v = d.getDate() % 100;
                    const ord = d.getDate() + (s[(v-20)%10] ?? s[v] ?? s[0]);
                    return `${d.toLocaleDateString("en-US",{weekday:"long"})}, ${d.toLocaleDateString("en-US",{month:"long"})} ${ord}`;
                  })()}
                  {" · "}
                  {new Date(selectedEvent.dateTime).toLocaleTimeString("en-US", {
                    hour: "numeric", minute: "2-digit",
                  })}
                  {selectedEvent.endDateTime
                    ? ` – ${new Date(selectedEvent.endDateTime).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`
                    : ""}
                </p>
                <p>{selectedEvent.location}</p>
              </div>

              {/* Body */}
              <p className="text-sm leading-relaxed" style={{ textAlign: "justify" }}>
                {selectedEvent.description}
              </p>

              {/* Footer */}
              <div className="flex items-center justify-between pt-3 border-t border-[#2a2a2a]">
                <p className="text-[10px] uppercase tracking-widest opacity-60 italic normal-case">
                  {selectedEvent.organizer}
                </p>
                <button
                  onClick={() => downloadIcs(selectedEvent)}
                  className="px-4 py-1.5 text-[#f0ead8] text-[11px] uppercase tracking-widest font-bold border border-[#2a2a2a] bg-[#2a2a2a] hover:bg-[#1a1a1a] transition-colors"
                >
                  Add to Calendar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
