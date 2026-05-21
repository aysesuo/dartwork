import Link from "next/link";
import { ArrowRight, CalendarRange } from "lucide-react";
import ProjectCard from "@/components/project/ProjectCard";
import EventCard from "@/components/events/EventCard";
import EventDotsMonth from "@/components/home/EventDotsMonth";
import PersonCard from "@/components/people/PersonCard";
import projectsData from "@/data/projects.json";
import eventsData from "@/data/events.json";
import peopleData from "@/data/people.json";
import { DartworkEvent } from "@/lib/calendarAdapter";

const RECENT_PROJECTS = [...projectsData]
  .sort((a, b) => new Date(b.datePosted).getTime() - new Date(a.datePosted).getTime())
  .slice(0, 3);

const UPCOMING_EVENTS = [...eventsData]
  .filter((e) => new Date(e.dateTime) >= new Date())
  .sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime())
  .slice(0, 2) as DartworkEvent[];

// Anchor the mini-calendar to a month that has events; fall back to today
const MONTH_ANCHOR =
  UPCOMING_EVENTS.length > 0
    ? new Date(UPCOMING_EVENTS[0].dateTime)
    : eventsData.length > 0
    ? new Date(
        [...eventsData].sort(
          (a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime()
        )[0].dateTime
      )
    : new Date();

const FEATURED_PEOPLE = peopleData.slice(0, 3);

const GREEN = "#00693E";

export default function HomePage() {
  return (
    <main className="max-w-5xl mx-auto px-4 py-10 sm:py-14">
      {/* Hero */}
      <section className="mb-16 text-center sm:text-left">
        <h1 className="text-4xl font-black tracking-tight text-gray-900 sm:text-5xl leading-tight font-[family-name:var(--font-playfair)]">
          Build your{" "}
          <span className="text-gray-900">d</span><span style={{ color: GREEN }}>Art</span><span className="text-gray-900">work</span>
        </h1>
        <p className="mt-4 text-lg text-gray-500 max-w-2xl sm:mx-0 mx-auto">
          Find projects to join, meet talented peers, and find what&apos;s
          happening on campus.
        </p>

        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:items-start">
          <Link
            href="/projects"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-white text-sm font-semibold transition-opacity hover:opacity-90"
            style={{ backgroundColor: "#C96040" }}
          >
            Browse Projects
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
          <Link
            href="/events"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold border-2 border-gray-700 bg-transparent text-gray-700 hover:bg-black/5 transition-colors"
          >
            <CalendarRange className="h-4 w-4" aria-hidden="true" />
            See the Calendar
          </Link>
        </div>
      </section>

      {/* Recent Projects */}
      <section className="mb-14">
        <SectionHeading title="Recent Projects" href="/projects" linkLabel="All projects" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {RECENT_PROJECTS.map((project) => (
            <Link
              key={project.id}
              href="/projects"
              className="rounded-xl transition-transform hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-700"
            >
              <ProjectCard project={project} />
            </Link>
          ))}
        </div>
      </section>

      {/* People */}
      <section className="mb-14">
        <SectionHeading title="People" href="/people" linkLabel="All people" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURED_PEOPLE.map((person) => (
            <Link
              key={person.id}
              href="/people"
              className="rounded-xl transition-transform hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-700"
            >
              <PersonCard person={person} showContact={false} />
            </Link>
          ))}
        </div>
      </section>

      {/* Coming Up + Mini Calendar */}
      <section>
        <SectionHeading title="Coming Up" href="/events" linkLabel="All events" />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:col-span-2">
            {UPCOMING_EVENTS.length > 0 ? (
              UPCOMING_EVENTS.map((event) => (
                <Link
                  key={event.id}
                  href="/events"
                  className="rounded-xl transition-transform hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-700"
                >
                  <EventCard event={event} />
                </Link>
              ))
            ) : (
              <p className="col-span-full py-8 text-center text-sm text-gray-400">
                No upcoming events right now —{" "}
                <Link href="/events" className="underline hover:text-gray-700">
                  browse past events
                </Link>
                .
              </p>
            )}
          </div>

          <div className="lg:col-span-1">
            <EventDotsMonth
              events={eventsData as DartworkEvent[]}
              monthAnchor={MONTH_ANCHOR}
            />
          </div>
        </div>
      </section>
    </main>
  );
}

function SectionHeading({
  title,
  href,
  linkLabel,
}: {
  title: string;
  href: string;
  linkLabel: string;
}) {
  return (
    <div className="mb-4 flex items-end justify-between">
      <h2 className="text-2xl font-black tracking-tight text-gray-900 font-[family-name:var(--font-playfair)]">{title}</h2>
      <Link
        href={href}
        className="inline-flex items-center gap-1 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
      >
        {linkLabel}
        <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
      </Link>
    </div>
  );
}
