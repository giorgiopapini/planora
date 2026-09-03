import "server-only";

import { Resend } from "resend";

function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY is not configured");
  return new Resend(apiKey);
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export async function sendWorkspaceInvitationEmail(input: {
  recipientEmail: string;
  inviterName: string;
  workspaceName: string;
  roleName: string;
  invitationUrl: string;
}) {
  const from =
    process.env.RESEND_FROM_EMAIL || "Planora <onboarding@resend.dev>";
  const workspaceName = escapeHtml(input.workspaceName);
  const inviterName = escapeHtml(input.inviterName);
  const roleName = escapeHtml(input.roleName);
  const invitationUrl = escapeHtml(input.invitationUrl);

  const { error } = await getResendClient().emails.send({
    from,
    to: input.recipientEmail,
    subject: `${input.inviterName} invited you to ${input.workspaceName} on Planora`,
    text: [
      `${input.inviterName} invited you to join ${input.workspaceName} on Planora.`,
      "",
      `Your workspace role: ${input.roleName}`,
      "",
      `Accept the invitation: ${input.invitationUrl}`,
      "",
      "This invitation expires in 7 days.",
    ].join("\n"),
    html: `
      <div style="font-family: Arial, sans-serif; color: #1f2937; line-height: 1.6; max-width: 560px;">
        <h1 style="font-size: 24px; margin-bottom: 16px;">You have been invited to Planora</h1>
        <p>${inviterName} invited you to join <strong>${workspaceName}</strong>.</p>
        <p>Your workspace role: <strong>${roleName}</strong></p>
        <p style="margin: 28px 0;">
          <a href="${invitationUrl}" style="background: #2563eb; color: #ffffff; display: inline-block; padding: 12px 20px; text-decoration: none; border-radius: 6px;">Accept invitation</a>
        </p>
        <p style="font-size: 14px; color: #6b7280;">This invitation expires in 7 days. If you were not expecting this invitation, you can ignore this email.</p>
      </div>
    `,
  });

  if (error)
    throw new Error(error.message || "Invitation email could not be sent");
}
