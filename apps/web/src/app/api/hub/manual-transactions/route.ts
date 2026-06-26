import { assertNoRawCardData, RawCardDataError } from "@/lib/assertNoRawCardData";
import { categorizeTransaction } from "@/server/rewards-intel/categorize";
import { createHubId, dashboardForUser, mutateHubStore } from "@/data/store";
import { getCardRewardConfig } from "@/data/cardRewards";
import { requireHubUser } from "@/server/auth/session";
import { hubDisabledResponse, isHubApiEnabled } from "@/server/hub/access";

export async function POST(request: Request): Promise<Response> {
  if (!isHubApiEnabled()) return hubDisabledResponse();
  const user = await requireHubUser(request);
  if (!user) return Response.json({ error: "Log in to add transactions" }, { status: 401 });

  let body: {
    merchantName?: string;
    amount?: number;
    date?: string;
    cardId?: string;
  };
  try {
    body = (await request.json()) as typeof body;
    assertNoRawCardData(body);
  } catch (error) {
    return Response.json(
      { error: error instanceof RawCardDataError ? "Raw card data is not accepted" : "Invalid request body" },
      { status: 400 },
    );
  }

  const merchantName = body.merchantName?.trim() ?? "";
  const amount = Number(body.amount);
  const date = body.date?.trim() || new Date().toISOString().slice(0, 10);
  const cardId = body.cardId?.trim() ?? "";
  if (
    merchantName.length < 2 ||
    merchantName.length > 120 ||
    !Number.isFinite(amount) ||
    amount <= 0 ||
    amount > 100_000 ||
    !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
    !getCardRewardConfig(cardId)
  ) {
    return Response.json({ error: "Enter a merchant, amount, date, and wallet card" }, { status: 400 });
  }

  await mutateHubStore((store) => {
    store.transactions.push({
      id: createHubId("manual"),
      userId: user.id,
      source: "manual",
      trackedCardId: cardId,
      merchantName,
      amount,
      date,
      pending: false,
      currency: "CAD",
      categorized: categorizeTransaction({ merchantName }),
    });
  });
  return Response.json(await dashboardForUser(user.id));
}
