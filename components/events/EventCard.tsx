import { DartworkEvent } from "@/lib/calendarAdapter";
import { getDisciplineColor } from "@/lib/disciplines";

interface EventCardProps {
  event: DartworkEvent;
}

export default function EventCard({ event }: EventCardProps) {
  const start = new Date(event.dateTime);
  const end = event.endDateTime ? new Date(event.endDateTime) : null;

  const dateStr = start.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  const timeStr = start.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
  const endTimeStr = end
    ? end.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
    : null;

  return (
    <div className="rounded-3xl border p-6 flex flex-col gap-3 hover:shadow-lg transition-shadow h-full" style={{ backgroundColor: "#132d1c", borderColor: "#1e4430" }}>
      <div className="flex flex-wrap gap-1">
        {event.disciplines.map((d) => {
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

      <h3 className="font-bold text-xl leading-snug uppercase tracking-tight font-[family-name:var(--font-barlow)]" style={{ color: "#f5f5f0" }}>
        {event.title}
      </h3>

      <p className="text-[11px] uppercase tracking-widest font-semibold" style={{ color: "#9db5a5" }}>
        {dateStr} · {timeStr}
        {endTimeStr ? ` – ${endTimeStr}` : ""}
      </p>

      <p className="text-sm" style={{ color: "#7fa88a" }}>{event.location}</p>

      <p className="text-sm leading-relaxed line-clamp-3" style={{ color: "#9db5a5" }}>
        {event.description}
      </p>

      <p className="mt-auto pt-2 border-t text-[10px] uppercase tracking-widest font-semibold" style={{ borderColor: "#1e4430", color: "#7fa88a" }}>
        by {event.organizer}
      </p>
    </div>
  );
}
