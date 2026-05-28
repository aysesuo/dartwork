"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import PersonCard from "@/components/people/PersonCard";
import AuthGuard from "@/components/auth/AuthGuard";
import { useAuth } from "@/lib/auth";

interface Person {
  id: string;
  name: string;
  disciplines: string[];
  skills: string[];
  bio: string;
  contactEmail: string | null;
  portfolioUrl: string | null;
}

export default function PeoplePage() {
  const { user } = useAuth();
  const [people,  setPeople]  = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(false);
  const [search,  setSearch]  = useState("");

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    (async () => {
      try {
        const token   = await user.getIdToken(true);
        const res     = await fetch("/api/users", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error(`${res.status}`);
        const data: Person[] = await res.json();
        if (!cancelled) setPeople(data);
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [user]);

  const filteredPeople = useMemo(() => {
    if (search === "") return people;
    const q = search.toLowerCase();
    return people.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.skills.some((s) => s.toLowerCase().includes(q)) ||
        p.disciplines.some((d) => d.toLowerCase().includes(q)),
    );
  }, [people, search]);

  return (
    <AuthGuard>
      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1
            className="text-5xl font-extrabold uppercase tracking-tight font-[family-name:var(--font-barlow)]"
            style={{ color: "#f5f5f0" }}
          >
            People
          </h1>
        </div>

        <input
          type="text"
          placeholder="Search by name, skill, or discipline..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-full px-5 py-2.5 text-sm mb-6 focus:outline-none focus:ring-2 focus:ring-green-700"
          style={{
            backgroundColor: "#132d1c",
            border: "1px solid #1e4430",
            color: "#f5f5f0",
          }}
        />

        {/* Loading skeletons */}
        {loading && (
          <div className="flex flex-col gap-3">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="h-24 rounded-3xl animate-pulse"
                style={{ backgroundColor: "#132d1c" }}
              />
            ))}
          </div>
        )}

        {/* Error state */}
        {!loading && error && (
          <p className="text-gray-400 text-sm text-center py-16">
            Couldn't load profiles. Please try refreshing.
          </p>
        )}

        {/* Empty — no profiles at all */}
        {!loading && !error && people.length === 0 && (
          <p className="text-gray-400 text-sm text-center py-16">
            No public profiles yet.
          </p>
        )}

        {/* Empty — search returned nothing */}
        {!loading && !error && people.length > 0 && filteredPeople.length === 0 && (
          <p className="text-gray-400 text-sm text-center py-16">
            No people match your search.
          </p>
        )}

        {/* Results */}
        {!loading && !error && filteredPeople.length > 0 && (
          <div className="flex flex-col gap-3">
            {filteredPeople.map((person) => (
              <Link
                key={person.id}
                href={`/profile/${person.id}`}
                className="block rounded-3xl transition-opacity hover:opacity-80"
              >
                <PersonCard person={person} showContact={false} />
              </Link>
            ))}
          </div>
        )}
      </main>
    </AuthGuard>
  );
}
