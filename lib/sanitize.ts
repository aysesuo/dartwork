import DOMPurify from "isomorphic-dompurify";

// Strip all HTML — returns plain text only. Use on every user-supplied string before render.
export function sanitize(dirty: string): string {
  return DOMPurify.sanitize(dirty, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
}
