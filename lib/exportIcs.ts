import { createEvent } from "ics";
import type { DartworkEvent } from "./calendarAdapter";

export function downloadIcs(event: DartworkEvent): void {
  const start = new Date(event.dateTime);

  // Sanitize strings — strip semicolons, backslashes, and newlines
  const sanitize = (str: string) =>
    str.replace(/[;\\]/g, " ").replace(/\n/g, " ");

  createEvent(
    {
      title: sanitize(event.title),
      description: sanitize(event.description),
      location: sanitize(event.location),
      start: [
        start.getFullYear(),
        start.getMonth() + 1,
        start.getDate(),
        start.getHours(),
        start.getMinutes(),
      ],
      duration: { hours: 2 },
    },
    (error, value) => {
      if (error) {
        console.error("Failed to generate .ics file:", error);
        return;
      }

      const blob = new Blob([value], {
        type: "text/calendar;charset=utf-8",
      });

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${event.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")}.ics`;
      link.click();
      URL.revokeObjectURL(url);
    }
  );
}