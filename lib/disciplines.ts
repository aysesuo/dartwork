export const DISCIPLINES = [
  "Visual Art",
  "Film",
  "Music",
  "Writing",
  "Theater",
  "Dance",
  "Photography",
  "UX Design",
  "Other",
];

export const DISCIPLINE_COLORS: Record<
  string,
  { tailwindBg: string; tailwindText: string; hex: string }
> = {
  "Visual Art":  { tailwindBg: "bg-emerald-100", tailwindText: "text-emerald-800", hex: "#065F46" },
  "Film":        { tailwindBg: "bg-rose-100",    tailwindText: "text-rose-800",    hex: "#9F1239" },
  "Music":       { tailwindBg: "bg-violet-100",  tailwindText: "text-violet-800",  hex: "#5B21B6" },
  "Writing":     { tailwindBg: "bg-sky-100",     tailwindText: "text-sky-800",     hex: "#075985" },
  "Theater":     { tailwindBg: "bg-orange-100",  tailwindText: "text-orange-800",  hex: "#9A3412" },
  "Dance":       { tailwindBg: "bg-pink-100",    tailwindText: "text-pink-800",    hex: "#9D174D" },
  "Photography": { tailwindBg: "bg-amber-100",   tailwindText: "text-amber-800",   hex: "#92400E" },
  "UX Design":   { tailwindBg: "bg-blue-100",    tailwindText: "text-blue-800",    hex: "#1E40AF" },
  "Other":       { tailwindBg: "bg-gray-100",    tailwindText: "text-gray-700",    hex: "#374151" },
};

export function getDisciplineColor(tag: string) {
  return DISCIPLINE_COLORS[tag] ?? DISCIPLINE_COLORS["Other"];
}