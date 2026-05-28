import type { NextRequest } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { verifyDartmouth } from "@/lib/verify-dartmouth";
import { sanitize } from "@/lib/sanitize";
import { DISCIPLINES } from "@/lib/disciplines";

// ── DELETE — creator or admin only ────────────────────────────────────────────
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await verifyDartmouth(request);
  if ("error" in auth) return auth.error;

  const { id } = await params;
  if (!id) return Response.json({ error: "Missing event id" }, { status: 400 });

  const ref  = adminDb.collection("events").doc(id);
  const snap = await ref.get();
  if (!snap.exists) return Response.json({ error: "Not found" }, { status: 404 });

  const ADMIN_UID = process.env.ADMIN_UID;
  const isAdmin   = !!ADMIN_UID && auth.callerUid === ADMIN_UID;
  const isCreator = snap.data()?.creatorUid === auth.callerUid;

  if (!isAdmin && !isCreator)
    return Response.json({ error: "Forbidden" }, { status: 403 });

  await ref.delete();
  return Response.json({ ok: true });
}

// ── PATCH — creator only ──────────────────────────────────────────────────────
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await verifyDartmouth(request);
  if ("error" in auth) return auth.error;

  const { id } = await params;
  if (!id) return Response.json({ error: "Missing event id" }, { status: 400 });

  const ref  = adminDb.collection("events").doc(id);
  const snap = await ref.get();
  if (!snap.exists) return Response.json({ error: "Not found" }, { status: 404 });

  // Only the creator may edit (admin may delete, not edit)
  if (snap.data()?.creatorUid !== auth.callerUid)
    return Response.json({ error: "Forbidden" }, { status: 403 });

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const safe: Record<string, unknown> = {};

  if ("title" in body) {
    const v = typeof body.title === "string" ? body.title.trim() : "";
    if (!v)          return Response.json({ error: "Title is required" }, { status: 400 });
    if (v.length > 150) return Response.json({ error: "Title must be 150 characters or fewer" }, { status: 400 });
    safe.title = sanitize(v);
  }

  if ("description" in body) {
    const v = typeof body.description === "string" ? body.description.trim() : "";
    if (v.length < 10)   return Response.json({ error: "Description must be at least 10 characters" }, { status: 400 });
    if (v.length > 1000) return Response.json({ error: "Description must be 1000 characters or fewer" }, { status: 400 });
    safe.description = sanitize(v);
  }

  if ("location" in body) {
    const v = typeof body.location === "string" ? body.location.trim() : "";
    if (!v)          return Response.json({ error: "Location is required" }, { status: 400 });
    if (v.length > 200) return Response.json({ error: "Location must be 200 characters or fewer" }, { status: 400 });
    safe.location = sanitize(v);
  }

  if ("dateTime" in body) {
    const v = typeof body.dateTime === "string" ? body.dateTime.trim() : "";
    if (!v || isNaN(new Date(v).getTime()))
      return Response.json({ error: "Invalid date/time" }, { status: 400 });
    safe.dateTime = v;
  }

  if ("endDateTime" in body) {
    const v =
      typeof body.endDateTime === "string" && body.endDateTime.trim()
        ? body.endDateTime.trim()
        : null;
    if (v && isNaN(new Date(v).getTime()))
      return Response.json({ error: "Invalid end date/time" }, { status: 400 });
    safe.endDateTime = v;
  }

  if ("disciplines" in body) {
    safe.disciplines = Array.isArray(body.disciplines)
      ? (body.disciplines as unknown[]).filter(
          (d): d is string => typeof d === "string" && DISCIPLINES.includes(d as never),
        )
      : [];
  }

  if ("imageUrl" in body) {
    const v = typeof body.imageUrl === "string" ? body.imageUrl.trim() : "";
    if (v && v.length > 500)
      return Response.json({ error: "Image URL must be 500 characters or fewer" }, { status: 400 });
    if (v && !/^https?:\/\/.+/.test(v))
      return Response.json({ error: "Image URL must start with https://" }, { status: 400 });
    safe.imageUrl = v || null;
  }

  if (Object.keys(safe).length === 0)
    return Response.json({ error: "No valid fields to update" }, { status: 400 });

  await ref.update(safe);
  return Response.json({ ok: true });
}
