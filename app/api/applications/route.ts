import type { NextRequest } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { verifyDartmouth } from "@/lib/verify-dartmouth";
import { sanitize } from "@/lib/sanitize";
import { notifyApplicationReceived } from "@/lib/notify";

export async function POST(request: NextRequest) {
  const auth = await verifyDartmouth(request);
  if ("error" in auth) return auth.error;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // ── Field extraction ──────────────────────────────────────────────────────
  const projectId      = typeof body.projectId      === "string" ? body.projectId.trim()      : "";
  const roleAppliedFor = typeof body.roleAppliedFor === "string" ? body.roleAppliedFor.trim() : "";
  const whyRaw         = typeof body.whyThisRole    === "string" ? body.whyThisRole.trim()    : "";
  const expRaw         = typeof body.experience     === "string" ? body.experience.trim()     : "";
  const portfolioRaw   = typeof body.portfolioLink  === "string" ? body.portfolioLink.trim()  : "";

  if (!projectId)      return Response.json({ error: "projectId is required" },      { status: 400 });
  if (!roleAppliedFor) return Response.json({ error: "roleAppliedFor is required" }, { status: 400 });
  if (!whyRaw)         return Response.json({ error: "whyThisRole is required" },    { status: 400 });

  // ── Sanitise free-text fields ─────────────────────────────────────────────
  const whyThisRole = sanitize(whyRaw);
  const experience  = sanitize(expRaw);

  if (whyThisRole.length < 50)
    return Response.json({ error: "whyThisRole must be at least 50 characters" }, { status: 400 });
  if (whyThisRole.length > 2000)
    return Response.json({ error: "whyThisRole must be 2000 characters or fewer" }, { status: 400 });
  if (experience.length > 1500)
    return Response.json({ error: "experience must be 1500 characters or fewer" }, { status: 400 });

  // ── Validate portfolio URL ────────────────────────────────────────────────
  let portfolioLink = "";
  if (portfolioRaw) {
    if (portfolioRaw.length > 500)
      return Response.json({ error: "Portfolio link must be 500 characters or fewer" }, { status: 400 });
    try {
      const u = new URL(portfolioRaw);
      if (u.protocol !== "https:" && u.protocol !== "http:")
        return Response.json({ error: "Portfolio link must use http or https" }, { status: 400 });
      portfolioLink = portfolioRaw;
    } catch {
      return Response.json({ error: "Portfolio link is not a valid URL" }, { status: 400 });
    }
  }

  // ── Fetch project — verify it exists & get creator UID + title ────────────
  const projectSnap = await adminDb.collection("projects").doc(projectId).get();
  if (!projectSnap.exists)
    return Response.json({ error: "Project not found" }, { status: 404 });

  const project = projectSnap.data()!;

  // ── Prevent self-application ──────────────────────────────────────────────
  if (project.creatorUid === auth.callerUid)
    return Response.json({ error: "You cannot apply to your own project" }, { status: 400 });

  // ── Prevent duplicate applications ───────────────────────────────────────
  const dupSnap = await adminDb
    .collection("applications")
    .where("projectId",      "==", projectId)
    .where("applicantUid",   "==", auth.callerUid)
    .where("roleAppliedFor", "==", roleAppliedFor)
    .get();
  if (!dupSnap.empty)
    return Response.json(
      { error: "You have already applied for this role on this project" },
      { status: 409 },
    );

  // ── Fetch applicant profile (server-side — never trust client-sent PII) ───
  const profileSnap = await adminDb.collection("users").doc(auth.callerUid).get();
  const profile     = profileSnap.exists ? profileSnap.data()! : {};

  const applicantName          = (profile.displayName as string | undefined) ?? auth.displayName;
  const applicantYear          = (profile.gradYear as number | undefined) ?? null;
  const applicantConcentration = (profile.concentration as string | undefined) ?? "";

  // ── Save application ──────────────────────────────────────────────────────
  const now = new Date();
  const application = {
    projectId,
    projectTitle:          project.title   ?? "",
    roleAppliedFor,
    applicantUid:          auth.callerUid,
    applicantName,
    applicantEmail:        auth.callerEmail,
    applicantYear,
    applicantConcentration,
    whyThisRole,
    experience,
    portfolioLink,
    createdAt:             now.toISOString(),
    status:                "pending",
  };

  const ref = await adminDb.collection("applications").add(application);

  // ── Email notification (fire-and-forget) ──────────────────────────────────
  const ownerEmail = project.creatorEmail as string | undefined;
  if (ownerEmail) {
    notifyApplicationReceived({
      ownerEmail,
      ownerName:              project.creatorName ?? "",
      projectTitle:           project.title       ?? "",
      projectId,
      roleName:               roleAppliedFor,
      applicantName,
      applicantEmail:         auth.callerEmail,
      applicantYear,
      applicantConcentration,
      whyThisRole,
      experience,
      portfolioLink,
    }).catch(() => { /* silent — email failure must never break the response */ });
  }

  return Response.json({ ok: true, id: ref.id }, { status: 201 });
}
