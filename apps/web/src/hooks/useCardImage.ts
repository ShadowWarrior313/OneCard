"use client";

import { useEffect, useState } from "react";
import {
  fetchCardImage,
  getCachedCardImage,
} from "@/lib/cardImageClient";

export function useCardImage(cardId: string) {
  const [imageUrl, setImageUrl] = useState<string | null>(
    () => getCachedCardImage(cardId) ?? null,
  );
  const [loaded, setLoaded] = useState(
    () => getCachedCardImage(cardId) !== undefined,
  );

  useEffect(() => {
    let cancelled = false;

    fetchCardImage(cardId).then((url) => {
      if (cancelled) return;
      setImageUrl(url);
      setLoaded(true);
    });

    return () => {
      cancelled = true;
    };
  }, [cardId]);

  return { imageUrl, loaded };
}
