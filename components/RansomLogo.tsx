const RANSOM_LETTERS = [
  { ch: "D", r: "3.5deg",  bg: "#f3ead4", fg: "#20180f", font: "var(--font-anton)" },
  { ch: "A", r: "-5.8deg", bg: "#f0a6ad", fg: "#20180f", font: "var(--font-rye)" },
  { ch: "R", r: "2.8deg",  bg: "#e7cd5e", fg: "#20180f", font: "var(--font-special-elite)" },
  { ch: "T", r: "-1.1deg", bg: "#a0d3e7", fg: "#20180f", font: "var(--font-alfa)" },
  { ch: "W", r: "-2.5deg", bg: "#20180f", fg: "#f3ead4", font: "var(--font-stardos)" },
  { ch: "O", r: "-5.0deg", bg: "#f3ead4", fg: "#20180f", font: "var(--font-anton)" },
  { ch: "R", r: "-1.9deg", bg: "#e7cd5e", fg: "#20180f", font: "var(--font-rye)" },
  { ch: "K", r: "-4.9deg", bg: "#f0a6ad", fg: "#20180f", font: "var(--font-special-elite)" },
] as const;

export default function RansomLogo({ className = "" }: { className?: string }) {
  return (
    <span className={`logo logo--ransom ${className}`} aria-label="dArtwork">
      <span className="logo__line" aria-hidden="true">
        {RANSOM_LETTERS.map((l, i) => (
          <span
            key={i}
            className="rl"
            style={{ "--r": l.r, "--bg": l.bg, "--fg": l.fg, fontFamily: l.font } as React.CSSProperties}
          >
            {l.ch}
          </span>
        ))}
      </span>
    </span>
  );
}
