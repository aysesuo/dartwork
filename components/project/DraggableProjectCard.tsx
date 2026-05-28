"use client";

import { useState, useCallback, useEffect } from "react";
import { useDrag } from "@use-gesture/react";
import ProjectCard from "./ProjectCard";
import { cardPositions } from "@/lib/cardRegistry";

// ─── Seeded layout ────────────────────────────────────────────────────────────
function lcg(seed: number) {
  let s = (seed * 1664525 + 1013904223) & 0x7fffffff;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

export function seededInitialPos(index: number): { left: number; top: number } {
  const rng     = lcg(index * 31337 + 7);
  const col     = index % 3;
  const row     = Math.floor(index / 3);
  const COL_W   = 275;
  const ROW_H   = 380;
  // X_START keeps col-0 cards clear of the filter card (right edge ≈ 122px)
  const X_START = 150;
  const baseLeft = X_START + col * COL_W;
  const baseTop  = row * ROW_H + 30;
  return {
    left: baseLeft + (rng() - 0.5) * 40,           // ±20 px scatter
    top:  Math.max(20, baseTop + (rng() - 0.5) * 50), // ±25 px, never above 20
  };
}

// ─── Rotation / seed tables ───────────────────────────────────────────────────
const BASE_ROTATIONS = [-2.5, 1.4, -1.8, 2.9, -0.8, 1.7, -3.0, 0.6, 2.3, -1.2];
const SEEDS          = [2, 7, 11, 5, 14];

function restRotation(index: number, x: number, y: number): number {
  const base  = BASE_ROTATIONS[index % BASE_ROTATIONS.length];
  const nudge = Math.sin(x * 0.007 + y * 0.011) * 1.8;
  return base + nudge;
}

// ─── Shadows ──────────────────────────────────────────────────────────────────
const SHADOW_RESTING = "3px 6px 12px rgba(0,0,0,0.35), 1px 2px 4px rgba(0,0,0,0.2)";
const SHADOW_LOOSE   = "5px 12px 22px rgba(0,0,0,0.48), 2px 4px 8px rgba(0,0,0,0.3)";
const SHADOW_LIFTED  = "10px 20px 40px rgba(0,0,0,0.55), 4px 8px 16px rgba(0,0,0,0.35), 0 0 0 1px rgba(0,0,0,0.08)";

// ─── Types ────────────────────────────────────────────────────────────────────
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

interface Props {
  project:     Project;
  index:       number;
  dimmed?:     boolean;
  /** Number of pins currently holding this card */
  pinCount?:   number;
  /** Called on every drag tick so pins can follow */
  onDragMove?: (cardId: string, x: number, y: number) => void;
  /** Admin controls */
  isAdmin?:    boolean;
  onDelete?:   (id: string) => void;
  deleting?:   boolean;
  /** Creator / owner controls */
  isOwner?:    boolean;
  onTakeDown?: (id: string) => void;
  takingDown?: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function DraggableProjectCard({
  project,
  index,
  dimmed     = false,
  pinCount   = 0,
  onDragMove,
  isAdmin    = false,
  onDelete,
  deleting   = false,
  isOwner    = false,
  onTakeDown,
  takingDown = false,
}: Props) {
  const init    = seededInitialPos(index);
  const initRot = BASE_ROTATIONS[index % BASE_ROTATIONS.length];
  const seed    = SEEDS[index % SEEDS.length];

  // "Loose" extras: more tilt + slight drop when unpinned
  const looseTilt = (Math.sign(initRot) || 1) * (6 + seed % 8); // 6–13 deg
  const looseDropY = 8 + (seed % 7);                             // 8–14 px

  // "Dimmed" extras: even more tilt, large drop
  const dimTilt = (Math.sign(initRot) || 1) * (5 + seed % 4);

  const [pos,      setPos]      = useState({ x: init.left, y: init.top });
  const [rotation, setRotation] = useState(initRot);
  const [lifted,   setLifted]   = useState(false);
  const [zIndex,   setZIndex]   = useState(index + 1);

  const isPinned = pinCount > 0;
  const isLoose  = !isPinned && !lifted;

  // Register in the shared registry on mount and cleanup on unmount
  useEffect(() => {
    cardPositions.set(project.id, { x: init.left, y: init.top });
    return () => { cardPositions.delete(project.id); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project.id]);

  const handleDragEnd = useCallback(
    (x: number, y: number) => {
      setRotation(restRotation(index, x, y));
      setLifted(false);
      setZIndex(index + 1);
    },
    [index],
  );

  const bind = useDrag(
    ({ offset: [ox, oy], first, last }) => {
      setPos({ x: ox, y: oy });
      // Keep registry current so pin snap detection reads fresh positions
      cardPositions.set(project.id, { x: ox, y: oy });
      // Notify page so pinned pins can follow
      onDragMove?.(project.id, ox, oy);
      if (first) { setLifted(true);  setZIndex(999); }
      if (last)  { handleDragEnd(ox, oy); }
    },
    { from: () => [pos.x, pos.y] },
  );

  // ── Computed visual values ────────────────────────────────────────────────
  const activeRot = rotation
    + (dimmed && !lifted  ? dimTilt   : 0)
    + (isLoose            ? looseTilt : 0);

  const activeY = pos.y
    + (dimmed && !lifted ? 60       : 0)
    + (isLoose           ? looseDropY : 0);

  const activeScale = lifted ? 1.04 : 1;
  const activeZ     = dimmed && !lifted ? Math.max(1, zIndex - 5) : zIndex;

  const activeShadow = lifted
    ? SHADOW_LIFTED
    : isLoose
    ? SHADOW_LOOSE
    : SHADOW_RESTING;

  return (
    <div
      {...bind()}
      style={{
        position:      "absolute",
        left:          0,
        top:           0,
        transform:     `translate(${pos.x}px, ${activeY}px) rotate(${activeRot}deg) scale(${activeScale})`,
        zIndex:        activeZ,
        opacity:       dimmed && !lifted ? 0.3 : 1,
        boxShadow:     activeShadow,
        cursor:        dimmed ? "default" : lifted ? "grabbing" : "grab",
        pointerEvents: dimmed && !lifted ? "none" : "auto",
        userSelect:    "none",
        touchAction:   "none",
        transition:    lifted
          ? "box-shadow 0.12s ease, transform 0.05s ease"
          : "transform 0.5s cubic-bezier(0.45,0,0.55,1), opacity 0.4s ease, box-shadow 0.35s ease",
        width:      270,
        willChange: "transform, opacity",
      }}
    >
      <ProjectCard project={project} index={index} decorated={false} />

      {/* Admin delete button — only rendered for admin, only on Firestore projects */}
      {isAdmin && onDelete && (
        <button
          onPointerDown={(e) => e.stopPropagation()} // prevent drag starting
          onClick={(e) => { e.stopPropagation(); onDelete(project.id); }}
          disabled={deleting}
          title="Delete project"
          style={{
            position:        "absolute",
            top:             6,
            right:           6,
            width:           22,
            height:          22,
            borderRadius:    "50%",
            backgroundColor: deleting ? "rgba(180,0,0,0.5)" : "rgba(180,0,0,0.85)",
            border:          "none",
            color:           "#fff",
            fontSize:        13,
            lineHeight:      1,
            cursor:          deleting ? "not-allowed" : "pointer",
            display:         "flex",
            alignItems:      "center",
            justifyContent:  "center",
            zIndex:          10,
            boxShadow:       "0 1px 4px rgba(0,0,0,0.4)",
            transition:      "background 0.15s",
          }}
        >
          {deleting ? "…" : "✕"}
        </button>
      )}

      {/* Owner take-down button — shown to project creator (not admin-only) */}
      {isOwner && !isAdmin && onTakeDown && (
        <button
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => { e.stopPropagation(); onTakeDown(project.id); }}
          disabled={takingDown}
          title="Take down project"
          style={{
            position:        "absolute",
            top:             6,
            left:            6,
            padding:         "0.15rem 0.55rem",
            borderRadius:    "999px",
            backgroundColor: takingDown ? "rgba(120,60,0,0.5)" : "rgba(255,107,53,0.85)",
            border:          "none",
            color:           "#fff",
            fontSize:        "0.58rem",
            fontWeight:      700,
            textTransform:   "uppercase" as const,
            letterSpacing:   "0.08em",
            cursor:          takingDown ? "not-allowed" : "pointer",
            zIndex:          10,
            boxShadow:       "0 1px 4px rgba(0,0,0,0.4)",
            transition:      "background 0.15s",
          }}
        >
          {takingDown ? "…" : "Take Down"}
        </button>
      )}
    </div>
  );
}
