/**
 * Fire-and-forget email notification via Resend.
 * Requires env vars:
 *   RESEND_API_KEY        — your Resend secret key
 *   NOTIFY_FROM_EMAIL     — verified sender address (e.g. noreply@dartwork.app)
 *   NEXT_PUBLIC_APP_URL   — full base URL (e.g. https://dartwork.vercel.app)
 *
 * If RESEND_API_KEY is missing the function returns silently.
 */

export interface ApplicationNotifyPayload {
  ownerEmail:             string;
  ownerName:              string;
  projectTitle:           string;
  projectId:              string;
  roleName:               string;
  applicantName:          string;
  applicantEmail:         string;
  applicantYear:          number | null;
  applicantConcentration: string;
  whyThisRole:            string;
  experience:             string;
  portfolioLink:          string;
}

export async function notifyApplicationReceived(
  payload: ApplicationNotifyPayload,
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return;

  const from   = process.env.NOTIFY_FROM_EMAIL ?? "noreply@dartwork.app";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://dartwork.vercel.app";

  const yearLine = payload.applicantYear
    ? `Class of ${payload.applicantYear}`
    : null;
  const concLine = payload.applicantConcentration || null;
  const yearConc = [yearLine, concLine].filter(Boolean).join(", ");

  const lines = [
    `Hi ${payload.ownerName || "there"},`,
    "",
    `You received a new application for your project "${payload.projectTitle}".`,
    "",
    `Role applied for: ${payload.roleName}`,
    `Applicant: ${payload.applicantName} (${payload.applicantEmail})`,
    yearConc ? `Year / concentration: ${yearConc}` : null,
    "",
    "— Why they want this role —",
    payload.whyThisRole,
    "",
    payload.experience
      ? `— Relevant experience —\n${payload.experience}\n`
      : null,
    payload.portfolioLink
      ? `Portfolio / work sample: ${payload.portfolioLink}\n`
      : null,
    `View all applications on dArtwork: ${appUrl}/projects`,
  ]
    .filter((l) => l !== null)
    .join("\n");

  await fetch("https://api.resend.com/emails", {
    method:  "POST",
    headers: {
      "Content-Type":  "application/json",
      Authorization:   `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      from,
      to:      [payload.ownerEmail],
      subject: `New application — ${payload.projectTitle} (${payload.roleName})`,
      text:    lines,
    }),
  });
}
