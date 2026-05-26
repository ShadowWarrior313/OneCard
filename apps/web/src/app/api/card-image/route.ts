import { getCardById } from "@/data/cards";
import {
  cardImageKeyOverride,
  cardImageSearchTerm,
} from "@/data/cardImageLookup";
import {
  fetchCardImageByKey,
  isRewardsCcConfigured,
  pickBestSearchResult,
  searchCardsByName,
} from "@/lib/rewardsCcApi";

export async function GET(request: Request) {
  const cardId = new URL(request.url).searchParams.get("cardId")?.trim();

  if (!cardId) {
    return Response.json(
      { error: "Missing cardId", cardImageUrl: null },
      { status: 400 },
    );
  }

  const card = getCardById(cardId);
  if (!card) {
    return Response.json(
      { error: "Unknown card", cardImageUrl: null },
      { status: 404 },
    );
  }

  if (!isRewardsCcConfigured()) {
    return Response.json(
      { error: "Rewards CC API not configured", cardImageUrl: null },
      { status: 503 },
    );
  }

  const overrideKey = cardImageKeyOverride(cardId);
  if (overrideKey) {
    const image = await fetchCardImageByKey(overrideKey);
    if (image) {
      return Response.json({
        cardId,
        cardKey: image.cardKey,
        cardName: image.cardName,
        cardImageUrl: image.cardImageUrl,
      });
    }
  }

  const searchTerm = cardImageSearchTerm(card);
  const matches = await searchCardsByName(searchTerm);
  const best = pickBestSearchResult(matches, card.issuer, card.displayName);

  if (!best) {
    return Response.json({ cardId, cardImageUrl: null }, { status: 404 });
  }

  const image = await fetchCardImageByKey(best.cardKey);
  if (!image) {
    return Response.json({ cardId, cardImageUrl: null }, { status: 404 });
  }

  return Response.json({
    cardId,
    cardKey: image.cardKey,
    cardName: image.cardName,
    cardImageUrl: image.cardImageUrl,
  });
}
