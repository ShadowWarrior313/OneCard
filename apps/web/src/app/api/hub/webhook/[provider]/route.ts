import { handleWebhook } from "@/server/hub/routes";

/**
 * Provider webhook endpoint: /api/hub/webhook/plaid (or /mock). Provider-neutral
 * by path; the active provider verifies its own signature. Signature-authenticated
 * and idempotent — see server/hub/routes.ts.
 */
export async function POST(
  request: Request,
  context: { params: { provider: string } },
): Promise<Response> {
  return handleWebhook(request, context.params.provider);
}
