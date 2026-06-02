// Time commitment a project asks of collaborators. Drives the paper colour of
// each card on the projects board and a filter section.
export const COMMITMENTS = ["Term-long", "Year-long", "Short term"];

// Paper texture per commitment: term-long → blue, year-long → pink, short term
// → yellow. Two variants each so adjacent same-commitment cards differ.
export const COMMITMENT_TEXTURES: Record<string, [string, string]> = {
  "Term-long":  ["/textures/paper-blue.jpg",   "/textures/paper-blue-2.jpg"],
  "Year-long":  ["/textures/paper-red.jpg",    "/textures/paper-red-2.jpg"],
  "Short term": ["/textures/paper-yellow.jpg", "/textures/paper-yellow-2.jpg"],
};

// Fallback colour rotation for projects with no commitment set, so every card
// still gets a coloured paper (never the plain crumpled page).
export const PAPER_TEXTURES = [
  "/textures/paper-red.jpg",
  "/textures/paper-yellow.jpg",
  "/textures/paper-blue.jpg",
  "/textures/paper-red-2.jpg",
  "/textures/paper-yellow-2.jpg",
  "/textures/paper-blue-2.jpg",
];

// The coloured paper a project shows on the board card — and, so they match,
// on its detail side-sheet. Commitment drives the colour; otherwise the card's
// board index picks from the rotation.
export function projectPaperTexture(
  commitment: string | null | undefined,
  index: number,
): string {
  const ct = commitment ? COMMITMENT_TEXTURES[commitment] : null;
  return ct
    ? ct[index % ct.length]
    : PAPER_TEXTURES[index % PAPER_TEXTURES.length];
}
