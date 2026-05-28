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

// Visual sizes + offsetX corrects for pin head not being at image centre.
// Blue pinned head sits at ~35 % from left  → shift image right +65 px
// Blue unpinned head sits at ~23 % from left → shift image right +160 px
// Red/white heads are well-centred in their images → offsetX: 0
const PINNED_SIZE: Record<PinColor, { w: number; h: number; offsetX: number }> = {
  red:   { w: 260, h: 260, offsetX:   0 },
  blue:  { w: 425, h: 425, offsetX:  65 },
  white: { w: 260, h: 260, offsetX:   0 },
};
const UNPINNED_SIZE: Record<PinColor, { w: number; h: number; offsetX: number }> = {
  red:   { w: 390, h: 295, offsetX:   0 },
  blue:  { w: 625, h: 475, offsetX: 160 },
  white: { w: 390, h: 295, offsetX:   0 },
};

// Hit zone: small enough that cards underneath remain grabbable
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

  useEffect(() => {
    if (!dragging) setPos({ x, y });
  }, [x, y, dragging]);

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

  // The image and the hit zone are SIBLINGS in the canvas container — both
  // positioned relative to the same parent (the card canvas div).
  // Keeping them separate means the large image never overflows its wrapper
  // and gets clipped by the board's overflow:hidden.
  return (
    <>
      {/* Large decorative image — centred on the pin head position, no events */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=""
        aria-hidden="true"
        draggable={false}
        style={{
          position:       "absolute",
          left:           pos.x - size.w / 2 + size.offsetX,
          top:            pos.y - size.h / 2,
          width:          size.w,
          height:         size.h,
          objectFit:      "contain",
          objectPosition: "center",
          pointerEvents:  "none",
          userSelect:     "none",
          zIndex:         dragging ? 999 : 24,
          filter:         dragging
            ? "drop-shadow(0 6px 12px rgba(0,0,0,0.6))"
            : "drop-shadow(0 2px 5px rgba(0,0,0,0.45))",
          transition:     dragging ? "none" : "filter 0.2s ease",
        }}
      />

      {/* Small invisible hit zone — the only element that captures drag events */}
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
      />
    </>
  );
}
