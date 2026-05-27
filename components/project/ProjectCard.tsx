// Torn-paper bulletin-board card
// Each card gets a unique feTurbulence seed + texture.
// When `decorated` is true (default) the component applies its own rotation
// and drop-shadow — used on the home page preview.
// When `decorated` is false those are suppressed so DraggableProjectCard
// can own them.

const TEXTURES = [
  "/textures/paper-red.jpg",
  "/textures/paper-yellow.jpg",
  "/textures/paper-blue.jpg",
  "/textures/paper-red-2.jpg",
  "/textures/paper-yellow-2.jpg",
  "/textures/paper-blue-2.jpg",
];

// Seeds as specified: 2, 7, 11, 5, 14
const SEEDS = [2, 7, 11, 5, 14];

// Rotations spread between -3 and +3 deg
const ROTATIONS = [-2.5, 1.4, -1.8, 2.9, -0.8, 1.7, -3.0, 0.6, 2.3, -1.2];

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
  index?: number;
  /** If false, skip self-applied rotation + shadow (let wrapper own them) */
  decorated?: boolean;
}

export default function ProjectCard({
  project,
  index = 0,
  decorated = true,
}: ProjectCardProps) {
  const texture  = TEXTURES[index % TEXTURES.length];
  const seed     = SEEDS[index % SEEDS.length];
  const rotation = ROTATIONS[index % ROTATIONS.length];
  const filterId = `torn-paper-${index}`;

  return (
    <>
      {/* Inline SVG filter — must precede the element that references it */}
      <svg
        width="0"
        height="0"
        aria-hidden="true"
        style={{ position: "absolute", overflow: "hidden" }}
      >
        <defs>
          <filter
            id={filterId}
            x="-8%"
            y="-8%"
            width="116%"
            height="116%"
            colorInterpolationFilters="sRGB"
          >
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.04"
              numOctaves="5"
              seed={seed}
              result="noise"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="noise"
              scale="10"
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        </defs>
      </svg>

      {/* Card */}
      <div
        style={{
          backgroundImage: `url(${texture})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          filter: `url(#${filterId}) saturate(1.3)`,
          transform: decorated ? `rotate(${rotation}deg)` : undefined,
          boxShadow: decorated
            ? "3px 6px 12px rgba(0,0,0,0.35), 1px 2px 4px rgba(0,0,0,0.2)"
            : undefined,
          borderRadius: 0,
          padding: "1.2rem 1.4rem 1.4rem",
          display: "flex",
          flexDirection: "column",
          gap: "0.55rem",
          color: "#1a1008",
          position: "relative",
          isolation: "isolate",
        }}
      >
        {/* Overlay to lift text contrast over busy textures */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            backgroundColor: "rgba(255,250,240,0.48)",
            pointerEvents: "none",
          }}
        />

        {/* ── Header ── */}
        <div style={{ position: "relative" }}>
          {/* Discipline */}
          <span
            style={{
              fontFamily: 'var(--font-special-elite), "Courier New", monospace',
              fontSize: "0.65rem",
              textTransform: "uppercase",
              letterSpacing: "0.16em",
              color: "#1a1008",
              opacity: 0.75,
            }}
          >
            {project.discipline}
          </span>

          {/* Looking for — tags row */}
          {project.positionsNeeded.length > 0 && (
            <div style={{ marginTop: "0.45rem", display: "flex", flexWrap: "wrap", gap: "0.28rem", alignItems: "center" }}>
              <span
                style={{
                  fontFamily: 'var(--font-special-elite), "Courier New", monospace',
                  fontSize: "0.6rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.13em",
                  color: "#1a1008",
                  opacity: 0.6,
                  marginRight: "0.1rem",
                  flexShrink: 0,
                }}
              >
                Looking for:
              </span>
              {project.positionsNeeded.map((pos) => (
                <span
                  key={pos}
                  style={{
                    fontFamily: 'var(--font-special-elite), "Courier New", monospace',
                    padding: "0.18rem 0.5rem",
                    fontSize: "0.62rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.07em",
                    color: "#1a1008",
                    border: "1.5px solid rgba(26,16,8,0.45)",
                    backgroundColor: "rgba(26,16,8,0.1)",
                  }}
                >
                  {pos}
                </span>
              ))}
            </div>
          )}

          {/* Divider */}
          <div
            style={{
              marginTop: "0.6rem",
              borderTop: "1.5px solid rgba(26,16,8,0.3)",
            }}
          />
        </div>

        {/* ── Body ── */}
        <div style={{ position: "relative", display: "flex", flexDirection: "column", gap: "0.4rem" }}>
          {/* Title */}
          <h3
            style={{
              fontFamily: 'var(--font-special-elite), "Courier New", monospace',
              fontSize: "1.1rem",
              fontWeight: 700,
              lineHeight: 1.2,
              textTransform: "uppercase",
              letterSpacing: "0.02em",
              color: "#1a1008",
            }}
          >
            {project.title}
          </h3>

          {/* Creator */}
          <p
            style={{
              fontFamily: 'var(--font-special-elite), "Courier New", monospace',
              fontSize: "0.68rem",
              textTransform: "uppercase",
              letterSpacing: "0.12em",
              color: "#1a1008",
              opacity: 0.7,
            }}
          >
            {project.creatorName}
          </p>

          {/* Description */}
          <p
            className="line-clamp-4"
            style={{
              fontFamily: 'var(--font-special-elite), "Courier New", monospace',
              fontSize: "0.82rem",
              lineHeight: 1.6,
              color: "#1a1008",
              opacity: 0.9,
              marginTop: "0.1rem",
            }}
          >
            {project.description}
          </p>
        </div>
      </div>
    </>
  );
}
