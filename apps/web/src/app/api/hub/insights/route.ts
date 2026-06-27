import { getCardRewardConfig } from "@/data/cardRewards";
import { dashboardForUser } from "@/data/store";
import { requireHubUser } from "@/server/auth/session";
import { hubDisabledResponse, isHubApiEnabled } from "@/server/hub/access";
import { computeRewardsSummary } from "@/server/rewards-intel/earned-vs-optimal";
import { computeInsights } from "@/server/rewards-intel/insights";

/**
 * POST /api/hub/insights — the rewards-intelligence payload, computed SERVER-SIDE.
 *
 * The MCC engine and reward math never run in the browser; the client sends only
 * its wallet card ids (which live in client wallet state) and receives the
 * earned-vs-optimal summary plus caps/credits/rotations, next-card uplift, and
 * SUB progress. Authenticated + per-user isolated.
 */
export async function POST(request: Request): Promise<Response> {
  if (!isHubApiEnabled()) return hubDisabledResponse();
  const user = await requireHubUser(request);
  if (!user) return Response.json({ error: "Log in to view insights" }, { status: 401 });

  let body: { walletCardIds?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  // Validate + clamp the wallet card ids against the curated registry.
  const walletCardIds = Array.isArray(body.walletCardIds)
    ? body.walletCardIds
        .filter((id): id is string => typeof id === "string")
        .slice(0, 50)
        .filter((id) => Boolean(getCardRewardConfig(id)))
    : [];

  const { transactions, accounts, subTrackers } = await dashboardForUser(user.id);
  return Response.json({
    summary: computeRewardsSummary({ transactions, accounts, walletCardIds }),
    ...computeInsights({ transactions, accounts, subTrackers, walletCardIds }),
  });
}
