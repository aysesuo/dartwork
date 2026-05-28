/**
 * POST /api/notify
 * Internal endpoint for sending application email notifications.
 * Requires a valid Dartmouth Bearer token.
 * Body shape matches ApplicationNotifyPayload from lib/notify.ts.
 */
import type { NextRequest } from "next/server";
import { verifyDartmouth } from "@/lib/verify-dartmouth";
import { notifyApplicationReceived, type ApplicationNotifyPayload } from "@/lib/notify";

export async function POST(request: NextRequest) {
  const auth = await verifyDartmouth(request);
  if ("error" in auth) return auth.error;

  let body: ApplicationNotifyPayload;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.ownerEmail || !body.projectTitle || !body.roleName) {
    return Response.json({ error: "Missing required fields" }, { status: 400 });
  }

  try {
    await notifyApplicationReceived(body);
    return Response.json({ ok: true });
  } catch (err) {
    console.error("Notify error:", err);
    return Response.json({ error: "Failed to send notification" }, { status: 500 });
  }
}
