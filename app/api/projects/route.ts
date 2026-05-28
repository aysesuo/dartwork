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
// Optional query param: ?uid=<creatorUid>  → returns only that user's
// projects where showOnProfile === true
export async function GET(request: NextRequest) {
  const auth = await verifyDartmouth(request);
  if ("error" in auth) return auth.error;

  const { searchParams } = new URL(request.url);
  const filterUid = searchParams.get("uid");

  let query: FirebaseFirestore.Query = adminDb
    .collection("projects")
    .orderBy("createdAt", "desc");

  if (filterUid) {
    // where-only query — no orderBy so no composite index needed
    query = adminDb
      .collection("projects")
      .where("creatorUid", "==", filterUid);
  }

  const snap = await query.get();

  let docs = snap.docs;

  if (filterUid) {
    const isOwner = filterUid === auth.callerUid;
    if (isOwner) {
      // Owner sees ALL their own projects (including hidden and closed)
      docs = docs.sort(
        (a, b) => (b.data().createdAt ?? "").localeCompare(a.data().createdAt ?? ""),
      );
    } else {
      // Non-owner: only public, active projects on their profile
      docs = docs
        .filter(
          (doc) =>
            doc.data().showOnProfile === true &&
            doc.data().status !== "closed",
        )
        .sort((a, b) => (b.data().createdAt ?? "").localeCompare(a.data().createdAt ?? ""));
    }
  } else {
    // Global board: hide closed projects (no composite index needed — filter in JS)
    docs = docs.filter((doc) => doc.data().status !== "closed");
  }

  const projects = docs.map((doc) => {
    const d       = doc.data();
    const isOwner = filterUid === auth.callerUid;
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
      status:          d.status ?? "active",
      // showOnProfile only exposed to the owner
      ...(isOwner ? { showOnProfile: d.showOnProfile ?? true } : {}),
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
