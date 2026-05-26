"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Briefcase, Users, Calendar, UserCircle } from "lucide-react";
import { useAuth } from "@/lib/auth";

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
  const { user } = useAuth();

  return (
    <nav
      className="hidden md:block sticky top-0 z-40"
      style={{ backgroundColor: "#0a1f14", borderBottom: "1px solid #1e4430" }}
      aria-label="Primary"
    >
      <div className="max-w-5xl mx-auto flex h-14 items-center justify-between px-4">
        <Link
          href="/"
          className="text-xl font-black tracking-tight font-[family-name:var(--font-barlow)] uppercase"
        >
          <span style={{ color: "#AAFF47" }}>d</span><span style={{ color: "#FF6B35" }} className="italic font-[family-name:var(--font-playfair)]">Art</span><span style={{ color: "#AAFF47" }}>work</span>
        </Link>

        <div className="flex items-center gap-1">
          <ul className="flex items-center gap-1">
            {NAV_ITEMS.map(({ href, label }) => {
              const active = isActive(pathname, href);
              return (
                <li key={href}>
                  <Link
                    href={href}
                    aria-current={active ? "page" : undefined}
                    className={`rounded-md px-3 py-2 text-xs font-bold uppercase tracking-widest transition-colors ${
                      active ? "text-white" : "text-gray-500 hover:text-white"
                    }`}
                    style={active ? { backgroundColor: GREEN } : undefined}
                  >
                    {label}
                  </Link>
                </li>
              );
            })}
          </ul>
          {user && (
            <Link
              href={`/profile/${user.uid}`}
              aria-label="My profile"
              className={`ml-2 rounded-md p-2 transition-colors ${
                isActive(pathname, "/profile") ? "text-white" : "text-gray-500 hover:text-white"
              }`}
              style={isActive(pathname, "/profile") ? { backgroundColor: GREEN } : undefined}
            >
              <UserCircle className="h-5 w-5" aria-hidden="true" />
            </Link>
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
      ? [{ href: `/profile/${user.uid}`, label: "Profile", Icon: UserCircle } as const]
      : []),
  ];

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 md:hidden"
      style={{ backgroundColor: "#0a1f14", borderTop: "1px solid #1e4430" }}
      aria-label="Primary"
    >
      <ul className="flex">
        {mobileItems.map(({ href, label, Icon }) => {
          const active = isActive(pathname, href);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex flex-col items-center gap-0.5 py-2.5 text-[9px] font-bold uppercase tracking-widest transition-colors ${
                  active ? "" : "text-gray-500 hover:text-white"
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
