import type { DartworkEvent } from "./calendarAdapter";

function formatUtc(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

export function googleCalendarUrl(event: DartworkEvent): string {
  const start = new Date(event.dateTime);
  const end = event.endDateTime
    ? new Date(event.endDateTime)
    : new Date(start.getTime() + 2 * 60 * 60 * 1000);

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title,
    dates: `${formatUtc(start)}/${formatUtc(end)}`,
    details: event.description,
    location: event.location,
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
