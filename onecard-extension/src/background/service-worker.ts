import { SAMPLE_WALLET } from "../data/cards.sample";
import { merchantMccForIdentity } from "../engine/mcc-map";
import { scoreRecommendation } from "../engine/score";
import type { CheckoutDetection } from "../content/detect";
import type { LinkedCard } from "../engine/rewards-rules";

const WALLET_KEY = "onecard_sample_wallet_v1";

async function getWallet(): Promise<LinkedCard[]> {
  const result = await chrome.storage.local.get(WALLET_KEY);
  const stored = result[WALLET_KEY];
  if (Array.isArray(stored) && stored.length > 0) return stored as LinkedCard[];
  await chrome.storage.local.set({ [WALLET_KEY]: SAMPLE_WALLET });
  return SAMPLE_WALLET;
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  void (async () => {
    try {
      const typed = message as { type?: string; detection?: CheckoutDetection };
      if (typed.type !== "ONECARD_RECOMMENDATION" || !typed.detection) {
        sendResponse({ ok: false });
        return;
      }

      const merchant = merchantMccForIdentity(
        typed.detection.merchant.id,
        typed.detection.hostname,
        typed.detection.merchant.displayName,
      );
      const wallet = await getWallet();
      const result = scoreRecommendation(
        {
          merchant: {
            id: merchant.merchantId,
            displayName: merchant.displayName,
            mccCandidates: merchant.candidates,
          },
          cart: {
            items: typed.detection.cart.items,
            total: typed.detection.cart.total,
          },
        },
        wallet,
      );
      sendResponse({ ok: Boolean(result), result });
    } catch {
      sendResponse({ ok: false });
    }
  })();
  return true;
});
