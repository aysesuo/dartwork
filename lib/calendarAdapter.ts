export interface DartworkEvent {
  id: string;
  title: string;
  organizer: string;
  organizerEmail: string | null;
  location: string;
  dateTime: string;
  endDateTime?: string | null;
  description: string;
  disciplines: string[];
  imageUrl?: string | null;
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: DartworkEvent;
}

export function toCalendarEvent(event: DartworkEvent): CalendarEvent {
  return {
    id: event.id,
    title: event.title,
    start: new Date(event.dateTime),
    end: event.endDateTime
      ? new Date(event.endDateTime)
      : new Date(new Date(event.dateTime).getTime() + 2 * 60 * 60 * 1000),
    resource: event,
  };
}

export function toCalendarEvents(events: DartworkEvent[]): CalendarEvent[] {
  return events.map(toCalendarEvent);
}