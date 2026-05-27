/**
 * Shared server-side token verification for Next.js API routes.
 * - Validates Bearer token signature
 * - Requires @dartmouth.edu email
 * - Requires email_verified (MED-2)
 * - Checks token revocation (LOW-2)
 */
import type { NextRequest } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";

const DARTMOUTH_RE = /^[^@]+@dartmouth\.edu$/i;

export type VerifyResult =
  | { error: Response }
  | { callerUid: string; callerEmail: string; displayName: string };

export async function verifyDartmouth(request: NextRequest): Promise<VerifyResult> {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return { error: Response.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  let decoded;
  try {
    // checkRevoked: true ensures disabled/deleted accounts are rejected immediately
    decoded = await adminAuth.verifyIdToken(authHeader.slice(7), true);
  } catch (err: unknown) {
    const code = (err as { code?: string }).code;
    if (code === "auth/id-token-revoked" || code === "auth/user-disabled") {
      return { error: Response.json({ error: "Account revoked" }, { status: 401 }) };
    }
    return { error: Response.json({ error: "Invalid token" }, { status: 401 }) };
  }

  const callerEmail = decoded.email ?? "";
  if (!DARTMOUTH_RE.test(callerEmail)) {
    return { error: Response.json({ error: "Only Dartmouth accounts are permitted" }, { status: 403 }) };
  }

  // Require verified email — unverified accounts cannot call any API (MED-2)
  if (!decoded.email_verified) {
    return { error: Response.json({ error: "Email address not verified" }, { status: 403 }) };
  }

  return {
    callerUid:   decoded.uid,
    callerEmail,
    displayName: decoded.name ?? callerEmail.split("@")[0],
  };
}
