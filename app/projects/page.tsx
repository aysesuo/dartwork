"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import Link from "next/link";
import seedData from "@/data/projects.json";
import DraggableProjectCard, { seededInitialPos } from "@/components/project/DraggableProjectCard";
import IndexCardFilter from "@/components/project/IndexCardFilter";
import BoardPin from "@/components/project/BoardPin";
import AuthGuard from "@/components/auth/AuthGuard";
import { useAuth } from "@/lib/auth";
import { auth } from "@/lib/firebase";
import { cardPositions, CARD_WIDTH } from "@/lib/cardRegistry";

// ── Project type ──────────────────────────────────────────────────────────────
interface Project {
  id: string;
  title: string;
  creatorName: string;
  discipline: string;
  tags: string[];
  positionsNeeded: string[];
  description: string;
  mediaUrl?: string | null;
  datePosted: string;
}

// ── Pin system types ──────────────────────────────────────────────────────────
type PinColor = "red" | "blue" | "white";

interface PinState {
  id: string;
  color: PinColor;
  /** Current absolute canvas position (centre of pin head) */
  x: number;
  y: number;
  /** Card this pin is currently holding, or null if loose on the board */
  cardId: string | null;
  /** Offset from card origin when pinned (so pin follows card drags) */
  offsetX: number;
  offsetY: number;
}

interface Hole {
  id: string;
  x: number;
  y: number;
}

// Snap radius: how close to a card's top area the pin must land
const SNAP_RADIUS = 80;

// Pin colours cycling per card
const PIN_COLORS: PinColor[] = ["red", "blue", "white", "red", "blue"];

/** Build pin positions for a list of projects, skipping ids already pinned */
function buildPinsForProjects(projects: Project[], existingPinIds: Set<string>): PinState[] {
  const pins: PinState[] = [];
  projects.forEach((project, i) => {
    if (existingPinIds.has(`${project.id}-pin-0`)) return; // already pinned
    const { left, top } = seededInitialPos(i);
    const seed = i * 3 + 1;
    const count = (seed % 3 === 0) ? 2 : 1;

    const ox1 = 18 + (seed % 20);
    const oy1 = 14 + (seed % 14);
    pins.push({
      id: `${project.id}-pin-0`,
      color: PIN_COLORS[i % PIN_COLORS.length],
      x: left + ox1,
      y: top  + oy1,
      cardId:  project.id,
      offsetX: ox1,
      offsetY: oy1,
    });

    if (count === 2) {
      const ox2 = CARD_WIDTH - 30 - (seed % 16);
      const oy2 = 14 + ((seed + 5) % 14);
      pins.push({
        id: `${project.id}-pin-1`,
        color: PIN_COLORS[(i + 2) % PIN_COLORS.length],
        x: left + ox2,
        y: top  + oy2,
        cardId:  project.id,
        offsetX: ox2,
        offsetY: oy2,
      });
    }
  });
  return pins;
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function ProjectsPage() {
  const { user } = useAuth();

  // Live projects from Firestore merged with seed data
  const [liveProjects, setLiveProjects] = useState<Project[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      try {
        const token = await auth.currentUser!.getIdToken();
        const res = await fetch("/api/projects", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to fetch");
        const data: Project[] = await res.json();
        if (!cancelled) setLiveProjects(data);
      } catch {
        // Fall back to seed data silently
      } finally {
        if (!cancelled) setLoadingProjects(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user]);

  // Merge: seed data first (stable indices for layout), then live projects
  // de-duplicated by id (live wins if same id exists in seed)
  const allProjects = useMemo<Project[]>(() => {
    const seedIds = new Set(seedData.map((p) => p.id));
    const newProjects = liveProjects.filter((p) => !seedIds.has(p.id));
    return [...(seedData as Project[]), ...newProjects];
  }, [liveProjects]);

  const [selDisciplines, setSelDisciplines] = useState<Set<string>>(new Set());
  const [selTags,        setSelTags]        = useState<Set<string>>(new Set());
  const [selRoles,       setSelRoles]       = useState<Set<string>>(new Set());

  const [pins,  setPins]  = useState<PinState[]>(() => buildPinsForProjects(seedData as Project[], new Set()));
  const [holes, setHoles] = useState<Hole[]>([]);

  // Add pins for newly fetched projects that don't have pins yet
  useEffect(() => {
    if (liveProjects.length === 0) return;
    setPins((prev) => {
      const existingIds = new Set(prev.map((p) => p.id));
      const newPins = buildPinsForProjects(allProjects, existingIds);
      return newPins.length ? [...prev, ...newPins] : prev;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allProjects]);

  function toggle<T>(set: Set<T>, val: T, setter: (s: Set<T>) => void) {
    const next = new Set(set);
    next.has(val) ? next.delete(val) : next.add(val);
    setter(next);
  }

  function clearAll() {
    setSelDisciplines(new Set());
    setSelTags(new Set());
    setSelRoles(new Set());
  }

  // ── Filter option lists derived from live data ────────────────────────────
  const ALL_DISCIPLINES = useMemo(() => [...new Set(allProjects.map((p) => p.discipline))].sort(), [allProjects]);
  const ALL_TAGS        = useMemo(() => [...new Set(allProjects.flatMap((p) => p.tags))].sort(), [allProjects]);
  const ALL_ROLES       = useMemo(() => [...new Set(allProjects.flatMap((p) => p.positionsNeeded))].sort(), [allProjects]);

  // ── Filtering ──────────────────────────────────────────────────────────────
  const matchSet = useMemo(() => {
    const hasFilters =
      selDisciplines.size > 0 || selTags.size > 0 || selRoles.size > 0;
    if (!hasFilters) return null;

    return new Set(
      allProjects
        .filter((p) => {
          if (selDisciplines.size > 0 && !selDisciplines.has(p.discipline))
            return false;
          if (selTags.size > 0 && !p.tags.some((t) => selTags.has(t)))
            return false;
          if (selRoles.size > 0 && !p.positionsNeeded.some((r) => selRoles.has(r)))
            return false;
          return true;
        })
        .map((p) => p.id),
    );
  }, [allProjects, selDisciplines, selTags, selRoles]);

  // ── Pin counts per card ────────────────────────────────────────────────────
  const pinCounts = useMemo(() => {
    const counts = new Map<string, number>();
    pins.forEach((pin) => {
      if (pin.cardId !== null) {
        counts.set(pin.cardId, (counts.get(pin.cardId) ?? 0) + 1);
      }
    });
    return counts;
  }, [pins]);

  // ── Pin drop handler ───────────────────────────────────────────────────────
  const handlePinDrop = useCallback((pinId: string, dropX: number, dropY: number) => {
    setPins((prev) => {
      const pin = prev.find((p) => p.id === pinId);
      if (!pin) return prev;

      // Try to snap to a card
      let snappedCardId: string | null = null;
      let snappedOffsetX = 0;
      let snappedOffsetY = 0;

      for (const [cardId, cardPos] of cardPositions) {
        const cx = cardPos.x + CARD_WIDTH / 2;
        // Top quarter of card = y range [cardPos.y, cardPos.y + 80]
        const cardTopCentreY = cardPos.y + 40;
        const dx = dropX - cx;
        const dy = dropY - cardTopCentreY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < SNAP_RADIUS) {
          // Clamp snap position to card top area
          const ox = Math.max(10, Math.min(CARD_WIDTH - 10, dropX - cardPos.x));
          const oy = Math.max(8,  Math.min(70, dropY - cardPos.y));
          snappedCardId  = cardId;
          snappedOffsetX = ox;
          snappedOffsetY = oy;
          break;
        }
      }

      // If pin was on the board before (not on a card), record a hole at old position
      const wasOnBoard = pin.cardId === null;

      const updated = prev.map((p) => {
        if (p.id !== pinId) return p;
        if (snappedCardId !== null) {
          // Snap to card
          const cardPos = cardPositions.get(snappedCardId);
          return {
            ...p,
            cardId:  snappedCardId,
            offsetX: snappedOffsetX,
            offsetY: snappedOffsetY,
            x: (cardPos?.x ?? dropX) + snappedOffsetX,
            y: (cardPos?.y ?? dropY) + snappedOffsetY,
          };
        }
        // Loose on board
        return { ...p, cardId: null, offsetX: 0, offsetY: 0, x: dropX, y: dropY };
      });

      // Leave a hole where the pin just was (if it was on the board, not transitioning from a card)
      if (wasOnBoard && snappedCardId === null) {
        // Pin moved from one board spot to another — hole at old position
        setHoles((h) => [
          ...h,
          { id: `hole-${Date.now()}-${Math.random()}`, x: pin.x, y: pin.y },
        ]);
      } else if (pin.cardId !== null && snappedCardId === null) {
        // Pin released from card onto board — hole appears where pin landed
        // (no prior board position to leave a hole at; the hole is where it lands)
        // We do nothing here — holes only come from pins that leave the board
      }

      return updated;
    });
  }, []);

  // ── Card drag move handler — pinned pins follow their card ─────────────────
  const handleCardDragMove = useCallback((cardId: string, cardX: number, cardY: number) => {
    setPins((prev) =>
      prev.map((pin) => {
        if (pin.cardId !== cardId) return pin;
        return {
          ...pin,
          x: cardX + pin.offsetX,
          y: cardY + pin.offsetY,
        };
      }),
    );
  }, []);

  // ── Canvas height ──────────────────────────────────────────────────────────
  const indexed = allProjects.map((project, originalIndex) => ({
    project,
    originalIndex,
  }));
  const maxTop = indexed.length
    ? Math.max(...indexed.map(({ originalIndex }) => seededInitialPos(originalIndex).top))
    : 0;
  const canvasHeight = maxTop + 460;

  return (
    <AuthGuard>
      {/* ── Bulletin board wrapper ── */}
      <div
        style={{
          position:            "relative",
          border:              "16px solid #c8b89a",
          boxShadow:           "inset 0 0 80px rgba(0,0,0,0.45), inset 0 0 24px rgba(0,0,0,0.3), 0 0 0 3px #a8956a",
          minHeight:           "100vh",
          overflow:            "hidden",
          backgroundImage:     "url(/textures/cork_board.jpg)",
          backgroundSize:      "cover",
          backgroundPosition:  "center",
        }}
      >

        {/* ── Content layer ── */}
        <main
          className="relative max-w-5xl mx-auto px-4 py-8"
          style={{ zIndex: 10 }}
        >
          {/* Header */}
          <div className="flex items-center justify-end mb-6">
            {user && (
              <Link
                href="/projects/new"
                className="px-4 py-2 text-white rounded-full text-xs font-bold uppercase tracking-widest transition-opacity hover:opacity-90"
                style={{ backgroundColor: "#FF6B35" }}
              >
                Post a Project
              </Link>
            )}
          </div>

          {/* Card canvas */}
          <div style={{ position: "relative", height: canvasHeight }}>
            {/* Index card filter */}
            <IndexCardFilter
              disciplines={ALL_DISCIPLINES}
              tags={ALL_TAGS}
              roles={ALL_ROLES}
              selectedDisciplines={selDisciplines}
              selectedTags={selTags}
              selectedRoles={selRoles}
              onToggleDiscipline={(v) => toggle(selDisciplines, v, setSelDisciplines)}
              onToggleTag={(v) => toggle(selTags, v, setSelTags)}
              onToggleRole={(v) => toggle(selRoles, v, setSelRoles)}
              onClearAll={clearAll}
            />

            {/* Permanent board holes */}
            {holes.map((hole) => (
              <span
                key={hole.id}
                aria-hidden="true"
                style={{
                  position:     "absolute",
                  left:         hole.x - 2,
                  top:          hole.y - 2,
                  width:        4,
                  height:       4,
                  borderRadius: "50%",
                  backgroundColor: "rgba(0,0,0,0.5)",
                  boxShadow:    "inset 0 1px 2px rgba(0,0,0,0.6), 0 0 3px rgba(0,0,0,0.3)",
                  pointerEvents: "none",
                  zIndex:       5,
                }}
              />
            ))}

            {/* Draggable project cards */}
            {indexed.map(({ project, originalIndex }) => (
              <DraggableProjectCard
                key={project.id}
                project={project}
                index={originalIndex}
                dimmed={matchSet !== null && !matchSet.has(project.id)}
                pinCount={pinCounts.get(project.id) ?? 0}
                onDragMove={handleCardDragMove}
              />
            ))}

            {/* Board pins (rendered above cards) */}
            {pins.map((pin) => (
              <BoardPin
                key={pin.id}
                id={pin.id}
                color={pin.color}
                x={pin.x}
                y={pin.y}
                onDrop={handlePinDrop}
              />
            ))}
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}
