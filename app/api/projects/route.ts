import type { NextRequest } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { DISCIPLINES } from "@/lib/disciplines";

const DARTMOUTH_RE = /^[^@]+@dartmouth\.edu$/i;

async function verifyDartmouth(
  request: NextRequest
): Promise<{ error: Response } | { callerUid: string; callerEmail: string; displayName: string }> {
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
  return {
    callerUid: decoded.uid,
    callerEmail,
    displayName: decoded.name ?? callerEmail.split("@")[0],
  };
}

export async function POST(request: NextRequest) {
  const auth = await verifyDartmouth(request);
  if ("error" in auth) return auth.error;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Validate required fields
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const description = typeof body.description === "string" ? body.description.trim() : "";
  const discipline = typeof body.discipline === "string" ? body.discipline.trim() : "";

  if (!title) return Response.json({ error: "Title is required" }, { status: 400 });
  if (description.length < 10) return Response.json({ error: "Description must be at least 10 characters" }, { status: 400 });
  if (!DISCIPLINES.includes(discipline as never)) return Response.json({ error: "Invalid discipline" }, { status: 400 });

  // Parse roles textarea → array of trimmed non-empty strings
  const rolesRaw = typeof body.rolesNeeded === "string" ? body.rolesNeeded : "";
  const positionsNeeded = rolesRaw
    .split(/[\n,]+/)
    .map((r: string) => r.trim())
    .filter(Boolean);

  const mediaUrl =
    typeof body.mediaUrl === "string" && body.mediaUrl.trim()
      ? body.mediaUrl.trim()
      : null;

  const showOnProfile = body.showOnProfile !== false; // default true

  const now = new Date();
  const datePosted = now.toISOString().slice(0, 10);

  const doc = {
    title,
    description,
    discipline,
    positionsNeeded,
    tags: positionsNeeded, // mirror for filter compatibility
    mediaUrl,
    showOnProfile,
    creatorUid:   auth.callerUid,
    creatorEmail: auth.callerEmail,
    creatorName:  auth.displayName,
    datePosted,
    createdAt:    now.toISOString(),
  };

  const ref = await adminDb.collection("projects").add(doc);

  return Response.json({ ok: true, id: ref.id }, { status: 201 });
}
