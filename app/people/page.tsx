"use client";

import { useState } from "react";
import peopleData from "@/data/people.json";
import PersonCard from "@/components/people/PersonCard";

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
    <main className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-black text-gray-900 font-[family-name:var(--font-playfair)]">People</h1>
      </div>

      <input
        type="text"
        placeholder="Search by name, skill, or discipline..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm mb-6 focus:outline-none focus:ring-2 focus:ring-green-700"
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
  );
}