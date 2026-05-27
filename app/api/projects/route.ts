import type { NextRequest } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { DISCIPLINES } from "@/lib/disciplines";
import { verifyDartmouth } from "@/lib/verify-dartmouth";

// ── Simple in-memory rate limit: max 5 posts per 10 min per UID ──────────────
// Replace with Upstash Redis for multi-instance / production scale.
const postCounts = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(uid: string): boolean {
  const now = Date.now();
  const entry = postCounts.get(uid);
  if (!entry || now > entry.resetAt) {
    postCounts.set(uid, { count: 1, resetAt: now + 10 * 60 * 1000 });
    return true;
  }
  if (entry.count >= 5) return false;
  entry.count++;
  return true;
}

// ── GET — public-safe project list (no PII) ───────────────────────────────────
export async function GET(request: NextRequest) {
  const auth = await verifyDartmouth(request);
  if ("error" in auth) return auth.error;

  const snap = await adminDb
    .collection("projects")
    .orderBy("createdAt", "desc")
    .get();

  // Only return public-safe fields — creatorEmail is intentionally omitted (HIGH-1)
  const projects = snap.docs.map((doc) => {
    const d = doc.data();
    return {
      id:              doc.id,
      title:           d.title,
      description:     d.description,
      discipline:      d.discipline,
      positionsNeeded: d.positionsNeeded ?? [],
      tags:            d.tags ?? [],
      mediaUrl:        d.mediaUrl ?? null,
      creatorUid:      d.creatorUid,
      creatorName:     d.creatorName,
      datePosted:      d.datePosted,
    };
  });

  return Response.json(projects);
}

// ── POST — create project ─────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  const auth = await verifyDartmouth(request);
  if ("error" in auth) return auth.error;

  // Rate limit (HIGH-5)
  if (!checkRateLimit(auth.callerUid)) {
    return Response.json(
      { error: "Too many requests. Please wait before posting again." },
      { status: 429 }
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // ── Validate & sanitise fields ────────────────────────────────────────────
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const description = typeof body.description === "string" ? body.description.trim() : "";
  const discipline = typeof body.discipline === "string" ? body.discipline.trim() : "";
  const rolesRaw = typeof body.rolesNeeded === "string" ? body.rolesNeeded : "";
  const mediaUrlRaw = typeof body.mediaUrl === "string" ? body.mediaUrl.trim() : "";

  if (!title)
    return Response.json({ error: "Title is required" }, { status: 400 });
  if (title.length > 120)
    return Response.json({ error: "Title must be 120 characters or fewer" }, { status: 400 });

  if (description.length < 10)
    return Response.json({ error: "Description must be at least 10 characters" }, { status: 400 });
  if (description.length > 1200)
    return Response.json({ error: "Description must be 1200 characters or fewer" }, { status: 400 });

  if (!DISCIPLINES.includes(discipline as never))
    return Response.json({ error: "Invalid discipline" }, { status: 400 });

  if (rolesRaw.length > 400)
    return Response.json({ error: "Roles field must be 400 characters or fewer" }, { status: 400 });

  // Parse roles: split, trim, cap each item length and total count (MED-6)
  const positionsNeeded = rolesRaw
    .split(/[\n,]+/)
    .map((r: string) => r.trim().slice(0, 60))
    .filter(Boolean)
    .slice(0, 20);

  // Validate mediaUrl as http/https only (HIGH-4)
  let mediaUrl: string | null = null;
  if (mediaUrlRaw) {
    if (mediaUrlRaw.length > 500)
      return Response.json({ error: "Media URL must be 500 characters or fewer" }, { status: 400 });
    try {
      const u = new URL(mediaUrlRaw);
      if (u.protocol !== "https:" && u.protocol !== "http:")
        return Response.json({ error: "Media URL must use http or https" }, { status: 400 });
      mediaUrl = mediaUrlRaw;
    } catch {
      return Response.json({ error: "Media URL is not a valid URL" }, { status: 400 });
    }
  }

  // Strict boolean check — body.showOnProfile must be explicitly false to opt out (MED-7)
  const showOnProfile = body.showOnProfile !== false && body.showOnProfile !== 0;

  const now = new Date();

  const doc = {
    title,
    description,
    discipline,
    positionsNeeded,
    tags:         positionsNeeded,
    mediaUrl,
    showOnProfile,
    creatorUid:   auth.callerUid,
    creatorEmail: auth.callerEmail, // stored server-side only, never returned in GET
    creatorName:  auth.displayName,
    datePosted:   now.toISOString().slice(0, 10),
    createdAt:    now.toISOString(),
  };

  const ref = await adminDb.collection("projects").add(doc);
  return Response.json({ ok: true, id: ref.id }, { status: 201 });
}
