import { DEFAULT_WALLET_CARD_IDS, SAMPLE_CARDS, getCardsByIds } from "@onecard/optimizer";
import type { CardProduct } from "@onecard/shared-types";

const CARDS_KEY = "onecard_cards_v1";
const CARD_IDS_KEY = "onecard_card_ids_v2";

type StoredCards = {
  [CARDS_KEY]?: CardProduct[];
  [CARD_IDS_KEY]?: string[];
};

export async function getSelectedCardIds(): Promise<string[]> {
  const result = (await chrome.storage.local.get([CARD_IDS_KEY, CARDS_KEY])) as StoredCards;
  const ids = result[CARD_IDS_KEY];
  if (Array.isArray(ids) && ids.length > 0) return ids;

  const legacyCards = result[CARDS_KEY];
  if (Array.isArray(legacyCards) && legacyCards.length > 0) {
    const legacyIds = legacyCards.map((card) => card.cardId);
    await setSelectedCardIds(legacyIds);
    return legacyIds;
  }

  const defaults = [...DEFAULT_WALLET_CARD_IDS];
  await setSelectedCardIds(defaults);
  return defaults;
}

export async function setSelectedCardIds(cardIds: string[]): Promise<void> {
  await chrome.storage.local.set({ [CARD_IDS_KEY]: cardIds });
}

export async function getStoredCards(): Promise<CardProduct[]> {
  const ids = await getSelectedCardIds();
  const cards = getCardsByIds(ids);
  if (cards.length > 0) return cards;
  await setSelectedCardIds([...DEFAULT_WALLET_CARD_IDS]);
  return SAMPLE_CARDS;
}

export async function resetStoredCards(): Promise<CardProduct[]> {
  await setSelectedCardIds([...DEFAULT_WALLET_CARD_IDS]);
  return SAMPLE_CARDS;
}
