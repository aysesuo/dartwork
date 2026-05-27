import type { NextRequest } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { verifyDartmouth } from "@/lib/verify-dartmouth";

const ADMIN_UID = process.env.ADMIN_UID; // server-only, never exposed to client

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyDartmouth(request);
  if ("error" in auth) return auth.error;

  // Only the admin may delete any project
  if (!ADMIN_UID || auth.callerUid !== ADMIN_UID) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  if (!id) return Response.json({ error: "Missing project id" }, { status: 400 });

  const ref = adminDb.collection("projects").doc(id);
  const snap = await ref.get();
  if (!snap.exists) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  await ref.delete();
  return Response.json({ ok: true });
}
