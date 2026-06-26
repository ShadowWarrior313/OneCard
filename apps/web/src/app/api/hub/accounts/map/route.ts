import { getCardRewardConfig } from "@/data/cardRewards";
import { mapAccountToCard } from "@/data/store";
import { requireHubUser } from "@/server/auth/session";
import { hubDisabledResponse, isHubApiEnabled } from "@/server/hub/access";

export async function POST(request: Request): Promise<Response> {
  if (!isHubApiEnabled()) return hubDisabledResponse();
  const user = await requireHubUser(request);
  if (!user) return Response.json({ error: "Log in to update your cards" }, { status: 401 });

  let body: { accountId?: string; cardId?: string | null };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }
  const accountId = body.accountId?.trim() ?? "";
  const cardId = body.cardId?.trim() || undefined;
  if (!accountId || (cardId && !getCardRewardConfig(cardId))) {
    return Response.json({ error: "Invalid account mapping" }, { status: 400 });
  }
  const account = await mapAccountToCard(user.id, accountId, cardId);
  return account
    ? Response.json({ ok: true })
    : Response.json({ error: "Account not found" }, { status: 404 });
}
