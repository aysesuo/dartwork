"use client";

const CARD_TEXTURE = "/textures/pixelbuddha-studio-Ng5onpi5iRQ-unsplash.jpg";

interface Props {
  disciplines: string[];
  tags: string[];
  roles: string[];
  selectedDisciplines: Set<string>;
  selectedTags: Set<string>;
  selectedRoles: Set<string>;
  onToggleDiscipline: (v: string) => void;
  onToggleTag: (v: string) => void;
  onToggleRole: (v: string) => void;
  onClearAll: () => void;
}

const INK = "#1a1008";

function CheckRow({
  label,
  checked,
  onToggle,
}: {
  label: string;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.45rem",
        background: "none",
        border: "none",
        cursor: "pointer",
        padding: "0.1rem 0",
        width: "100%",
        textAlign: "left",
      }}
    >
      {/* Hand-drawn checkbox */}
      <span
        style={{
          flexShrink: 0,
          width: 13,
          height: 13,
          border: `1.5px solid rgba(26,16,8,${checked ? "0.8" : "0.4"})`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: checked ? "rgba(26,16,8,0.12)" : "transparent",
          transition: "background 0.15s",
        }}
        aria-hidden="true"
      >
        {checked && (
          <span style={{ fontSize: 9, color: INK, lineHeight: 1, marginTop: -1 }}>
            ✓
          </span>
        )}
      </span>
      <span
        style={{
          fontFamily: 'var(--font-special-elite), "Courier New", monospace',
          fontSize: "0.62rem",
          color: INK,
          opacity: checked ? 0.95 : 0.65,
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          lineHeight: 1.3,
          fontWeight: checked ? 700 : 400,
        }}
      >
        {label}
      </span>
    </button>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: "0.7rem" }}>
      <p
        style={{
          fontFamily: 'var(--font-special-elite), "Courier New", monospace',
          fontSize: "0.55rem",
          textTransform: "uppercase",
          letterSpacing: "0.18em",
          color: INK,
          opacity: 0.45,
          marginBottom: "0.3rem",
          borderBottom: "1px solid rgba(26,16,8,0.18)",
          paddingBottom: "0.15rem",
        }}
      >
        {title}
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.05rem" }}>
        {children}
      </div>
    </div>
  );
}

export default function IndexCardFilter({
  disciplines,
  tags,
  roles,
  selectedDisciplines,
  selectedTags,
  selectedRoles,
  onToggleDiscipline,
  onToggleTag,
  onToggleRole,
  onClearAll,
}: Props) {
  const hasAny =
    selectedDisciplines.size > 0 ||
    selectedTags.size > 0 ||
    selectedRoles.size > 0;

  return (
    <div
      style={{
        position: "absolute",
        top: -65,
        left: -98,
        zIndex: 50,
        width: 220,
        // Index-card look
        backgroundImage: `url(${CARD_TEXTURE})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        padding: "1.1rem 1.1rem 1rem",
        transform: "rotate(-1.4deg)",
        boxShadow:
          "3px 6px 14px rgba(0,0,0,0.38), 1px 2px 4px rgba(0,0,0,0.2)",
        borderRadius: 0,
        // Ruled-paper lines via repeating-linear-gradient
        backgroundBlendMode: "multiply",
      }}
    >
      {/* Pin */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/textures/pin-red-pinned.png"
        alt=""
        aria-hidden="true"
        draggable={false}
        style={{
          position:      "absolute",
          top:           -22,
          left:          "50%",
          transform:     "translateX(-50%)",
          width:         80,
          height:        80,
          objectFit:     "contain",
          pointerEvents: "none",
          userSelect:    "none",
          filter:        "drop-shadow(0 2px 5px rgba(0,0,0,0.5))",
        }}
      />

      {/* Card ruled lines overlay */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "repeating-linear-gradient(transparent, transparent 22px, rgba(26,16,8,0.07) 22px, rgba(26,16,8,0.07) 23px)",
          backgroundPositionY: "36px",
          pointerEvents: "none",
        }}
      />

      {/* Title */}
      <p
        style={{
          fontFamily: 'var(--font-special-elite), "Courier New", monospace',
          fontSize: "0.8rem",
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.18em",
          color: INK,
          marginBottom: "0.6rem",
          position: "relative",
        }}
      >
        Filter
      </p>

      {/* Sections */}
      <div style={{ position: "relative" }}>
        <Section title="Interest Area">
          {disciplines.map((d) => (
            <CheckRow
              key={d}
              label={d}
              checked={selectedDisciplines.has(d)}
              onToggle={() => onToggleDiscipline(d)}
            />
          ))}
        </Section>

        <Section title="Role Type">
          {roles.map((r) => (
            <CheckRow
              key={r}
              label={r}
              checked={selectedRoles.has(r)}
              onToggle={() => onToggleRole(r)}
            />
          ))}
        </Section>

        <Section title="Skill Tags">
          {tags.map((t) => (
            <CheckRow
              key={t}
              label={t}
              checked={selectedTags.has(t)}
              onToggle={() => onToggleTag(t)}
            />
          ))}
        </Section>
      </div>

      {/* Clear all */}
      {hasAny && (
        <button
          onClick={onClearAll}
          style={{
            position: "relative",
            marginTop: "0.5rem",
            background: "none",
            border: "none",
            cursor: "pointer",
            fontFamily: 'var(--font-special-elite), "Courier New", monospace',
            fontSize: "0.55rem",
            textTransform: "uppercase",
            letterSpacing: "0.14em",
            color: INK,
            opacity: 0.5,
            textDecoration: "underline",
            padding: 0,
          }}
        >
          clear all
        </button>
      )}
    </div>
  );
}
