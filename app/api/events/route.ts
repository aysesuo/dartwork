import type { NextRequest } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { verifyDartmouth } from "@/lib/verify-dartmouth";
import { sanitize } from "@/lib/sanitize";
import { DISCIPLINES } from "@/lib/disciplines";

// ── In-memory rate limit: max 3 event posts per 24 h per UID ─────────────────
// (Firestore-based counting would need a composite index; this is simpler and
//  sufficient for low-volume event creation.)
const postCounts = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(uid: string): boolean {
  const now = Date.now();
  const entry = postCounts.get(uid);
  if (!entry || now > entry.resetAt) {
    postCounts.set(uid, { count: 1, resetAt: now + 24 * 60 * 60 * 1000 });
    return true;
  }
  if (entry.count >= 3) return false;
  entry.count++;
  return true;
}

// ── GET — upcoming events (future + last 24 h) ───────────────────────────────
export async function GET(request: NextRequest) {
  const auth = await verifyDartmouth(request);
  if ("error" in auth) return auth.error;

  const snap = await adminDb
    .collection("events")
    .orderBy("dateTime", "asc")
    .get();

  // Include events whose start time is within the last 24 hours or in the future
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const events = snap.docs
    .filter((doc) => doc.data().dateTime >= cutoff)
    .map((doc) => {
      const d = doc.data();
      return {
        id:             doc.id,
        title:          d.title,
        organizer:      d.creatorName,
        organizerEmail: null,        // never expose creator email
        location:       d.location,
        dateTime:       d.dateTime,
        endDateTime:    d.endDateTime ?? null,
        description:    d.description,
        disciplines:    (d.disciplines as string[]) ?? [],
        imageUrl:       d.imageUrl ?? null,
        creatorUid:     d.creatorUid, // returned so the UI can show owner controls
      };
    });

  return Response.json(events);
}

// ── POST — create an event ────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  const auth = await verifyDartmouth(request);
  if ("error" in auth) return auth.error;

  if (!checkRateLimit(auth.callerUid)) {
    return Response.json(
      { error: "Too many events posted. Please wait 24 hours before posting again." },
      { status: 429 },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // ── Extract raw values ────────────────────────────────────────────────────
  const titleRaw    = typeof body.title       === "string" ? body.title.trim()       : "";
  const descRaw     = typeof body.description === "string" ? body.description.trim() : "";
  const locationRaw = typeof body.location    === "string" ? body.location.trim()    : "";
  const dateTime    = typeof body.dateTime    === "string" ? body.dateTime.trim()    : "";
  const endDateTime =
    typeof body.endDateTime === "string" && body.endDateTime.trim()
      ? body.endDateTime.trim()
      : null;
  const imageUrlRaw = typeof body.imageUrl === "string" ? body.imageUrl.trim() : "";

  // ── Length validation ─────────────────────────────────────────────────────
  if (!titleRaw)
    return Response.json({ error: "Title is required" }, { status: 400 });
  if (titleRaw.length > 150)
    return Response.json({ error: "Title must be 150 characters or fewer" }, { status: 400 });

  if (descRaw.length < 10)
    return Response.json({ error: "Description must be at least 10 characters" }, { status: 400 });
  if (descRaw.length > 1000)
    return Response.json({ error: "Description must be 1000 characters or fewer" }, { status: 400 });

  if (!locationRaw)
    return Response.json({ error: "Location is required" }, { status: 400 });
  if (locationRaw.length > 200)
    return Response.json({ error: "Location must be 200 characters or fewer" }, { status: 400 });

  if (!dateTime)
    return Response.json({ error: "Date and time are required" }, { status: 400 });
  if (isNaN(new Date(dateTime).getTime()))
    return Response.json({ error: "Invalid date/time" }, { status: 400 });

  if (imageUrlRaw.length > 500)
    return Response.json({ error: "Image URL must be 500 characters or fewer" }, { status: 400 });

  // ── URL validation ────────────────────────────────────────────────────────
  let imageUrl: string | null = null;
  if (imageUrlRaw) {
    if (!/^https?:\/\/.+/.test(imageUrlRaw)) {
      return Response.json(
        { error: "Image URL must start with https://" },
        { status: 400 },
      );
    }
    imageUrl = imageUrlRaw;
  }

  // ── Disciplines allowlist ─────────────────────────────────────────────────
  const disciplines: string[] = Array.isArray(body.disciplines)
    ? (body.disciplines as unknown[]).filter(
        (d): d is string => typeof d === "string" && DISCIPLINES.includes(d as never),
      )
    : [];

  // ── Sanitise text fields ──────────────────────────────────────────────────
  const title       = sanitize(titleRaw);
  const description = sanitize(descRaw);
  const location    = sanitize(locationRaw);

  // ── Write to Firestore ────────────────────────────────────────────────────
  // creatorUid/creatorEmail always come from the verified token — never the body
  const now = new Date().toISOString();
  const doc = {
    title,
    description,
    location,
    dateTime,
    endDateTime,
    disciplines,
    imageUrl,
    creatorUid:   auth.callerUid,
    creatorName:  auth.displayName,
    creatorEmail: auth.callerEmail, // stored server-side only, never returned in GET
    createdAt:    now,
  };

  const ref = await adminDb.collection("events").add(doc);
  return Response.json({ ok: true, id: ref.id }, { status: 201 });
}
