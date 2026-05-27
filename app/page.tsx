"use client";

import Link from "next/link";
import { ArrowRight, Lock } from "lucide-react";
import { useAuth } from "@/lib/auth";
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

export default function HomePage() {
  const { user, loading } = useAuth();
  const signedIn = !loading && !!user;

  return (
    <main className="max-w-5xl mx-auto px-4 py-10 sm:py-14">

      {/* Hero */}
      <section className="mb-20 pt-6 text-center sm:text-left">
        <h1 className="text-6xl font-extrabold tracking-tight sm:text-8xl leading-[1.0] font-[family-name:var(--font-barlow)] uppercase">
          <span style={{ color: "#AAFF47" }}>d</span>
          <span style={{ color: "#FF6B35" }} className="italic font-[family-name:var(--font-playfair)]">Art</span>
          <span style={{ color: "#AAFF47" }}>work</span>
        </h1>

        <p className="mt-5 text-lg font-semibold max-w-md sm:mx-0 mx-auto" style={{ color: "#f5f5f0" }}>
          Where dArtists meet, collaborate &amp; showcase.
        </p>

        {!signedIn && (
          <div className="mt-8 max-w-sm sm:mx-0 mx-auto">
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-sm font-bold uppercase tracking-widest transition-opacity hover:opacity-70"
              style={{ color: "#FF6B35" }}
            >
              Sign up to
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
            <ul className="mt-4 space-y-3">
              {[
                "Build an online portfolio that displays your work.",
                "Find collaborators for any project or idea.",
                "Discover or post dArtsy events on campus.",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm" style={{ color: "#7fa88a" }}>
                  <span
                    className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
                    style={{ backgroundColor: "#AAFF47" }}
                    aria-hidden="true"
                  />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {/* Projects to Join */}
      <section className="mb-14">
        <div className="mb-4 flex items-end justify-between">
          <h2 className="text-2xl font-black tracking-tight font-[family-name:var(--font-playfair)]" style={{ color: "#f5f5f0" }}>
            Projects to Join
          </h2>
          {signedIn && (
            <Link
              href="/projects"
              className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest transition-colors hover:opacity-70"
              style={{ color: "#FF6B35" }}
            >
              All projects
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          )}
        </div>

        {signedIn ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {RECENT_PROJECTS.map((project, i) => (
              <Link
                key={project.id}
                href="/projects"
                className="transition-transform hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-700"
              >
                <ProjectCard project={project} index={i} />
              </Link>
            ))}
          </div>
        ) : (
          <MemberGate label="Sign in to collaborate" />
        )}
      </section>

      {/* Events Coming Up */}
      <section>
        <div className="mb-4 flex items-end justify-between">
          <h2 className="text-2xl font-black tracking-tight font-[family-name:var(--font-playfair)]" style={{ color: "#f5f5f0" }}>
            Events Coming Up
          </h2>
          {signedIn && (
            <Link
              href="/events"
              className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest transition-colors hover:opacity-70"
              style={{ color: "#FF6B35" }}
            >
              All events
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          )}
        </div>

        {signedIn ? (
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
        ) : (
          <MemberGate label="Sign in to view upcoming events!" />
        )}
      </section>

    </main>
  );
}

function MemberGate({ label }: { label: string }) {
  return (
    <div
      className="flex flex-col items-center justify-center gap-5 rounded-2xl py-16 px-8 text-center"
      style={{ backgroundColor: "#0f2b1a", border: "1px solid #1e4430" }}
    >
      <Lock className="h-6 w-6" style={{ color: "#7fa88a" }} aria-hidden="true" />
      <p className="text-sm" style={{ color: "#7fa88a" }}>
        Members only. Sign in to see what&apos;s happening.
      </p>
      <Link
        href="/login"
        className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-white text-xs font-bold uppercase tracking-widest transition-opacity hover:opacity-90"
        style={{ backgroundColor: "#FF6B35" }}
      >
        {label}
        <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </Link>
    </div>
  );
}
