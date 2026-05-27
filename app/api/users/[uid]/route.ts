import type { NextRequest } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { verifyDartmouth } from "@/lib/verify-dartmouth";
import { DISCIPLINES } from "@/lib/disciplines";

const ADMIN_UID = process.env.ADMIN_UID;

const DARTMOUTH_RE = /^[^@]+@dartmouth\.edu$/i;

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

  // Always return a projected shape — never dump the raw Firestore document (HIGH-2)
  const publicFields = {
    uid,
    displayName:        data.displayName,
    gradYear:           data.gradYear,
    concentration:      data.concentration,
    disciplines:        data.disciplines,
    bio:                data.bio,
    isPrivate:          data.isPrivate,
    onboardingComplete: data.onboardingComplete,
  };

  // Only the owner receives their email, viewer list, and admin flag
  if (isOwner) {
    return Response.json({
      ...publicFields,
      email:             data.email,
      authorizedViewers: data.authorizedViewers ?? [],
      isAdmin:           ADMIN_UID ? auth.callerUid === ADMIN_UID : false,
    });
  }

  return Response.json(publicFields);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ uid: string }> }
) {
  const { uid } = await params;
  const auth = await verifyDartmouth(request);
  if ("error" in auth) return auth.error;

  if (auth.callerUid !== uid) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Strict allowlist — onboardingComplete and createdAt are server-controlled (MED-3, MED-4)
  const ALLOWED_FIELDS = new Set([
    "displayName",
    "gradYear",
    "concentration",
    "disciplines",
    "bio",
    "isPrivate",
    "authorizedViewers",
  ]);

  const safe: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(body)) {
    if (ALLOWED_FIELDS.has(k)) safe[k] = v;
  }

  // ── Field-level validation & sanitisation ─────────────────────────────────

  if ("displayName" in safe) {
    if (typeof safe.displayName !== "string" || safe.displayName.trim().length === 0)
      return Response.json({ error: "Display name must be a non-empty string" }, { status: 400 });
    safe.displayName = safe.displayName.trim().slice(0, 80);
  }

  if ("bio" in safe) {
    if (typeof safe.bio !== "string")
      return Response.json({ error: "Bio must be a string" }, { status: 400 });
    safe.bio = safe.bio.trim().slice(0, 400);
  }

  if ("concentration" in safe) {
    if (typeof safe.concentration !== "string")
      return Response.json({ error: "Concentration must be a string" }, { status: 400 });
    safe.concentration = safe.concentration.trim().slice(0, 80);
  }

  if ("gradYear" in safe) {
    const year = Number(safe.gradYear);
    const currentYear = new Date().getFullYear();
    if (!Number.isInteger(year) || year < currentYear - 1 || year > currentYear + 6)
      return Response.json({ error: "Invalid graduation year" }, { status: 400 });
    safe.gradYear = year;
  }

  // Validate disciplines against the allowlist (MED-5)
  if ("disciplines" in safe) {
    if (!Array.isArray(safe.disciplines))
      return Response.json({ error: "Disciplines must be an array" }, { status: 400 });
    safe.disciplines = (safe.disciplines as unknown[])
      .filter((d) => typeof d === "string" && DISCIPLINES.includes(d as never))
      .slice(0, 9);
  }

  // Validate authorizedViewers — must all be @dartmouth.edu (HIGH-6)
  if ("authorizedViewers" in safe) {
    if (!Array.isArray(safe.authorizedViewers))
      return Response.json({ error: "authorizedViewers must be an array" }, { status: 400 });
    safe.authorizedViewers = (safe.authorizedViewers as unknown[])
      .filter((v) => typeof v === "string" && DARTMOUTH_RE.test(v))
      .slice(0, 200);
  }

  // isPrivate must be boolean
  if ("isPrivate" in safe && typeof safe.isPrivate !== "boolean") {
    return Response.json({ error: "isPrivate must be a boolean" }, { status: 400 });
  }

  // Always stamp email from the verified token (not from body)
  safe.email = auth.callerEmail;

  // Set onboardingComplete server-side only when required fields are present (MED-3)
  // Merge with existing doc so we don't unset it if already complete
  const existing = await adminDb.collection("users").doc(uid).get();
  const existingData = existing.data() ?? {};

  const mergedDisplay = (safe.displayName ?? existingData.displayName ?? "").toString().trim();
  const mergedDiscs   = (safe.disciplines ?? existingData.disciplines ?? []) as string[];
  if (mergedDisplay.length > 0 && mergedDiscs.length > 0) {
    safe.onboardingComplete = true;
  }

  // Set createdAt server-side on first write only (MED-4)
  if (!existing.exists) {
    safe.createdAt = new Date().toISOString();
  }

  await adminDb.collection("users").doc(uid).set(safe, { merge: true });
  return Response.json({ ok: true });
}
