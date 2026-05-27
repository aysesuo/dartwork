import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameDay,
  isSameMonth,
  format,
} from "date-fns";
import { getDisciplineColor } from "@/lib/disciplines";
import type { DartworkEvent } from "@/lib/calendarAdapter";

interface EventDotsMonthProps {
  events: DartworkEvent[];
  monthAnchor?: Date;
}

const WEEKDAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];
const MAX_DOTS = 3;

export default function EventDotsMonth({
  events,
  monthAnchor = new Date(),
}: EventDotsMonthProps) {
  const monthStart = startOfMonth(monthAnchor);
  const monthEnd = endOfMonth(monthAnchor);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

  const eventsByDay = new Map<string, DartworkEvent[]>();
  for (const event of events) {
    const key = format(new Date(event.dateTime), "yyyy-MM-dd");
    const bucket = eventsByDay.get(key);
    if (bucket) bucket.push(event);
    else eventsByDay.set(key, [event]);
  }

  const today = new Date();

  return (
    <div className="rounded-3xl border p-4" style={{ backgroundColor: "#132d1c", borderColor: "#1e4430" }}>
      <h3 className="mb-3 text-sm font-semibold" style={{ color: "#f5f5f0" }}>
        {format(monthAnchor, "MMMM yyyy")}
      </h3>

      <div className="grid grid-cols-7 gap-1 text-center">
        {WEEKDAY_LABELS.map((label, i) => (
          <div
            key={`${label}-${i}`}
            className="pb-1 text-[10px] font-semibold uppercase tracking-wide" style={{ color: "#7fa88a" } as React.CSSProperties}
            aria-hidden="true"
          >
            {label}
          </div>
        ))}

        {days.map((day) => {
          const key = format(day, "yyyy-MM-dd");
          const dayEvents = eventsByDay.get(key) ?? [];
          const inMonth = isSameMonth(day, monthAnchor);
          const isToday = isSameDay(day, today);

          return (
            <div
              key={key}
              aria-label={
                dayEvents.length > 0
                  ? `${format(day, "MMMM d")}: ${dayEvents.length} event${dayEvents.length === 1 ? "" : "s"}`
                  : format(day, "MMMM d")
              }
              className={`flex aspect-square flex-col items-center justify-center rounded-md text-xs ${
                inMonth ? "" : "opacity-30"
              } ${isToday ? "font-semibold" : ""}`}
              style={{ color: inMonth ? "#f5f5f0" : "#7fa88a", backgroundColor: isToday ? "#1e4430" : undefined }}
            >
              <span>{format(day, "d")}</span>
              {dayEvents.length > 0 && (
                <div className="mt-0.5 flex items-center gap-0.5" aria-hidden="true">
                  {dayEvents.slice(0, MAX_DOTS).map((e, i) => {
                    const { hex } = getDisciplineColor(e.disciplines[0] ?? "Other");
                    return (
                      <span
                        key={`${e.id}-${i}`}
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ backgroundColor: hex }}
                      />
                    );
                  })}
                  {dayEvents.length > MAX_DOTS && (
                    <span className="text-[8px] text-gray-400">
                      +{dayEvents.length - MAX_DOTS}
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <p className="mt-3 text-xs text-gray-400">
        Each dot represents an event, colored by discipline.
      </p>
    </div>
  );
}
