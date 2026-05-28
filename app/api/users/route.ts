import type { NextRequest } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { verifyDartmouth } from "@/lib/verify-dartmouth";

/**
 * GET /api/users
 * Returns all public, onboarded user profiles.
 * - Requires a valid Dartmouth Bearer token.
 * - Excludes profiles where isPrivate === true.
 *   Filtering happens in JS (not Firestore) so docs that lack the field
 *   (treated as public) are correctly included without a composite index.
 * - Never returns the email field.
 */
export async function GET(request: NextRequest) {
  const auth = await verifyDartmouth(request);
  if ("error" in auth) return auth.error;

  // Single-field query — no composite index needed.
  // onboardingComplete guards against half-filled profiles.
  const snap = await adminDb
    .collection("users")
    .where("onboardingComplete", "==", true)
    .get();

  const people = snap.docs
    .filter((doc) => doc.data().isPrivate !== true)
    .map((doc) => {
      const d = doc.data();
      // concentration makes a useful searchable "skill" proxy
      const skills: string[] = d.concentration
        ? [d.concentration as string]
        : [];
      return {
        id:           doc.id,
        name:         (d.displayName as string) ?? "",
        disciplines:  (d.disciplines as string[]) ?? [],
        skills,
        bio:          (d.bio as string) ?? "",
        contactEmail: null,   // never expose — always null in public listing
        portfolioUrl: null,   // not collected in profile yet
      };
    })
    .filter((p) => p.name.length > 0); // safety: drop nameless docs

  return Response.json(people);
}
