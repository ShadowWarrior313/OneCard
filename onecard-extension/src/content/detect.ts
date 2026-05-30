import type { CheckoutDetectionForScoring } from "../engine/score";
import { injectRecommendation, removeRecommendation } from "./inject-ui";

export type CartItem = {
  name: string;
  quantity?: number;
  price?: number;
};

export type CheckoutDetection = CheckoutDetectionForScoring & {
  confidence: number;
  url: string;
  hostname: string;
  merchant: CheckoutDetectionForScoring["merchant"] & {
    hostname: string;
  };
  cart: CheckoutDetectionForScoring["cart"] & {
    source: "json-ld" | "microdata" | "dom" | "adapter" | "none";
  };
  signals: string[];
};

type MerchantIdentity = {
  id: string;
  displayName: string;
};

type MerchantAdapter = {
  id: string;
  matches(hostname: string, document: Document): boolean;
  detect(document: Document): Partial<Pick<CheckoutDetection, "cart">> & {
    merchant?: MerchantIdentity;
    confidenceBoost?: number;
    signals?: string[];
  };
};

const CHECKOUT_THRESHOLD = 0.55;
const RERUN_DELAY_MS = 450;
let rerunTimer = 0;
let lastFingerprint = "";

const ADAPTERS: MerchantAdapter[] = [
  {
    id: "walmart-example",
    matches(hostname, document) {
      return hostname.includes("walmart") || document.body.dataset.onecardMerchant === "walmart";
    },
    detect(document) {
      const items = Array.from(document.querySelectorAll<HTMLElement>("[data-cart-item]")).map((row) => ({
        name: row.querySelector<HTMLElement>("[data-item-name]")?.textContent?.trim() ?? "",
        quantity: Number(row.querySelector<HTMLElement>("[data-item-qty]")?.textContent?.trim() ?? 1),
        price: parseMoney(row.querySelector<HTMLElement>("[data-item-price]")?.textContent ?? "") ?? undefined,
      })).filter((item) => item.name);
      const total = parseMoney(document.querySelector<HTMLElement>("[data-order-total]")?.textContent ?? "");
      return {
        merchant: { id: "walmart", displayName: "Walmart" },
        cart: {
          items,
          total: total ?? undefined,
          source: items.length || total ? "adapter" : "none",
        },
        confidenceBoost: 0.2,
        signals: ["walmart adapter"],
      };
    },
  },
  {
    id: "amazon-example",
    matches(hostname, document) {
      return hostname.includes("amazon") || document.body.dataset.onecardMerchant === "amazon";
    },
    detect(document) {
      const total = parseMoney(document.querySelector<HTMLElement>("[data-order-total]")?.textContent ?? "");
      return {
        merchant: { id: "amazon", displayName: "Amazon" },
        cart: {
          items: extractDomItems(document),
          total: total ?? undefined,
          source: "adapter",
        },
        confidenceBoost: 0.15,
        signals: ["amazon adapter"],
      };
    },
  },
];

function parseMoney(text: string): number | null {
  const match = text.match(/(?:CA\$|C\$|\$|USD|CAD)?\s*([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]{2})|[0-9]+(?:\.[0-9]{2})?)/i);
  if (!match) return null;
  const amount = Number(match[1]?.replace(/,/g, ""));
  return Number.isFinite(amount) ? amount : null;
}

function normalizeMerchantId(value: string): string {
  return value
    .toLowerCase()
    .replace(/^www\./, "")
    .replace(/\.(com|ca|net|org).*$/, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function text(selector: string): string | undefined {
  return document.querySelector(selector)?.textContent?.trim() || undefined;
}

function meta(name: string): string | undefined {
  return (
    document.querySelector<HTMLMetaElement>(`meta[property="${name}"]`)?.content ||
    document.querySelector<HTMLMetaElement>(`meta[name="${name}"]`)?.content ||
    undefined
  );
}

function readJsonLd(): unknown[] {
  const nodes = Array.from(document.querySelectorAll<HTMLScriptElement>('script[type="application/ld+json"]'));
  const parsed: unknown[] = [];
  for (const node of nodes) {
    try {
      const value = JSON.parse(node.textContent ?? "null");
      if (Array.isArray(value)) parsed.push(...value);
      else if (value) parsed.push(value);
    } catch {
      // Ignore malformed merchant JSON-LD.
    }
  }
  return parsed;
}

function jsonObject(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function extractJsonLdCart(jsonLd: unknown[]): { items: CartItem[]; total?: number } {
  const items: CartItem[] = [];
  let total: number | undefined;
  for (const entry of jsonLd) {
    const obj = jsonObject(entry);
    if (!obj) continue;
    const type = String(obj["@type"] ?? "").toLowerCase();
    if (type.includes("order") || type.includes("offer") || type.includes("product")) {
      const totalPrice = obj.price ?? obj.totalPrice ?? obj.priceSpecification;
      if (typeof totalPrice === "string" || typeof totalPrice === "number") {
        total = parseMoney(String(totalPrice)) ?? total;
      }
    }
    const rawItems = obj.itemListElement ?? obj.orderedItem ?? obj.itemOffered;
    const array = Array.isArray(rawItems) ? rawItems : rawItems ? [rawItems] : [];
    for (const raw of array) {
      const itemObj = jsonObject(raw);
      const product = jsonObject(itemObj?.item) ?? itemObj;
      const name = String(product?.name ?? itemObj?.name ?? "").trim();
      if (!name) continue;
      const price = parseMoney(String(product?.price ?? itemObj?.price ?? ""));
      items.push({ name, price: price ?? undefined });
    }
  }
  return { items, total };
}

function extractDomItems(root: Document): CartItem[] {
  const rows = Array.from(
    root.querySelectorAll<HTMLElement>(
      "[data-cart-item], [data-testid*='cart-item' i], [class*='cart-item' i], [class*='line-item' i], [class*='order-item' i]",
    ),
  ).slice(0, 20);
  return rows
    .map((row) => {
      const name =
        row.querySelector<HTMLElement>("[data-item-name], [class*='name' i], [class*='title' i]")?.textContent?.trim() ??
        row.textContent?.trim().split(/\s{2,}/)[0] ??
        "";
      const price = parseMoney(row.textContent ?? "");
      return { name, price: price ?? undefined };
    })
    .filter((item) => item.name.length > 2);
}

function extractMicrodataCart(root: Document): { items: CartItem[]; total?: number } {
  const rows = Array.from(
    root.querySelectorAll<HTMLElement>(
      "[itemscope][itemtype*='schema.org/Product'], [itemprop='orderedItem'], [itemprop='itemListElement']",
    ),
  ).slice(0, 20);
  const items = rows
    .map((row) => {
      const name =
        row.querySelector<HTMLElement>("[itemprop='name']")?.textContent?.trim() ??
        row.getAttribute("content") ??
        "";
      const priceText =
        row.querySelector<HTMLElement>("[itemprop='price']")?.getAttribute("content") ??
        row.querySelector<HTMLElement>("[itemprop='price']")?.textContent ??
        row.textContent ??
        "";
      const price = parseMoney(priceText);
      return { name, price: price ?? undefined };
    })
    .filter((item) => item.name.length > 2);
  const totalCandidate =
    root.querySelector<HTMLElement>("[itemprop='totalPrice']")?.getAttribute("content") ??
    root.querySelector<HTMLElement>("[itemprop='totalPrice']")?.textContent ??
    "";
  return { items, total: parseMoney(totalCandidate) ?? undefined };
}

function extractTotal(root: Document): number | undefined {
  const candidates = Array.from(
    root.querySelectorAll<HTMLElement>(
      "[data-order-total], [data-total], [data-testid*='total' i], [class*='total' i], [id*='total' i]",
    ),
  ).slice(0, 30);
  for (const candidate of candidates) {
    const content = candidate.textContent ?? "";
    if (!/total|amount|pay|due|\$/i.test(content)) continue;
    const amount = parseMoney(content);
    if (amount) return amount;
  }
  return undefined;
}

function detectMerchant(hostname: string, jsonLd: unknown[]): MerchantIdentity {
  const datasetMerchant = document.body.dataset.onecardMerchant;
  if (datasetMerchant) {
    return {
      id: normalizeMerchantId(datasetMerchant),
      displayName: document.body.dataset.onecardMerchantName || datasetMerchant,
    };
  }

  for (const entry of jsonLd) {
    const obj = jsonObject(entry);
    if (!obj) continue;
    const seller = jsonObject(obj.seller) ?? jsonObject(obj.provider) ?? jsonObject(obj.merchant);
    const name = String(seller?.name ?? obj.name ?? "").trim();
    if (name) return { id: normalizeMerchantId(name), displayName: name };
  }

  const siteName = meta("og:site_name") || meta("application-name") || text("title");
  if (siteName) return { id: normalizeMerchantId(siteName), displayName: siteName };

  return { id: normalizeMerchantId(hostname), displayName: hostname.replace(/^www\./, "") };
}

function checkoutSignals(url: URL): { confidence: number; signals: string[] } {
  let confidence = 0;
  const signals: string[] = [];
  if (/checkout|cart|payment|billing|pay|order/i.test(`${url.pathname} ${url.search} ${url.hash}`)) {
    confidence += 0.3;
    signals.push("checkout URL");
  }
  if (document.querySelector("input[autocomplete='cc-number'], input[name*='card' i], input[id*='card' i], iframe[src*='stripe' i], iframe[src*='adyen' i]")) {
    confidence += 0.3;
    signals.push("payment fields");
  }
  if (/place order|pay now|complete purchase|review order/i.test(document.body.textContent ?? "")) {
    confidence += 0.2;
    signals.push("checkout action copy");
  }
  if (extractTotal(document) != null) {
    confidence += 0.15;
    signals.push("order total");
  }
  if (readJsonLd().length > 0) {
    confidence += 0.1;
    signals.push("structured data");
  }
  return { confidence: Math.min(1, confidence), signals };
}

function detectCheckout(): CheckoutDetection | null {
  try {
    const url = new URL(window.location.href);
    const jsonLd = readJsonLd();
    const adapter = ADAPTERS.find((entry) => entry.matches(url.hostname, document));
    const generic = checkoutSignals(url);
    const adapterResult = adapter?.detect(document);
    const jsonCart = extractJsonLdCart(jsonLd);
    const microdataCart = extractMicrodataCart(document);
    const domItems = extractDomItems(document);
    const total = adapterResult?.cart?.total ?? jsonCart.total ?? microdataCart.total ?? extractTotal(document);
    const merchant = adapterResult?.merchant ?? detectMerchant(url.hostname, jsonLd);
    const cart = adapterResult?.cart ?? {
      items: jsonCart.items.length ? jsonCart.items : microdataCart.items.length ? microdataCart.items : domItems,
      total,
      source: jsonCart.items.length ? "json-ld" : microdataCart.items.length ? "microdata" : domItems.length || total ? "dom" : "none",
    };
    const confidence = Math.min(1, generic.confidence + (adapterResult?.confidenceBoost ?? 0));
    const signals = [...generic.signals, ...(adapterResult?.signals ?? [])];

    if (confidence < CHECKOUT_THRESHOLD) return null;

    return {
      confidence,
      url: url.href,
      hostname: url.hostname,
      merchant: {
        ...merchant,
        hostname: url.hostname,
        mccCandidates: [],
      },
      cart,
      signals,
    };
  } catch {
    return null;
  }
}

async function runDetection(): Promise<void> {
  const detection = detectCheckout();
  if (!detection) {
    removeRecommendation();
    return;
  }

  const fingerprint = JSON.stringify({
    url: detection.url,
    merchant: detection.merchant.id,
    total: detection.cart.total,
    items: detection.cart.items.map((item) => item.name).slice(0, 8),
  });
  if (fingerprint === lastFingerprint) return;
  lastFingerprint = fingerprint;

  try {
    const response = await chrome.runtime.sendMessage<{ ok: boolean; result?: unknown }>({
      type: "ONECARD_RECOMMENDATION",
      detection,
    });
    if (response?.ok && response.result) {
      injectRecommendation(response.result as Parameters<typeof injectRecommendation>[0]);
    } else {
      removeRecommendation();
    }
  } catch {
    removeRecommendation();
  }
}

function scheduleDetection(): void {
  window.clearTimeout(rerunTimer);
  rerunTimer = window.setTimeout(() => void runDetection(), RERUN_DELAY_MS);
}

void runDetection();

const observer = new MutationObserver(scheduleDetection);
observer.observe(document.documentElement, { childList: true, subtree: true });
window.addEventListener("popstate", scheduleDetection);
window.addEventListener("hashchange", scheduleDetection);
