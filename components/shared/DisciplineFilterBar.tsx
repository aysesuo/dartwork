"use client";

import { getDisciplineColor, DISCIPLINES } from "@/lib/disciplines";

interface DisciplineFilterBarProps {
  disciplines?: string[];
  activeFilters: string[];
  onToggle: (discipline: string) => void;
  onToggleAll: () => void;
}

export default function DisciplineFilterBar({
  disciplines = DISCIPLINES,
  activeFilters,
  onToggle,
  onToggleAll,
}: DisciplineFilterBarProps) {
  const allActive = activeFilters.length === disciplines.length;

  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {/* All pill */}
      <button
        onClick={onToggleAll}
        className={`shrink-0 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border transition-colors ${
          allActive
            ? "bg-green-700 text-white border-green-700"
            : "border-green-700 text-green-400"
        }`}
      >
        All
      </button>

      {/* Discipline pills */}
      {disciplines.map((discipline) => {
        const colors = getDisciplineColor(discipline);
        const isActive = activeFilters.includes(discipline);
        return (
          <button
            key={discipline}
            onClick={() => onToggle(discipline)}
            className={`shrink-0 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border transition-colors ${
              isActive
                ? `${colors.tailwindBg} ${colors.tailwindText} border-transparent`
                : `bg-transparent border-current`
            }`}
            style={!isActive ? { color: colors.hex, borderColor: colors.hex } : {}}
          >
            {discipline}
          </button>
        );
      })}
    </div>
  );
}