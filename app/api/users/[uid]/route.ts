import type { NextRequest } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";

const DARTMOUTH_RE = /^[^@]+@dartmouth\.edu$/i;

// Verifies token is valid + Dartmouth. Returns caller uid & email, or an error Response.
async function verifyDartmouth(
  request: NextRequest
): Promise<{ error: Response } | { callerUid: string; callerEmail: string }> {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return { error: Response.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  let decoded;
  try {
    decoded = await adminAuth.verifyIdToken(authHeader.slice(7));
  } catch {
    return { error: Response.json({ error: "Invalid token" }, { status: 401 }) };
  }
  const callerEmail = decoded.email ?? "";
  if (!DARTMOUTH_RE.test(callerEmail)) {
    return { error: Response.json({ error: "Only Dartmouth accounts are permitted" }, { status: 403 }) };
  }
  return { callerUid: decoded.uid, callerEmail };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ uid: string }> }
) {
  const { uid } = await params;
  const auth = await verifyDartmouth(request);
  if ("error" in auth) return auth.error;

  const snap = await adminDb.collection("users").doc(uid).get();
  if (!snap.exists) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const data = snap.data()!;
  const isOwner = auth.callerUid === uid;

  // Private profiles: only visible to owner or authorizedViewers
  if (data.isPrivate && !isOwner) {
    const viewers: string[] = data.authorizedViewers ?? [];
    if (!viewers.includes(auth.callerEmail)) {
      return Response.json({ error: "This profile is private" }, { status: 403 });
    }
  }

  return Response.json({ uid, ...data });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ uid: string }> }
) {
  const { uid } = await params;
  const auth = await verifyDartmouth(request);
  if ("error" in auth) return auth.error;

  // Only the owner may write their own profile
  if (auth.callerUid !== uid) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const ALLOWED_FIELDS = new Set([
    "displayName",
    "gradYear",
    "concentration",
    "disciplines",
    "bio",
    "isPrivate",
    "authorizedViewers",
    "onboardingComplete",
    "createdAt",
  ]);

  const safe: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(body)) {
    if (ALLOWED_FIELDS.has(k)) safe[k] = v;
  }
  safe.email = auth.callerEmail;

  await adminDb.collection("users").doc(uid).set(safe, { merge: true });
  return Response.json({ ok: true });
}
