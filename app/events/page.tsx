"use client";

import { useState, useMemo } from "react";
import { List, CalendarDays } from "lucide-react";
import eventsData from "@/data/events.json";
import EventCard from "@/components/events/EventCard";
import CalendarView from "@/components/events/CalendarView";
import DisciplineFilterBar from "@/components/shared/DisciplineFilterBar";
import { DISCIPLINES, getDisciplineColor } from "@/lib/disciplines";
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
    <main className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-black text-gray-900 font-[family-name:var(--font-playfair)]">Events</h1>
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
            className="px-4 py-2 text-white rounded-full text-sm font-semibold transition-opacity hover:opacity-90"
            style={{ backgroundColor: "#C96040" }}
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredEvents.map((event) => (
              <button
                key={event.id}
                type="button"
                onClick={() => setSelectedEvent(event)}
                className="rounded-xl text-left hover:-translate-y-0.5 transition-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-green-700"
                aria-label={`Open details for ${event.title}`}
              >
                <EventCard event={event} />
              </button>
            ))}
          </div>
        )
      ) : (
        <CalendarView events={filteredEvents} onEventSelect={setSelectedEvent} />
      )}

      {selectedEvent && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedEvent(null)}
        >
          <div
            className="bg-white rounded-xl max-w-lg w-full p-6 flex flex-col gap-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex flex-wrap gap-1">
                {selectedEvent.disciplines.map((d) => {
                  const colors = getDisciplineColor(d);
                  return (
                    <span
                      key={d}
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors.tailwindBg} ${colors.tailwindText}`}
                    >
                      {d}
                    </span>
                  );
                })}
              </div>
              <button
                onClick={() => setSelectedEvent(null)}
                className="text-gray-400 hover:text-gray-600 text-xl leading-none shrink-0"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <h2 className="font-semibold text-xl text-gray-900">
              {selectedEvent.title}
            </h2>

            <div className="text-sm text-gray-600 space-y-1">
              <p className="font-medium">
                {new Date(selectedEvent.dateTime).toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
                {" · "}
                {new Date(selectedEvent.dateTime).toLocaleTimeString("en-US", {
                  hour: "numeric",
                  minute: "2-digit",
                })}
                {selectedEvent.endDateTime
                  ? ` – ${new Date(selectedEvent.endDateTime).toLocaleTimeString(
                      "en-US",
                      { hour: "numeric", minute: "2-digit" }
                    )}`
                  : ""}
              </p>
              <p className="text-gray-500">{selectedEvent.location}</p>
            </div>

            <p className="text-sm text-gray-600 leading-relaxed">
              {selectedEvent.description}
            </p>

            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
              <p className="text-xs text-gray-400">
                by {selectedEvent.organizer}
              </p>
              <button
                onClick={() => downloadIcs(selectedEvent)}
                className="px-4 py-2 text-white rounded-full text-sm font-semibold transition-opacity hover:opacity-90"
                style={{ backgroundColor: "#C96040" }}
              >
                Add to Calendar
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
