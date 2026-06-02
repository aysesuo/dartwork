"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Briefcase, Users, Calendar, UserCircle, Inbox } from "lucide-react";
import { useAuth } from "@/lib/auth";
import RansomLogo from "@/components/RansomLogo";

const GREEN = "#00693E";
const PROJECT_INK = "#1a1008";
// PLACEHOLDER paper texture for the projects-page menu chips — swap for the real one later.
const PROJECTS_PAPER = "/textures/paper-yellow.jpg";
const PROJECT_FONT = 'var(--font-special-elite), "Courier New", monospace';
const EVENTS_WOOD = "/textures/wood_sign.png";
const WOOD_INK = "#3a2412";

const NAV_ITEMS = [
  { href: "/projects", label: "Projects", Icon: Briefcase },
  { href: "/people", label: "People", Icon: Users },
  { href: "/events", label: "Events", Icon: Calendar },
] as const;

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(href + "/");
}

export function DesktopNav() {
  const pathname = usePathname();
  const { user } = useAuth();

  if (pathname === "/") return null;
  const onEvents = isActive(pathname, "/events");
  const onProjects = isActive(pathname, "/projects");
  const bare = onEvents || onProjects;

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
                className={`ml-2 rounded-md p-2 transition-colors ${
                  onProjects ? "hover:opacity-70" : onEvents ? "hover:opacity-70" : isActive(pathname, "/inbox") ? "text-white" : "text-gray-500 hover:text-white"
                }`}
                style={onProjects || onEvents ? { color: onEvents ? WOOD_INK : PROJECT_INK } : isActive(pathname, "/inbox") ? { backgroundColor: GREEN } : undefined}
              >
                <Inbox className="h-5 w-5" aria-hidden="true" />
              </Link>
              <Link
                href={`/profile/${user.uid}`}
                aria-label="My profile"
                className={`ml-1 rounded-md p-2 transition-colors ${
                  onProjects ? "hover:opacity-70" : onEvents ? "hover:opacity-70" : isActive(pathname, "/profile") ? "text-white" : "text-gray-500 hover:text-white"
                }`}
                style={onProjects || onEvents ? { color: onEvents ? WOOD_INK : PROJECT_INK } : isActive(pathname, "/profile") ? { backgroundColor: GREEN } : undefined}
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
          { href: "/inbox",              label: "Inbox",   Icon: Inbox       } as const,
          { href: `/profile/${user.uid}`, label: "Profile", Icon: UserCircle } as const,
        ]
      : []),
  ];

  if (pathname === "/") return null;
  const onEvents = isActive(pathname, "/events");
  const onProjects = isActive(pathname, "/projects");
  const bare = onEvents || onProjects;

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
                    : active ? { color: GREEN } : undefined
                }
              >
                <Icon className="h-5 w-5" aria-hidden="true" />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
