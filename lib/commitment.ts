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
