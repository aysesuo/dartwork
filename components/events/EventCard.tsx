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
    <div className="bg-white rounded-2xl border border-amber-200 p-5 flex flex-col gap-3 hover:shadow-md transition-shadow h-full">
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

      <h3 className="font-semibold text-gray-900 text-lg leading-snug">
        {event.title}
      </h3>

      <p className="text-sm font-medium text-gray-700">
        {dateStr} · {timeStr}
        {endTimeStr ? ` – ${endTimeStr}` : ""}
      </p>

      <p className="text-sm text-gray-500">{event.location}</p>

      <p className="text-sm text-gray-600 leading-relaxed line-clamp-3">
        {event.description}
      </p>

      <p className="mt-auto pt-2 border-t border-gray-100 text-xs text-gray-400">
        by {event.organizer}
      </p>
    </div>
  );
}
