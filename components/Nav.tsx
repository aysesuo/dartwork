"use client";

import type { CSSProperties } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Briefcase, Users, Calendar, UserCircle } from "lucide-react";
import { useAuth } from "@/lib/auth";
import RansomLogo from "@/components/RansomLogo";

const GREEN = "#00693E";
const PROJECT_INK = "#1a1008";
// Yellow paper chip behind the projects-page menu items + inbox/profile icons.
const PROJECTS_PAPER = "/textures/paper-yellow.jpg";
const PROJECT_FONT = 'var(--font-special-elite), "Courier New", monospace';
const PROJECT_ICON_CHIP: CSSProperties = {
  color: PROJECT_INK,
  backgroundImage: `url(${PROJECTS_PAPER})`,
  backgroundSize: "cover",
  backgroundPosition: "center",
  boxShadow: "1px 2px 5px rgba(0,0,0,0.35)",
};
const EVENTS_WOOD = "/textures/wood_sign.png";
const WOOD_INK = "#3a2412";
// People (gazette) menu — printed-ink type on the bare paper background
const PEOPLE_INK = "#211910";
const PEOPLE_FONT = "var(--font-playfair), serif";

const NAV_ITEMS = [
  { href: "/projects", label: "Projects", Icon: Briefcase },
  { href: "/people", label: "People", Icon: Users },
  { href: "/events", label: "Events", Icon: Calendar },
] as const;

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(href + "/");
}

function MailboxIcon({ open, className }: { open: boolean; className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={open ? "/textures/mailbox_open.png" : "/textures/mailbox_closed.png"}
      alt=""
      aria-hidden="true"
      className={className}
      style={{ objectFit: "contain" }}
    />
  );
}

export function DesktopNav() {
  const pathname = usePathname();
  const { user } = useAuth();

  if (pathname === "/") return null;
  const onEvents = isActive(pathname, "/events");
  const onProjects = isActive(pathname, "/projects");
  const onPeople = isActive(pathname, "/people");
  const bare = onEvents || onProjects || onPeople;

  return (
    <nav
      className="hidden md:block sticky top-0 z-40"
      style={bare ? { backgroundColor: "transparent" } : { backgroundColor: "#0a1f14", borderBottom: "1px solid #1e4430" }}
      aria-label="Primary"
    >
      <div className="max-w-5xl mx-auto flex h-14 items-center justify-between px-4">
        {pathname !== "/" && (
          <Link href="/" aria-label="dArtwork home">
            <RansomLogo className="logo--nav" />
          </Link>
        )}

        <div
          className="ml-auto flex items-center gap-1"
          style={
            onEvents
              ? {
                  backgroundImage: `url(${EVENTS_WOOD})`,
                  backgroundSize: "100% 100%",
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "center",
                  padding: "0.85rem 3rem",
                }
              : undefined
          }
        >
          <ul className="flex items-center gap-1">
            {NAV_ITEMS.map(({ href, label }) => {
              const active = isActive(pathname, href);
              return (
                <li key={href}>
                  <Link
                    href={href}
                    aria-current={active ? "page" : undefined}
                    className={
                      onProjects
                        ? "px-3 py-1.5 transition-transform hover:-translate-y-0.5"
                        : onEvents
                        ? `px-3 py-1 transition-opacity ${active ? "opacity-100" : "opacity-80 hover:opacity-100"}`
                        : onPeople
                        ? `ink-print px-3 py-1 transition-opacity ${active ? "opacity-100" : "opacity-70 hover:opacity-100"}`
                        : `rounded-md px-3 py-2 text-xs font-bold uppercase tracking-widest transition-colors ${active ? "text-white" : "text-gray-500 hover:text-white"}`
                    }
                    style={
                      onProjects
                        ? {
                            fontFamily: PROJECT_FONT,
                            fontSize: "0.8rem",
                            fontWeight: 700,
                            textTransform: "uppercase",
                            letterSpacing: "0.08em",
                            color: PROJECT_INK,
                            backgroundImage: `url(${PROJECTS_PAPER})`,
                            backgroundSize: "cover",
                            backgroundPosition: "center",
                            boxShadow: "1px 2px 5px rgba(0,0,0,0.35)",
                            textDecoration: active ? "underline" : "none",
                          }
                        : onEvents
                        ? {
                            fontFamily: "var(--font-caveat), cursive",
                            fontSize: "1.6rem",
                            lineHeight: 1,
                            color: WOOD_INK,
                            textShadow: "0 1px 0 rgba(255,255,255,0.25)",
                            textDecoration: active ? "underline" : "none",
                          }
                        : onPeople
                        ? {
                            fontFamily: PEOPLE_FONT,
                            fontSize: "1.15rem",
                            fontWeight: 800,
                            letterSpacing: "0.01em",
                            color: PEOPLE_INK,
                            textDecoration: active ? "underline" : "none",
                            textUnderlineOffset: 4,
                          }
                        : active ? { backgroundColor: GREEN } : undefined
                    }
                  >
                    {label}
                  </Link>
                </li>
              );
            })}
          </ul>
          {user && (
            <>
              <Link
                href="/inbox"
                aria-label="Inbox"
                className={`ml-2 p-2 transition-colors ${bare ? "" : "rounded-md"} ${
                  bare ? "hover:opacity-70" : isActive(pathname, "/inbox") ? "text-white" : "text-gray-500 hover:text-white"
                }`}
                style={
                  onProjects
                    ? PROJECT_ICON_CHIP
                    : onEvents
                    ? { color: WOOD_INK }
                    : onPeople
                    ? { color: PEOPLE_INK }
                    : isActive(pathname, "/inbox")
                    ? { backgroundColor: GREEN }
                    : undefined
                }
              >
                <MailboxIcon open={isActive(pathname, "/inbox")} className="h-5 w-5" />
              </Link>
              <Link
                href={`/profile/${user.uid}`}
                aria-label="My profile"
                className={`ml-1 p-2 transition-colors ${bare ? "" : "rounded-md"} ${
                  bare ? "hover:opacity-70" : isActive(pathname, "/profile") ? "text-white" : "text-gray-500 hover:text-white"
                }`}
                style={
                  onProjects
                    ? PROJECT_ICON_CHIP
                    : onEvents
                    ? { color: WOOD_INK }
                    : onPeople
                    ? { color: PEOPLE_INK }
                    : isActive(pathname, "/profile")
                    ? { backgroundColor: GREEN }
                    : undefined
                }
              >
                <UserCircle className="h-5 w-5" aria-hidden="true" />
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

export function MobileNav() {
  const pathname = usePathname();
  const { user } = useAuth();

  const mobileItems = [
    ...NAV_ITEMS,
    ...(user
      ? [
          { href: "/inbox",              label: "Inbox",   Icon: UserCircle  } as const, // icon overridden by MailboxIcon below
          { href: `/profile/${user.uid}`, label: "Profile", Icon: UserCircle } as const,
        ]
      : []),
  ];

  if (pathname === "/") return null;
  const onEvents = isActive(pathname, "/events");
  const onProjects = isActive(pathname, "/projects");
  const onPeople = isActive(pathname, "/people");
  const bare = onEvents || onProjects || onPeople;

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 md:hidden"
      style={bare ? { backgroundColor: "transparent" } : { backgroundColor: "#0a1f14", borderTop: "1px solid #1e4430" }}
      aria-label="Primary"
    >
      <ul
        className="flex"
        style={
          onEvents
            ? {
                backgroundImage: `url(${EVENTS_WOOD})`,
                backgroundSize: "100% 100%",
                backgroundRepeat: "no-repeat",
                backgroundPosition: "center",
              }
            : undefined
        }
      >
        {mobileItems.map(({ href, label, Icon }) => {
          const active = isActive(pathname, href);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={
                  onProjects
                    ? "flex flex-col items-center gap-0.5 py-2.5 m-1 transition-transform hover:-translate-y-0.5"
                    : onEvents
                    ? "flex flex-col items-center gap-0.5 py-2.5 transition-opacity"
                    : onPeople
                    ? "ink-print flex flex-col items-center gap-0.5 py-2.5 transition-opacity"
                    : `flex flex-col items-center gap-0.5 py-2.5 text-[9px] font-bold uppercase tracking-widest transition-colors ${active ? "" : "text-gray-500 hover:text-white"}`
                }
                style={
                  onProjects
                    ? {
                        fontFamily: PROJECT_FONT,
                        fontSize: "0.6rem",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.08em",
                        color: PROJECT_INK,
                        backgroundImage: `url(${PROJECTS_PAPER})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                        boxShadow: "1px 2px 5px rgba(0,0,0,0.35)",
                        textDecoration: active ? "underline" : "none",
                      }
                    : onEvents
                    ? {
                        fontFamily: "var(--font-caveat), cursive",
                        fontSize: "1.05rem",
                        lineHeight: 1,
                        color: WOOD_INK,
                        opacity: active ? 1 : 0.85,
                      }
                    : onPeople
                    ? {
                        fontFamily: PEOPLE_FONT,
                        fontSize: "0.9rem",
                        fontWeight: 800,
                        color: PEOPLE_INK,
                        opacity: active ? 1 : 0.8,
                      }
                    : active ? { color: GREEN } : undefined
                }
              >
                {href === "/inbox" ? (
                  <MailboxIcon open={active} className="h-5 w-5" />
                ) : (
                  <Icon className="h-5 w-5" aria-hidden="true" />
                )}
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
