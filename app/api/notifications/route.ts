import type { NextRequest } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { verifyDartmouth } from "@/lib/verify-dartmouth";

// ── GET — decision notices addressed to the logged-in user ────────────────────
// These are the accept/reject outcomes for applications the user *sent*.
export async function GET(request: NextRequest) {
  const auth = await verifyDartmouth(request);
  if ("error" in auth) return auth.error;

  const snap = await adminDb
    .collection("notifications")
    .where("recipientUid", "==", auth.callerUid)
    .get();

  const notifications = snap.docs
    .map((doc) => {
      const d = doc.data();
      return {
        id:             doc.id,
        type:           d.type,
        projectId:      d.projectId,
        projectTitle:   d.projectTitle ?? "",
        roleAppliedFor: d.roleAppliedFor ?? "",
        onProfile:      d.onProfile ?? false,
        createdAt:      d.createdAt,
      };
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return Response.json(notifications);
}
