const cardImageCache = new Map<string, string | null>();
const cardImagePending = new Map<string, Promise<string | null>>();

export function getCachedCardImage(
  cardId: string,
): string | null | undefined {
  if (!cardImageCache.has(cardId)) return undefined;
  return cardImageCache.get(cardId) ?? null;
}

export async function fetchCardImage(cardId: string): Promise<string | null> {
  if (cardImageCache.has(cardId)) {
    return cardImageCache.get(cardId) ?? null;
  }

  const pending = cardImagePending.get(cardId);
  if (pending) return pending;

  const request = (async () => {
    try {
      const res = await fetch(
        `/api/card-image?cardId=${encodeURIComponent(cardId)}`,
      );
      const data = (await res.json()) as { cardImageUrl?: string | null };
      const url = data.cardImageUrl ?? null;
      cardImageCache.set(cardId, url);
      return url;
    } catch {
      cardImageCache.set(cardId, null);
      return null;
    } finally {
      cardImagePending.delete(cardId);
    }
  })();

  cardImagePending.set(cardId, request);
  return request;
}
