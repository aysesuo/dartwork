"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import Link from "next/link";
import { List, CalendarDays } from "lucide-react";
import EventCard from "@/components/events/EventCard";
import CalendarView from "@/components/events/CalendarView";
import DisciplineFilterBar from "@/components/shared/DisciplineFilterBar";
import { DISCIPLINES } from "@/lib/disciplines";
import { DartworkEvent } from "@/lib/calendarAdapter";
import { downloadIcs } from "@/lib/exportIcs";
import AuthGuard from "@/components/auth/AuthGuard";
import { useAuth } from "@/lib/auth";

// Extend DartworkEvent to carry creatorUid for owner-control UI
interface LiveEvent extends DartworkEvent {
  creatorUid?: string;
}

export default function EventsPage() {
  const { user } = useAuth();
  const [view,          setView]          = useState<"list" | "calendar">("list");
  const [activeFilters, setActiveFilters] = useState<string[]>([...DISCIPLINES]);
  const [selectedEvent, setSelectedEvent] = useState<LiveEvent | null>(null);

  // ── Live data ─────────────────────────────────────────────────────────────
  const [events,  setEvents]  = useState<LiveEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchErr, setFetchErr] = useState(false);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      try {
        const token = await user.getIdToken(true);
        const res   = await fetch("/api/events", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error(`${res.status}`);
        const data: LiveEvent[] = await res.json();
        if (!cancelled) setEvents(data);
      } catch {
        if (!cancelled) setFetchErr(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user]);

  // ── Admin check ───────────────────────────────────────────────────────────
  // We don't expose NEXT_PUBLIC_ADMIN_UID. Instead we check creatorUid on the
  // event for the "Edit" button, and derive admin status from the profile API.
  // For the Delete button we let the server decide — a 403 means not allowed.
  const [isAdmin, setIsAdmin] = useState(false);
  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const token = await user.getIdToken(true);
        const res   = await fetch(`/api/users/${user.uid}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const profile = await res.json();
          setIsAdmin(profile.isAdmin === true);
        }
      } catch { /* non-fatal */ }
    })();
  }, [user]);

  // ── Sort + filter ─────────────────────────────────────────────────────────
  const sorted = useMemo(
    () => [...events].sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime()),
    [events],
  );

  const filteredEvents = useMemo(() => {
    if (activeFilters.length === 0) return [];
    const activeSet = new Set(activeFilters);
    return sorted.filter((event) =>
      event.disciplines.some((d) => activeSet.has(d)),
    );
  }, [sorted, activeFilters]);

  function handleToggle(discipline: string) {
    setActiveFilters((prev) => {
      if (prev.length === 1 && prev[0] === discipline) return [...DISCIPLINES];
      return [discipline];
    });
  }
  function handleToggleAll() { setActiveFilters([...DISCIPLINES]); }

  // ── Delete handler ────────────────────────────────────────────────────────
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = useCallback(async (eventId: string) => {
    if (!user) return;
    if (!confirm("Permanently delete this event?")) return;
    setDeletingId(eventId);
    try {
      const token = await user.getIdToken(true);
      const res   = await fetch(`/api/events/${eventId}`, {
        method:  "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Delete failed");
      }
      setEvents((prev) => prev.filter((e) => e.id !== eventId));
      setSelectedEvent(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Could not delete event.");
    } finally {
      setDeletingId(null);
    }
  }, [user]);

  // ── Edit handler (inline in modal) ────────────────────────────────────────
  const [editMode,    setEditMode]    = useState(false);
  const [editFields,  setEditFields]  = useState<Partial<LiveEvent>>({});
  const [editError,   setEditError]   = useState<string | null>(null);
  const [saving,      setSaving]      = useState(false);

  function openEdit(event: LiveEvent) {
    setEditFields({
      title:       event.title,
      description: event.description,
      location:    event.location,
      dateTime:    event.dateTime,
      endDateTime: event.endDateTime,
      disciplines: [...event.disciplines],
      imageUrl:    event.imageUrl,
    });
    setEditError(null);
    setEditMode(true);
  }

  function cancelEdit() { setEditMode(false); setEditError(null); }

  const handleSave = useCallback(async () => {
    if (!user || !selectedEvent) return;
    setEditError(null);
    setSaving(true);
    try {
      const token = await user.getIdToken(true);
      const res   = await fetch(`/api/events/${selectedEvent.id}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body:    JSON.stringify(editFields),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Save failed");
      }
      // Merge edits into local state
      const updated: LiveEvent = { ...selectedEvent, ...editFields } as LiveEvent;
      setEvents((prev) => prev.map((e) => (e.id === selectedEvent.id ? updated : e)));
      setSelectedEvent(updated);
      setEditMode(false);
    } catch (err) {
      setEditError(err instanceof Error ? err.message : "Could not save changes.");
    } finally {
      setSaving(false);
    }
  }, [user, selectedEvent, editFields]);

  // ── Close modal ────────────────────────────────────────────────────────────
  function closeModal() { setSelectedEvent(null); setEditMode(false); setEditError(null); }

  // ── Can this user control the selected event? ─────────────────────────────
  const canControl = !!selectedEvent && (
    isAdmin || selectedEvent.creatorUid === user?.uid
  );
  const canEdit = !!selectedEvent && selectedEvent.creatorUid === user?.uid;

  // ── Input style for modal edit form ───────────────────────────────────────
  const modalInput: React.CSSProperties = {
    width: "100%", padding: "0.4rem 0.6rem",
    background: "rgba(255,255,255,0.85)", border: "1px solid #2a2a2a",
    borderRadius: 4, color: "#1a1a1a", fontSize: "0.82rem",
    fontFamily: "var(--font-special-elite)", boxSizing: "border-box",
  };

  return (
    <AuthGuard>
      <main className="events-bg max-w-5xl mx-auto px-4 py-8 font-[family-name:var(--font-special-elite)]">

        {/* ── Header ── */}
        <div className="flex items-center justify-between mb-6">
          <h1
            className="text-5xl font-extrabold uppercase tracking-tight font-[family-name:var(--font-barlow)]"
            style={{ color: "#f5f5f0" }}
          >
            Events
          </h1>
          <div className="flex items-center gap-2">
            {/* List / Calendar toggle */}
            <div className="flex border border-gray-200 rounded-lg overflow-hidden text-sm">
              <button
                onClick={() => setView("list")}
                className={`flex items-center gap-1.5 px-3 py-1.5 transition-colors ${
                  view === "list" ? "bg-green-700 text-white" : "bg-white text-gray-600 hover:bg-gray-50"
                }`}
              >
                <List className="h-4 w-4" aria-hidden="true" />
                List
              </button>
              <button
                onClick={() => setView("calendar")}
                className={`flex items-center gap-1.5 px-3 py-1.5 transition-colors ${
                  view === "calendar" ? "bg-green-700 text-white" : "bg-white text-gray-600 hover:bg-gray-50"
                }`}
              >
                <CalendarDays className="h-4 w-4" aria-hidden="true" />
                Calendar
              </button>
            </div>

            {/* Post an Event — logged-in users only */}
            {user && (
              <Link
                href="/events/new"
                className="px-4 py-2 text-white rounded-full text-xs font-bold uppercase tracking-widest transition-opacity hover:opacity-90"
                style={{ backgroundColor: "#FF6B35" }}
              >
                Post an Event
              </Link>
            )}
          </div>
        </div>

        {/* ── Discipline filter ── */}
        <div className="mb-6">
          <DisciplineFilterBar
            activeFilters={activeFilters}
            onToggle={handleToggle}
            onToggleAll={handleToggleAll}
          />
        </div>

        {/* ── Loading ── */}
        {loading && (
          <div className="columns-1 sm:columns-2 lg:columns-3 gap-x-5">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="break-inside-avoid mb-5 h-48 rounded animate-pulse"
                style={{ backgroundColor: "rgba(255,255,255,0.07)" }}
              />
            ))}
          </div>
        )}

        {/* ── Fetch error ── */}
        {!loading && fetchErr && (
          <p className="text-gray-400 text-sm text-center py-16">
            Couldn't load events. Please try refreshing.
          </p>
        )}

        {/* ── List view ── */}
        {!loading && !fetchErr && view === "list" && (
          filteredEvents.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-16">
              No upcoming events match your filters.
            </p>
          ) : (
            <div className="columns-1 sm:columns-2 lg:columns-3 gap-x-5">
              {filteredEvents.map((event, i) => (
                <button
                  key={event.id}
                  type="button"
                  onClick={() => { setSelectedEvent(event); setEditMode(false); }}
                  className="block w-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B35]"
                  aria-label={`Open details for ${event.title}`}
                >
                  <EventCard event={event} index={i} />
                </button>
              ))}
            </div>
          )
        )}

        {/* ── Calendar view ── */}
        {!loading && !fetchErr && view === "calendar" && (
          <CalendarView events={filteredEvents as DartworkEvent[]} onEventSelect={(e) => { setSelectedEvent(e as LiveEvent); setEditMode(false); }} />
        )}

        {/* ── Event detail / edit modal ── */}
        {selectedEvent && (
          <div
            className="modal-backdrop fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
            onClick={closeModal}
          >
            <div
              className="max-w-lg w-full max-h-[90vh] overflow-y-auto font-[family-name:var(--font-special-elite)]"
              style={{ transform: "rotate(-0.5deg)" }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="border-2 border-[#2a2a2a] bg-[#f0ead8] text-[#1a1a1a] p-6 flex flex-col gap-4">

                {/* ── Header row ── */}
                <div className="flex items-start justify-between gap-2">
                  {editMode ? (
                    <span className="text-[10px] uppercase tracking-widest opacity-60">Editing event</span>
                  ) : (
                    <span className="text-[10px] uppercase tracking-widest opacity-60">
                      {selectedEvent.disciplines.join(" · ")}
                    </span>
                  )}
                  <button
                    onClick={closeModal}
                    className="text-[#1a1a1a] hover:opacity-60 text-2xl leading-none shrink-0"
                    aria-label="Close"
                  >
                    ×
                  </button>
                </div>

                {/* ── Display mode ── */}
                {!editMode && (
                  <>
                    <h2 className="font-bold uppercase text-xl text-center border-y-2 border-[#2a2a2a] py-2 leading-tight tracking-wide">
                      {selectedEvent.title}
                    </h2>
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
                        {new Date(selectedEvent.dateTime).toLocaleTimeString("en-US",{hour:"numeric",minute:"2-digit"})}
                        {selectedEvent.endDateTime
                          ? ` – ${new Date(selectedEvent.endDateTime).toLocaleTimeString("en-US",{hour:"numeric",minute:"2-digit"})}`
                          : ""}
                      </p>
                      <p>{selectedEvent.location}</p>
                    </div>
                    <p className="text-sm leading-relaxed" style={{ textAlign: "justify" }}>
                      {selectedEvent.description}
                    </p>
                    <div className="flex items-center justify-between pt-3 border-t border-[#2a2a2a]">
                      <p className="text-[10px] uppercase tracking-widest opacity-60 italic normal-case">
                        {selectedEvent.organizer}
                      </p>
                      <div className="flex items-center gap-2">
                        {/* Creator-only Edit */}
                        {canEdit && (
                          <button
                            onClick={() => openEdit(selectedEvent)}
                            className="px-3 py-1.5 text-[11px] uppercase tracking-widest font-bold border border-[#2a2a2a] bg-transparent hover:bg-[#e0d9c6] transition-colors"
                          >
                            Edit
                          </button>
                        )}
                        {/* Creator or admin Delete */}
                        {canControl && (
                          <button
                            onClick={() => handleDelete(selectedEvent.id)}
                            disabled={deletingId === selectedEvent.id}
                            className="px-3 py-1.5 text-[11px] uppercase tracking-widest font-bold border border-red-700 text-red-700 bg-transparent hover:bg-red-50 transition-colors disabled:opacity-50"
                          >
                            {deletingId === selectedEvent.id ? "Deleting…" : "Delete"}
                          </button>
                        )}
                        <button
                          onClick={() => downloadIcs(selectedEvent)}
                          className="px-4 py-1.5 text-[#f0ead8] text-[11px] uppercase tracking-widest font-bold border border-[#2a2a2a] bg-[#2a2a2a] hover:bg-[#1a1a1a] transition-colors"
                        >
                          Add to Calendar
                        </button>
                      </div>
                    </div>
                  </>
                )}

                {/* ── Edit mode ── */}
                {editMode && (
                  <div className="flex flex-col gap-3">
                    <div>
                      <label className="text-[10px] uppercase tracking-widest opacity-60 block mb-1">Title</label>
                      <input
                        style={modalInput}
                        value={(editFields.title as string) ?? ""}
                        onChange={(e) => setEditFields((f) => ({ ...f, title: e.target.value }))}
                        maxLength={150}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase tracking-widest opacity-60 block mb-1">Description</label>
                      <textarea
                        style={{ ...modalInput, resize: "vertical", lineHeight: 1.6 }}
                        rows={4}
                        value={(editFields.description as string) ?? ""}
                        onChange={(e) => setEditFields((f) => ({ ...f, description: e.target.value }))}
                        maxLength={1000}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase tracking-widest opacity-60 block mb-1">Location</label>
                      <input
                        style={modalInput}
                        value={(editFields.location as string) ?? ""}
                        onChange={(e) => setEditFields((f) => ({ ...f, location: e.target.value }))}
                        maxLength={200}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] uppercase tracking-widest opacity-60 block mb-1">Start</label>
                        <input
                          type="datetime-local"
                          style={{ ...modalInput, colorScheme: "light" }}
                          value={((editFields.dateTime as string) ?? "").slice(0,16)}
                          onChange={(e) => setEditFields((f) => ({ ...f, dateTime: e.target.value }))}
                        />
                      </div>
                      <div>
                        <label className="text-[10px] uppercase tracking-widest opacity-60 block mb-1">End (optional)</label>
                        <input
                          type="datetime-local"
                          style={{ ...modalInput, colorScheme: "light" }}
                          value={((editFields.endDateTime as string) ?? "").slice(0,16)}
                          onChange={(e) => setEditFields((f) => ({ ...f, endDateTime: e.target.value || null }))}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] uppercase tracking-widest opacity-60 block mb-1">Image URL (optional)</label>
                      <input
                        style={modalInput}
                        value={(editFields.imageUrl as string) ?? ""}
                        onChange={(e) => setEditFields((f) => ({ ...f, imageUrl: e.target.value || null }))}
                        placeholder="https://…"
                        maxLength={500}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase tracking-widest opacity-60 block mb-1">Disciplines</label>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {DISCIPLINES.map((d) => {
                          const checked = ((editFields.disciplines as string[]) ?? []).includes(d);
                          return (
                            <button
                              key={d}
                              type="button"
                              onClick={() => setEditFields((f) => {
                                const cur = (f.disciplines as string[]) ?? [];
                                return {
                                  ...f,
                                  disciplines: checked ? cur.filter((x) => x !== d) : [...cur, d],
                                };
                              })}
                              className={`px-2 py-0.5 text-[10px] uppercase tracking-widest border transition-colors ${
                                checked
                                  ? "bg-[#2a2a2a] text-[#f0ead8] border-[#2a2a2a]"
                                  : "bg-transparent text-[#2a2a2a] border-[#2a2a2a] hover:bg-[#e0d9c6]"
                              }`}
                            >
                              {d}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {editError && (
                      <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2">
                        {editError}
                      </p>
                    )}

                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#2a2a2a]">
                      <button
                        onClick={cancelEdit}
                        disabled={saving}
                        className="px-3 py-1.5 text-[11px] uppercase tracking-widest font-bold border border-[#2a2a2a] bg-transparent hover:bg-[#e0d9c6] transition-colors disabled:opacity-50"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-4 py-1.5 text-[11px] uppercase tracking-widest font-bold border border-[#2a2a2a] bg-[#2a2a2a] text-[#f0ead8] hover:bg-[#1a1a1a] transition-colors disabled:opacity-50"
                      >
                        {saving ? "Saving…" : "Save Changes"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </AuthGuard>
  );
}
