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
    <div className="bg-white rounded-2xl border border-amber-200 p-5 flex flex-col gap-3 hover:shadow-md transition-shadow">
      {/* Discipline tag */}
      <span
        className={`self-start px-2 py-0.5 rounded-full text-xs font-medium ${colors.tailwindBg} ${colors.tailwindText}`}
      >
        {project.discipline}
      </span>

      {/* Title */}
      <h3 className="font-semibold text-gray-900 text-lg leading-snug">
        {project.title}
      </h3>

      {/* Creator */}
      <p className="text-sm text-gray-500">by {project.creatorName}</p>

      {/* Description excerpt */}
      <p className="text-sm text-gray-600 leading-relaxed line-clamp-3">
        {project.description}
      </p>

      {/* Looking for */}
      {project.positionsNeeded.length > 0 && (
        <div className="mt-auto pt-2 border-t border-gray-100">
          <p className="text-xs text-gray-400 mb-1">Looking for</p>
          <div className="flex flex-wrap gap-1">
            {project.positionsNeeded.map((pos) => (
              <span
                key={pos}
                className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs"
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