// The four elements a user can pick at onboarding. Drives the background image
// of their profile page.
export const ELEMENTS = ["earth", "fire", "air", "water"] as const;
export type Element = (typeof ELEMENTS)[number];

const ELEMENT_FILE: Record<Element, string> = {
  earth: "/textures/earth.jpg",
  fire:  "/textures/fire.jpg",
  air:   "/textures/air.avif",
  water: "/textures/water.jpg",
};

export function isElement(value: unknown): value is Element {
  return typeof value === "string" && (ELEMENTS as readonly string[]).includes(value);
}

// Profile-page background image for a stored element value, or null if unset.
export function elementBackground(element: string | null | undefined): string | null {
  return isElement(element) ? ELEMENT_FILE[element] : null;
}
