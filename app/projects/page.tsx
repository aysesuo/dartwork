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
        <h1 className="text-5xl font-extrabold uppercase tracking-tight font-[family-name:var(--font-barlow)]" style={{ color: "#f5f5f0" }}>Projects</h1>
        <a href="https://tally.so/r/44pBeB" target="_blank" rel="noopener noreferrer" className="px-4 py-2 text-white rounded-full text-xs font-bold uppercase tracking-widest transition-opacity hover:opacity-90" style={{ backgroundColor: "#FF6B35" }}>Post a Project</a>
      </div>
      <input type="text" placeholder="Search projects..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full rounded-full px-5 py-2.5 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-green-700" style={{ backgroundColor: "#132d1c", border: "1px solid #1e4430", color: "#f5f5f0" }} />
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