import { getCardRewardConfig } from "@/data/cardRewards";
import { dashboardForUser, upsertSubTracker } from "@/data/store";
import { requireHubUser } from "@/server/auth/session";
import { hubDisabledResponse, isHubApiEnabled } from "@/server/hub/access";

export async function POST(request: Request): Promise<Response> {
  if (!isHubApiEnabled()) return hubDisabledResponse();
  const user = await requireHubUser(request);
  if (!user) return Response.json({ error: "Log in to track a bonus" }, { status: 401 });

  let body: {
    cardId?: string;
    minimumSpend?: number;
    startedAt?: string;
    deadline?: string;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }
  const cardId = body.cardId?.trim() ?? "";
  const minimumSpend = Number(body.minimumSpend);
  const startedAt = body.startedAt?.trim() ?? "";
  const deadline = body.deadline?.trim() ?? "";
  if (
    !getCardRewardConfig(cardId) ||
    !Number.isFinite(minimumSpend) ||
    minimumSpend <= 0 ||
    minimumSpend > 100_000 ||
    !/^\d{4}-\d{2}-\d{2}$/.test(startedAt) ||
    !/^\d{4}-\d{2}-\d{2}$/.test(deadline) ||
    deadline < startedAt
  ) {
    return Response.json({ error: "Enter valid bonus tracking details" }, { status: 400 });
  }
  await upsertSubTracker(user.id, { cardId, minimumSpend, startedAt, deadline });
  return Response.json(await dashboardForUser(user.id));
}
