import Link from "next/link";
import { ArrowRight, CalendarRange } from "lucide-react";
import ProjectCard from "@/components/project/ProjectCard";
import EventCard from "@/components/events/EventCard";
import EventDotsMonth from "@/components/home/EventDotsMonth";
import projectsData from "@/data/projects.json";
import eventsData from "@/data/events.json";
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

const GREEN = "#00693E";

export default function HomePage() {
  return (
    <main className="max-w-5xl mx-auto px-4 py-10 sm:py-14">
      {/* Hero */}
      <section className="mb-20 pt-6 text-center sm:text-left">
        <h1 className="text-6xl font-extrabold tracking-tight sm:text-8xl leading-[1.0] font-[family-name:var(--font-barlow)] uppercase">
          Build your{" "}
          <span style={{ color: "#AAFF47" }}>d</span><span style={{ color: "#FF6B35" }} className="italic font-[family-name:var(--font-playfair)]">Art</span><span style={{ color: "#AAFF47" }}>work</span>
        </h1>
        <p className="mt-5 text-base max-w-md sm:mx-0 mx-auto" style={{ color: "#7fa88a" }}>
          Find projects to join, meet talented peers, and find what&apos;s
          happening on campus.
        </p>

        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:items-start">
          <Link
            href="/projects"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-white text-xs font-bold uppercase tracking-widest transition-opacity hover:opacity-90"
            style={{ backgroundColor: "#FF6B35" }}
          >
            Browse Projects
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
          <Link
            href="/events"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-xs font-bold uppercase tracking-widest border-2 bg-transparent transition-colors hover:bg-white/10"
            style={{ borderColor: "#7fa88a", color: "#f5f5f0" }}
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

      {/* Coming Up + Mini Calendar */}
      <section>
        <SectionHeading title="Events Coming Up" href="/events" linkLabel="All events" />
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
      <h2 className="text-2xl font-black tracking-tight font-[family-name:var(--font-playfair)]" style={{ color: "#f5f5f0" }}>{title}</h2>
      <Link
        href={href}
        className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest transition-colors hover:opacity-70"
        style={{ color: "#FF6B35" }}
      >
        {linkLabel}
        <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
      </Link>
    </div>
  );
}
