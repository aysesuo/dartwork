import { getDisciplineColor } from "@/lib/disciplines";

interface Person {
  id: string;
  name: string;
  disciplines: string[];
  skills: string[];
  bio: string;
  contactEmail: string | null;
  portfolioUrl?: string | null;
}

export default function PersonCard({ person, showContact = true }: { person: Person; showContact?: boolean }) {
  const initials = person.name.split(" ").map((n) => n[0]).join("").slice(0, 2);
  return (
    <div className="flex items-start gap-4 p-4 bg-white rounded-2xl border border-amber-200 hover:shadow-md transition-shadow">
      <div className="w-12 h-12 rounded-full bg-green-700 flex items-center justify-center shrink-0">
        <span className="text-white font-semibold text-sm">{initials}</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-gray-900">{person.name}</h3>
          {person.portfolioUrl && (
            <a href={person.portfolioUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-green-700 hover:underline shrink-0">Portfolio</a>
          )}
        </div>
        <div className="flex flex-wrap gap-1 mt-1">
          {person.disciplines.map((d) => {
            const colors = getDisciplineColor(d);
            return (
              <span key={d} className={`${colors.tailwindBg} ${colors.tailwindText} px-2 py-0.5 rounded-full text-xs font-medium`}>{d}</span>
            );
          })}
        </div>
        <p className="text-sm text-gray-600 mt-2 line-clamp-2">{person.bio}</p>
        {showContact && person.contactEmail && (
          <a href={"mailto:" + person.contactEmail} className="text-xs text-green-700 hover:underline mt-2 inline-block">Get in touch</a>
        )}
      </div>
    </div>
  );
}