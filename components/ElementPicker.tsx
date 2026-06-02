"use client";

import { ELEMENTS, elementBackground } from "@/lib/elements";

export default function ElementPicker({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (element: string) => void;
}) {
  return (
    <div className="grid grid-cols-4 gap-2 mt-1">
      {ELEMENTS.map((el) => {
        const active = value === el;
        return (
          <button
            key={el}
            type="button"
            onClick={() => onChange(el)}
            aria-pressed={active}
            className="relative flex items-center justify-center overflow-hidden rounded-xl transition-transform hover:-translate-y-0.5"
            style={{
              aspectRatio:        "1 / 1",
              border:             `2px solid ${active ? "#FF6B35" : "#1e4430"}`,
              backgroundImage:    `url(${elementBackground(el)})`,
              backgroundSize:     "cover",
              backgroundPosition: "center",
              boxShadow:          active ? "0 0 0 2px rgba(255,107,53,0.45)" : "none",
            }}
          >
            <span
              aria-hidden="true"
              style={{
                position:        "absolute",
                inset:           0,
                backgroundColor: active ? "rgba(0,0,0,0.15)" : "rgba(0,0,0,0.45)",
              }}
            />
            <span
              style={{
                position:      "relative",
                color:         "#fff",
                fontWeight:    700,
                fontSize:      "0.7rem",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                textShadow:    "0 1px 3px rgba(0,0,0,0.85)",
              }}
            >
              {el}
            </span>
          </button>
        );
      })}
    </div>
  );
}
