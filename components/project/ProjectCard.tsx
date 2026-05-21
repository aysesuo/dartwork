import { getDisciplineColor } from "@/lib/disciplines";

interface Project {
  id: string;
  title: string;
  creatorName: string;
  discipline: string;
  tags: string[];
  positionsNeeded: string[];
  description: string;
  mediaUrl?: string | null;
  datePosted: string;
}

interface ProjectCardProps {
  project: Project;
}

export default function ProjectCard({ project }: ProjectCardProps) {
  const colors = getDisciplineColor(project.discipline);

  return (
    <div className="rounded-3xl border p-6 flex flex-col gap-3 hover:shadow-lg transition-shadow" style={{ backgroundColor: "#132d1c", borderColor: "#1e4430" }}>
      {/* Discipline tag */}
      <span
        className={`self-start px-2 py-0.5 rounded-full text-xs font-medium ${colors.tailwindBg} ${colors.tailwindText}`}
      >
        {project.discipline}
      </span>

      {/* Title */}
      <h3 className="font-bold text-xl leading-snug uppercase tracking-tight font-[family-name:var(--font-barlow)]" style={{ color: "#f5f5f0" }}>
        {project.title}
      </h3>

      {/* Creator */}
      <p className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: "#7fa88a" }}>{project.creatorName}</p>

      {/* Description excerpt */}
      <p className="text-sm leading-relaxed line-clamp-3" style={{ color: "#9db5a5" }}>
        {project.description}
      </p>

      {/* Looking for */}
      {project.positionsNeeded.length > 0 && (
        <div className="mt-auto pt-2 border-t" style={{ borderColor: "#1e4430" }}>
          <p className="text-[10px] uppercase tracking-widest font-semibold mb-1" style={{ color: "#7fa88a" }}>Looking for</p>
          <div className="flex flex-wrap gap-1">
            {project.positionsNeeded.map((pos) => (
              <span
                key={pos}
                className="px-2 py-0.5 rounded text-[10px] uppercase tracking-wide font-semibold"
                style={{ backgroundColor: "#1e4430", color: "#9db5a5" }}
              >
                {pos}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}