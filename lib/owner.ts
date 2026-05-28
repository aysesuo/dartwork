/**
 * Emails that are allowed to use dArtwork regardless of domain.
 * These bypass the @dartmouth.edu requirement on both client and server.
 */
export const OWNER_EMAILS = new Set([
  "aysesuozdogan@gmail.com",
]);

export function isAllowedEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return OWNER_EMAILS.has(email.toLowerCase());
}
