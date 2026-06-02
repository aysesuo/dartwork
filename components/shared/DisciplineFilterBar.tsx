"use client";

import { useState, useRef, useEffect } from "react";
import { DISCIPLINES } from "@/lib/disciplines";

interface DisciplineFilterBarProps {
  disciplines?: string[];
  activeFilters: string[];
  onToggle: (discipline: string) => void;
  onToggleAll: () => void;
}

const CAVEAT: React.CSSProperties = { fontFamily: "var(--font-caveat), cursive" };

export default function DisciplineFilterBar({
  disciplines = DISCIPLINES,
  activeFilters,
  onToggle,
  onToggleAll,
}: DisciplineFilterBarProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const allActive = activeFilters.length === disciplines.length;
  const current = allActive ? "All disciplines" : activeFilters[0] ?? "All disciplines";

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  return (
    <div ref={ref} className="relative inline-block">
      {/* Trigger — handwriting, no box */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="inline-flex items-baseline gap-2 hover:opacity-80 transition-opacity"
        style={{ ...CAVEAT, fontSize: "1.7rem", lineHeight: 1, color: "#fff" }}
      >
        <span style={{ opacity: 0.7 }}>Showing:</span>
        <span style={{ textDecoration: "underline" }}>{current}</span>
        <span style={{ fontSize: "1.1rem", transform: open ? "rotate(180deg)" : "none" }}>▾</span>
      </button>

      {/* Vertical drop-down — light text, no box */}
      {open && (
        <div
          role="listbox"
          className="absolute left-0 top-full mt-2 z-30 flex flex-col items-start gap-1"
        >
          <button
            type="button"
            role="option"
            aria-selected={allActive}
            onClick={() => { onToggleAll(); setOpen(false); }}
            className="hover:opacity-80 transition-opacity text-left"
            style={{ ...CAVEAT, fontSize: "1.45rem", lineHeight: 1.1, color: "#f5f0e6", textShadow: "0 1px 3px rgba(0,0,0,0.6)", textDecoration: allActive ? "underline" : "none" }}
          >
            All
          </button>
          {disciplines.map((discipline) => {
            const isActive = !allActive && activeFilters.includes(discipline);
            return (
              <button
                key={discipline}
                type="button"
                role="option"
                aria-selected={isActive}
                onClick={() => { onToggle(discipline); setOpen(false); }}
                className="hover:opacity-80 transition-opacity text-left"
                style={{ ...CAVEAT, fontSize: "1.45rem", lineHeight: 1.1, color: "#f5f0e6", textShadow: "0 1px 3px rgba(0,0,0,0.6)", textDecoration: isActive ? "underline" : "none" }}
              >
                {discipline}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
