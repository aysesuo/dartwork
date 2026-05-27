import Image from "next/image";
import { DartworkEvent } from "@/lib/calendarAdapter";

interface EventCardProps {
  event: DartworkEvent;
  index?: number;
}

const ROTATIONS = [-1.5, 0.8, -0.3, 1.2, -1.0, 0.5, -1.8, 0.7, -0.6, 1.4];

const TEXTURES = [
  "/textures/aiham-othman-TWRHgZ3mZEw-unsplash.jpg",
  "/textures/heather-green-3ch06Zm4bV0-unsplash.jpg",
  "/textures/pixelbuddha-studio-Ng5onpi5iRQ-unsplash.jpg",
];

const TINTS = ["#e8d5a3", "#d4c48a", "#c9b87a", "#dfd0a0", "#e2c87e"];

function isWide(index: number) {
  return index % 5 === 3;
}

function ordinal(n: number) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] ?? s[v] ?? s[0]);
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  const weekday = d.toLocaleDateString("en-US", { weekday: "long" });
  const month = d.toLocaleDateString("en-US", { month: "long" });
  const day = ordinal(d.getDate());
  return `${weekday}, ${month} ${day}`;
}

function adNumber(id: string) {
  const n = id.replace(/\D/g, "").padStart(4, "0");
  return `No. ${n}`;
}

export default function EventCard({ event, index = 0 }: EventCardProps) {
  const rotation = ROTATIONS[index % ROTATIONS.length];
  const texture = TEXTURES[index % TEXTURES.length];
  const tint = TINTS[index % TINTS.length];
  const wide = isWide(index);

  const start = new Date(event.dateTime);
  const dateStr = formatDate(event.dateTime);
  const timeStr = start.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  const end = event.endDateTime ? new Date(event.endDateTime) : null;
  const endTimeStr = end
    ? end.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
    : null;

  return (
    <div
      className="break-inside-avoid mb-5 font-[family-name:var(--font-special-elite)] cursor-pointer"
      style={{ columnSpan: wide ? "all" : undefined }}
    >
      <div
        className="relative border border-[#2a2a2a] text-[#1a1a1a] overflow-hidden hover:shadow-[4px_4px_0_rgba(0,0,0,0.25)] transition-shadow"
        style={{ transform: `rotate(${rotation}deg)` }}
      >
        {/* Layer 0 — real paper texture */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={texture}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover"
          style={{ zIndex: 0 }}
        />

        {/* Layer 1 — warm tint overlay */}
        <div
          className="absolute inset-0"
          style={{ backgroundColor: tint, mixBlendMode: "multiply", zIndex: 1 }}
        />

        {/* Layer 10 — all card content */}
        <div className="relative p-4" style={{ zIndex: 10 }}>
          {/* Ad reference number */}
          <div className="text-[10px] font-bold tracking-widest mb-1 opacity-60">
            {adNumber(event.id)}
            {event.disciplines.length > 0 && (
              <span className="ml-2 uppercase">{event.disciplines.join(" · ")}</span>
            )}
          </div>

          {/* Event image */}
          {event.imageUrl && (
            <div className="newsprint-img w-full mb-3" style={{ height: wide ? "220px" : "160px" }}>
              <Image
                src={event.imageUrl}
                alt={event.title}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
          )}

          {/* Headline */}
          <h3
            className="font-bold uppercase leading-tight mb-2 border-b border-[#2a2a2a] pb-1"
            style={{
              fontSize: wide ? "1.1rem" : "0.85rem",
              textAlign: wide ? "center" : "left",
              letterSpacing: "0.04em",
            }}
          >
            {event.title}
          </h3>

          {/* Body */}
          <p className="text-[12px] leading-relaxed" style={{ textAlign: "justify" }}>
            {event.description}
          </p>

          {/* Footer */}
          <div className="mt-3 pt-2 border-t border-[#2a2a2a] text-[10px] uppercase tracking-wide opacity-70 flex flex-wrap gap-x-3 gap-y-0.5">
            <span>{dateStr}</span>
            <span>{timeStr}{endTimeStr ? ` – ${endTimeStr}` : ""}</span>
            <span>{event.location}</span>
            <span className="ml-auto italic normal-case">{event.organizer}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
