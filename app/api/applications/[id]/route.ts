import type { NextRequest } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase-admin";
import { verifyDartmouth } from "@/lib/verify-dartmouth";

// ── PATCH — accept / reject an application (project owner only) ────────────────
// Accepting adds the applicant to the project's members (so it appears on their
// profile projects tab), bumps the team size, and removes the filled role from
// the project's "looking for" list so no one else can apply for it.
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await verifyDartmouth(request);
  if ("error" in auth) return auth.error;

  const { id } = await params;
  if (!id) return Response.json({ error: "Missing application id" }, { status: 400 });

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const status = body.status;
  if (status !== "accepted" && status !== "rejected")
    return Response.json({ error: "status must be 'accepted' or 'rejected'" }, { status: 400 });

  const appRef  = adminDb.collection("applications").doc(id);
  const appSnap = await appRef.get();
  if (!appSnap.exists) return Response.json({ error: "Application not found" }, { status: 404 });

  const app = appSnap.data()!;

  // Only the project owner (recipient of the application) may decide on it
  if (app.ownerUid !== auth.callerUid)
    return Response.json({ error: "Forbidden" }, { status: 403 });

  // Decline — just flag the application
  if (status === "rejected") {
    await appRef.update({ status: "rejected" });
    return Response.json({ ok: true, status: "rejected" });
  }

  // Accept — idempotent: only mutate the project the first time it's accepted
  if (app.status !== "accepted") {
    const projectRef  = adminDb.collection("projects").doc(app.projectId);
    const projectSnap = await projectRef.get();
    if (projectSnap.exists) {
      const role = typeof app.roleAppliedFor === "string" ? app.roleAppliedFor : "";
      await projectRef.update({
        memberUids:      FieldValue.arrayUnion(app.applicantUid),
        teamSize:        FieldValue.increment(1),
        ...(role
          ? {
              positionsNeeded: FieldValue.arrayRemove(role),
              tags:            FieldValue.arrayRemove(role),
            }
          : {}),
      });
    }
  }

  await appRef.update({ status: "accepted" });
  return Response.json({ ok: true, status: "accepted" });
}
