import type { NextRequest } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase-admin";
import { verifyDartmouth } from "@/lib/verify-dartmouth";

// ── PATCH — applicant toggles whether an accepted project shows on their profile.
// onProfile=false removes the caller from the project's members; true re-adds them.
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await verifyDartmouth(request);
  if ("error" in auth) return auth.error;

  const { id } = await params;
  if (!id) return Response.json({ error: "Missing notification id" }, { status: 400 });

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (typeof body.onProfile !== "boolean")
    return Response.json({ error: "onProfile must be a boolean" }, { status: 400 });
  const onProfile = body.onProfile;

  const notifRef  = adminDb.collection("notifications").doc(id);
  const notifSnap = await notifRef.get();
  if (!notifSnap.exists) return Response.json({ error: "Not found" }, { status: 404 });

  const notif = notifSnap.data()!;

  // Only the recipient may act on their own notice
  if (notif.recipientUid !== auth.callerUid)
    return Response.json({ error: "Forbidden" }, { status: 403 });
  if (notif.type !== "accepted")
    return Response.json({ error: "Only accepted notices can be added to a profile" }, { status: 400 });

  // Caller can only ever add/remove their own uid from the project's members
  if (notif.projectId) {
    await adminDb.collection("projects").doc(notif.projectId).update({
      memberUids: onProfile
        ? FieldValue.arrayUnion(auth.callerUid)
        : FieldValue.arrayRemove(auth.callerUid),
    });
  }

  await notifRef.update({ onProfile });
  return Response.json({ ok: true, onProfile });
}
