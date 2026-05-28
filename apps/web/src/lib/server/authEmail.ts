export async function sendVerificationCodeEmail(input: {
  email: string;
  name: string;
  code: string;
}): Promise<{
  sent: boolean;
  mode: "smtp" | "log";
  reason?: "provider_unset" | "postmark_pending_approval";
}> {
  const postmarkKey = process.env.POSTMARK_SERVER_TOKEN;
  const from = process.env.AUTH_FROM_EMAIL;

  if (postmarkKey && from) {
    const res = await fetch("https://api.postmarkapp.com/email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Postmark-Server-Token": postmarkKey,
      },
      body: JSON.stringify({
        From: from,
        To: input.email,
        Subject: "Your OneCard verification code",
        HtmlBody: `<p>Hi ${input.name},</p><p>Your OneCard verification code is <strong>${input.code}</strong>.</p><p>This code expires in 10 minutes.</p>`,
        MessageStream: "outbound",
      }),
    });
    if (!res.ok) {
      const detail = await res.text();
      const pendingApproval = res.status === 422 || detail.includes("\"ErrorCode\":412");
      if (pendingApproval) {
        console.warn(`[Auth email fallback] Postmark pending approval: ${detail}`);
        console.info(`[Auth dev code] ${input.email}: ${input.code}`);
        return { sent: true, mode: "log", reason: "postmark_pending_approval" };
      }
      throw new Error(`Failed to send verification email: ${detail}`);
    }
    return { sent: true, mode: "smtp" };
  }

  console.info(`[Auth dev code] ${input.email}: ${input.code}`);
  return { sent: true, mode: "log", reason: "provider_unset" };
}
