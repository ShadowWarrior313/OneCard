import type { CardProduct } from "@onecard/shared-types";
import { applyCardRewards, type CardMeta } from "./cardRewards";

export function enhanceCardProduct(meta: CardMeta): CardProduct {
  return applyCardRewards(meta);
}

export function enhanceCardCatalog(cards: CardMeta[]): CardProduct[] {
  return cards.map(enhanceCardProduct);
}
