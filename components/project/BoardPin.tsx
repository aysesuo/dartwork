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

// Pinned = top-down view (square crop). Unpinned = side view (wider).
const PINNED_SIZE: Record<PinColor, { w: number; h: number }> = {
  red:   { w: 170, h: 170 },
  blue:  { w: 340, h: 340 },
  white: { w: 170, h: 170 },
};
const UNPINNED_SIZE: Record<PinColor, { w: number; h: number }> = {
  red:   { w: 250, h: 190 },
  blue:  { w: 250, h: 190 },
  white: { w: 250, h: 190 },
};

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
  // (parent updates x/y when the pinned card moves)
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
  const src  = dragging ? UNPINNED_SRC[color] : PINNED_SRC[color];

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      {...bind()}
      src={src}
      alt=""
      aria-hidden="true"
      draggable={false}
      style={{
        position:    "absolute",
        left:        pos.x - size.w / 2,
        top:         pos.y - size.h / 2,
        width:       size.w,
        height:      size.h,
        objectFit:   "contain",
        cursor:      dragging ? "grabbing" : "grab",
        zIndex:      dragging ? 1000 : 25,
        userSelect:  "none",
        touchAction: "none",
        filter:      dragging
          ? "drop-shadow(0 6px 12px rgba(0,0,0,0.6))"
          : "drop-shadow(0 2px 5px rgba(0,0,0,0.45))",
        transition:  dragging ? "none" : "filter 0.2s ease",
      }}
    />
  );
}
