import { CARD_CATALOG } from "@/data/cards";

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** Best-effort link from scraped/structured finder title to our card catalog (for art + rates). */
export function matchFinderOfferToCardId(title: string, providerName: string): string | undefined {
  const hay = normalize(`${title} ${providerName}`);
  let bestId: string | undefined;
  let bestScore = 0;

  for (const card of CARD_CATALOG) {
    const name = normalize(card.displayName);
    const tokens = name.split(" ").filter((w) => w.length > 2);
    let score = 0;
    for (const token of tokens) {
      if (hay.includes(token)) score += 1;
    }
    if (normalize(card.issuer).split(" ").some((w) => w.length > 2 && hay.includes(w))) {
      score += 1;
    }
    if (score > bestScore && score >= 3) {
      bestScore = score;
      bestId = card.cardId;
    }
  }

  return bestId;
}
