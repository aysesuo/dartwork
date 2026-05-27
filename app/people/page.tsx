"use client";

import { useState } from "react";
import peopleData from "@/data/people.json";
import PersonCard from "@/components/people/PersonCard";
import AuthGuard from "@/components/auth/AuthGuard";

export default function PeoplePage() {
  const [search, setSearch] = useState("");

  const filteredPeople = peopleData.filter((person) => {
    if (search === "") return true;
    const q = search.toLowerCase();
    return (
      person.name.toLowerCase().includes(q) ||
      person.skills.some((s) => s.toLowerCase().includes(q)) ||
      person.disciplines.some((d) => d.toLowerCase().includes(q))
    );
  });

  return (
    <AuthGuard>
    <main className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-5xl font-extrabold uppercase tracking-tight font-[family-name:var(--font-barlow)]" style={{ color: "#f5f5f0" }}>People</h1>
      </div>

      <input
        type="text"
        placeholder="Search by name, skill, or discipline..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full rounded-full px-5 py-2.5 text-sm mb-6 focus:outline-none focus:ring-2 focus:ring-green-700"
        style={{ backgroundColor: "#132d1c", border: "1px solid #1e4430", color: "#f5f5f0" }}
      />

      {filteredPeople.length === 0 ? (
        <p className="text-gray-400 text-sm text-center py-16">
          No people match your search.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {filteredPeople.map((person) => (
            <PersonCard key={person.id} person={person} />
          ))}
        </div>
      )}
    </main>
    </AuthGuard>
  );
}