/**
 * Strip all HTML and dangerous patterns from a user-supplied string.
 *
 * Pure regex — no external dependencies, works in any Node.js or browser
 * environment without ESM/jsdom issues. Sufficient for plain-text fields
 * (names, bios, titles, descriptions) where no HTML is ever wanted.
 *
 * Steps:
 *  1. Remove every HTML tag  e.g. <script>, <img onerror=…>, </div>
 *  2. Remove javascript: protocol  e.g. javascript:alert(1)
 *  3. Remove on* event attributes  e.g. onclick=, onload =
 *  4. Trim surrounding whitespace
 */
export function sanitize(dirty: string): string {
  return dirty
    .replace(/<[^>]*>/g, "")           // strip all HTML tags
    .replace(/javascript:/gi, "")      // strip javascript: URIs
    .replace(/on\w+\s*=/gi, "")        // strip on* event handlers
    .trim();
}
