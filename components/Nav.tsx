"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Briefcase, Users, Calendar } from "lucide-react";

const GREEN = "#00693E";

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

  return (
    <nav
      className="hidden md:block border-b border-amber-200 sticky top-0 z-40"
      style={{ backgroundColor: "#F9F6D2" }}
      aria-label="Primary"
    >
      <div className="max-w-5xl mx-auto flex h-14 items-center justify-between px-4">
        <Link
          href="/"
          className="text-xl font-black tracking-tight font-[family-name:var(--font-playfair)]"
          style={{ color: GREEN }}
        >
          d<span className="text-gray-900">Art</span>work
        </Link>

        <ul className="flex items-center gap-1">
          {NAV_ITEMS.map(({ href, label }) => {
            const active = isActive(pathname, href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                    active
                      ? "text-white"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  }`}
                  style={active ? { backgroundColor: GREEN } : undefined}
                >
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 border-t border-amber-200 md:hidden"
      style={{ backgroundColor: "#F9F6D2" }}
      aria-label="Primary"
    >
      <ul className="flex">
        {NAV_ITEMS.map(({ href, label, Icon }) => {
          const active = isActive(pathname, href);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex flex-col items-center gap-0.5 py-2.5 text-xs font-medium transition-colors ${
                  active ? "" : "text-gray-500 hover:text-gray-900"
                }`}
                style={active ? { color: GREEN } : undefined}
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
