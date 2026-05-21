"use client";

import { useState } from "react";
import projectsData from "@/data/projects.json";
import ProjectCard from "@/components/project/ProjectCard";
import DisciplineFilterBar from "@/components/shared/DisciplineFilterBar";
import { DISCIPLINES } from "@/lib/disciplines";

export default function ProjectsPage() {
  const [activeFilters, setActiveFilters] = useState<string[]>(DISCIPLINES);
  const [search, setSearch] = useState("");

  const filteredProjects = projectsData.filter((project) => {
    const matchesDiscipline = activeFilters.includes(project.discipline);
    const matchesSearch =
      search === "" ||
      project.title.toLowerCase().includes(search.toLowerCase()) ||
      project.discipline.toLowerCase().includes(search.toLowerCase());
    return matchesDiscipline && matchesSearch;
  });

  function handleToggle(discipline: string) {
    setActiveFilters((prev) => {
      if (prev.length === 1 && prev[0] === discipline) return [...DISCIPLINES];
      return [discipline];
    });
  }

  function handleToggleAll() {
    setActiveFilters([...DISCIPLINES]);
  }

  return (
    <main className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-black text-gray-900 font-[family-name:var(--font-playfair)]">Projects</h1>
        <a href="https://tally.so/r/44pBeB" target="_blank" rel="noopener noreferrer" className="px-4 py-2 text-white rounded-full text-sm font-semibold transition-opacity hover:opacity-90" style={{ backgroundColor: "#C96040" }}>Post a Project</a>
      </div>
      <input type="text" placeholder="Search projects..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-green-700" />
      <div className="mb-6"><DisciplineFilterBar activeFilters={activeFilters} onToggle={handleToggle} onToggleAll={handleToggleAll} /></div>
      {filteredProjects.length === 0 ? (
        <p className="text-gray-400 text-sm text-center py-16">No projects match your filters.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProjects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </main>
  );
}