"use client";

import { useState, useEffect, useRef } from "react";
import { useDrag } from "@use-gesture/react";

type PinColor = "red" | "blue" | "white";

const PINNED_SRC: Record<PinColor, string> = {
  red:   "/textures/pin-red-pinned.png",
  blue:  "/textures/pin-blue-pinned.png",
  white: "/textures/pin-white-pinned.png",
};
const UNPINNED_SRC: Record<PinColor, string> = {
  red:   "/textures/pin-red-unpinned.png",
  blue:  "/textures/pin-blue-unpinned.png",
  white: "/textures/pin-white-unpinned.png",
};

// Visual (display) sizes — large so the pin looks great
const PINNED_SIZE: Record<PinColor, { w: number; h: number }> = {
  red:   { w: 850, h: 850 },
  blue:  { w: 850, h: 850 },
  white: { w: 850, h: 850 },
};
const UNPINNED_SIZE: Record<PinColor, { w: number; h: number }> = {
  red:   { w: 1250, h: 950 },
  blue:  { w: 1250, h: 950 },
  white: { w: 1250, h: 950 },
};

// Hit zone: small enough that cards underneath are still grabbable
const HIT_W = 40;
const HIT_H = 40;

interface Props {
  id: string;
  color: PinColor;
  /** Absolute position on the canvas (centre of pin head) */
  x: number;
  y: number;
  onDrop: (id: string, x: number, y: number) => void;
}

export default function BoardPin({ id, color, x, y, onDrop }: Props) {
  const [dragging, setDragging] = useState(false);
  const [pos, setPos] = useState({ x, y });

  // Keep local pos in sync with parent when not actively dragging
  useEffect(() => {
    if (!dragging) setPos({ x, y });
  }, [x, y, dragging]);

  // Stable ref so useDrag `from` callback always sees current pos
  const posRef = useRef(pos);
  posRef.current = pos;

  const bind = useDrag(
    ({ offset: [ox, oy], first, last }) => {
      setPos({ x: ox, y: oy });
      if (first) setDragging(true);
      if (last) {
        setDragging(false);
        onDrop(id, ox, oy);
      }
    },
    { from: () => [posRef.current.x, posRef.current.y] },
  );

  const size = dragging ? UNPINNED_SIZE[color] : PINNED_SIZE[color];
  const src  = dragging ? UNPINNED_SRC[color]  : PINNED_SRC[color];

  return (
    // Small wrapper div = drag hit zone only
    <div
      {...bind()}
      style={{
        position:    "absolute",
        left:        pos.x - HIT_W / 2,
        top:         pos.y - HIT_H / 2,
        width:       HIT_W,
        height:      HIT_H,
        cursor:      dragging ? "grabbing" : "grab",
        zIndex:      dragging ? 1000 : 25,
        userSelect:  "none",
        touchAction: "none",
      }}
    >
      {/* Large visual image — pointer-events: none so it never blocks the card beneath */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=""
        aria-hidden="true"
        draggable={false}
        style={{
          position:       "absolute",
          width:          size.w,
          height:         size.h,
          // Centre the image on the hit zone's centre point
          left:           HIT_W / 2 - size.w / 2,
          top:            HIT_H / 2 - size.h / 2,
          objectFit:      "contain",
          objectPosition: "center",
          pointerEvents:  "none",
          userSelect:     "none",
          filter:         dragging
            ? "drop-shadow(0 6px 12px rgba(0,0,0,0.6))"
            : "drop-shadow(0 2px 5px rgba(0,0,0,0.45))",
          transition:     dragging ? "none" : "filter 0.2s ease",
        }}
      />
    </div>
  );
}
