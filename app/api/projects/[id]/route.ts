import type { NextRequest } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { verifyDartmouth } from "@/lib/verify-dartmouth";
import { sanitize } from "@/lib/sanitize";
import { DISCIPLINES } from "@/lib/disciplines";

// ── GET — single project (creator or admin only, used by edit form) ───────────
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await verifyDartmouth(request);
  if ("error" in auth) return auth.error;

  const { id } = await params;
  if (!id) return Response.json({ error: "Missing project id" }, { status: 400 });

  const ref  = adminDb.collection("projects").doc(id);
  const snap = await ref.get();
  if (!snap.exists) return Response.json({ error: "Not found" }, { status: 404 });

  const d         = snap.data()!;
  const ADMIN_UID = process.env.ADMIN_UID;
  const isAdmin   = !!ADMIN_UID && auth.callerUid === ADMIN_UID;
  const isCreator = d.creatorUid === auth.callerUid;

  if (!isAdmin && !isCreator)
    return Response.json({ error: "Forbidden" }, { status: 403 });

  return Response.json({
    id,
    title:           d.title,
    description:     d.description,
    discipline:      d.discipline,
    positionsNeeded: d.positionsNeeded ?? [],
    tags:            d.tags ?? [],
    mediaUrl:        d.mediaUrl ?? null,
    showOnProfile:   d.showOnProfile ?? true,
    status:          d.status ?? "active",
    creatorUid:      d.creatorUid,
    datePosted:      d.datePosted,
  });
}

// ── DELETE — creator or admin only ────────────────────────────────────────────
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await verifyDartmouth(request);
  if ("error" in auth) return auth.error;

  const { id } = await params;
  if (!id) return Response.json({ error: "Missing project id" }, { status: 400 });

  const ref  = adminDb.collection("projects").doc(id);
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
// Handles: showOnProfile toggle, status (active/closed), and content edits.
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await verifyDartmouth(request);
  if ("error" in auth) return auth.error;

  const { id } = await params;
  if (!id) return Response.json({ error: "Missing project id" }, { status: 400 });

  const ref  = adminDb.collection("projects").doc(id);
  const snap = await ref.get();
  if (!snap.exists) return Response.json({ error: "Not found" }, { status: 404 });

  // Only the creator may patch — admin uses DELETE, not PATCH
  if (snap.data()?.creatorUid !== auth.callerUid)
    return Response.json({ error: "Forbidden" }, { status: 403 });

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const safe: Record<string, unknown> = {};

  // ── Boolean flags ─────────────────────────────────────────────────────────
  if ("showOnProfile" in body) {
    if (typeof body.showOnProfile !== "boolean")
      return Response.json({ error: "showOnProfile must be a boolean" }, { status: 400 });
    safe.showOnProfile = body.showOnProfile;
  }

  if ("status" in body) {
    if (body.status !== "active" && body.status !== "closed")
      return Response.json({ error: "status must be 'active' or 'closed'" }, { status: 400 });
    safe.status = body.status;
  }

  // ── Content edits ─────────────────────────────────────────────────────────
  if ("title" in body) {
    const v = typeof body.title === "string" ? sanitize(body.title.trim()) : "";
    if (!v)             return Response.json({ error: "Title is required" }, { status: 400 });
    if (v.length > 120) return Response.json({ error: "Title must be 120 characters or fewer" }, { status: 400 });
    safe.title = v;
  }

  if ("description" in body) {
    const v = typeof body.description === "string" ? sanitize(body.description.trim()) : "";
    if (v.length < 10)   return Response.json({ error: "Description must be at least 10 characters" }, { status: 400 });
    if (v.length > 1200) return Response.json({ error: "Description must be 1200 characters or fewer" }, { status: 400 });
    safe.description = v;
  }

  if ("discipline" in body) {
    if (!DISCIPLINES.includes(body.discipline as never))
      return Response.json({ error: "Invalid discipline" }, { status: 400 });
    safe.discipline = body.discipline;
  }

  if ("rolesNeeded" in body) {
    const raw = typeof body.rolesNeeded === "string" ? body.rolesNeeded : "";
    if (raw.length > 400) return Response.json({ error: "Roles field must be 400 characters or fewer" }, { status: 400 });
    const positions = raw
      .split(/[\n,]+/)
      .map((r: string) => sanitize(r.trim().slice(0, 60)))
      .filter(Boolean)
      .slice(0, 20);
    safe.positionsNeeded = positions;
    safe.tags            = positions;
  }

  if ("mediaUrl" in body) {
    const v = typeof body.mediaUrl === "string" ? body.mediaUrl.trim() : "";
    if (v && v.length > 500)
      return Response.json({ error: "Media URL must be 500 characters or fewer" }, { status: 400 });
    if (v) {
      try {
        const u = new URL(v);
        if (u.protocol !== "https:" && u.protocol !== "http:")
          return Response.json({ error: "Media URL must use http or https" }, { status: 400 });
      } catch {
        return Response.json({ error: "Media URL is not a valid URL" }, { status: 400 });
      }
    }
    safe.mediaUrl = v || null;
  }

  if (Object.keys(safe).length === 0)
    return Response.json({ error: "Nothing to update" }, { status: 400 });

  await ref.update(safe);
  return Response.json({ ok: true });
}
