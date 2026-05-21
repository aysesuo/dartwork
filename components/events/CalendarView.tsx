"use client";

import { useMemo } from "react";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { enUS } from "date-fns/locale";
import {
  toCalendarEvents,
  DartworkEvent,
  CalendarEvent,
} from "@/lib/calendarAdapter";
import { getDisciplineColor } from "@/lib/disciplines";

const locales = { "en-US": enUS };

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: (date: Date) => startOfWeek(date, { weekStartsOn: 0 }),
  getDay,
  locales,
});

interface CalendarViewProps {
  events: DartworkEvent[];
  onEventSelect: (event: DartworkEvent) => void;
}

export default function CalendarView({
  events,
  onEventSelect,
}: CalendarViewProps) {
  const calendarEvents = useMemo(() => toCalendarEvents(events), [events]);

  const defaultDate = useMemo(() => {
    if (calendarEvents.length === 0) return new Date();
    return calendarEvents[0].start;
  }, [calendarEvents]);

  const eventPropGetter = (event: CalendarEvent) => {
    const primary = event.resource.disciplines[0] ?? "Other";
    const { hex } = getDisciplineColor(primary);
    return {
      style: {
        backgroundColor: hex,
        borderColor: hex,
        color: "white",
      },
    };
  };

  return (
    <div className="h-[700px] rounded-lg border border-gray-200 bg-white p-3">
      <Calendar
        localizer={localizer}
        events={calendarEvents}
        defaultDate={defaultDate}
        startAccessor="start"
        endAccessor="end"
        onSelectEvent={(e) => onEventSelect(e.resource)}
        eventPropGetter={eventPropGetter}
        popup
        style={{ height: "100%" }}
      />
    </div>
  );
}
