import { recommendCard } from "@onecard/optimizer";
import { getStoredCards } from "../shared/storage";

const OVERLAY_ID = "onecard-checkout-advisor-root";

function looksLikeCheckoutUrl(url: URL): boolean {
  return /checkout|cart|payment|billing|pay|order/i.test(
    `${url.pathname} ${url.search} ${url.hash}`,
  );
}

function hasPaymentFields(): boolean {
  const selectors = [
    "input[autocomplete='cc-number']",
    "input[name*='card' i]",
    "input[id*='card' i]",
    "input[name*='cc-number' i]",
    "input[id*='cc-number' i]",
    "input[placeholder*='card number' i]",
    "iframe[src*='stripe' i]",
    "iframe[src*='braintree' i]",
    "iframe[src*='adyen' i]",
    "form[action*='payment' i]",
  ];
  return selectors.some((selector) => document.querySelector(selector));
}

function isCheckoutPage(): boolean {
  return looksLikeCheckoutUrl(new URL(window.location.href)) || hasPaymentFields();
}

function parseMoney(text: string): number | null {
  const matches = text.match(/(?:CA\$|C\$|\$|USD|CAD)?\s*([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]{2})|[0-9]+(?:\.[0-9]{2}))/gi);
  if (!matches) return null;
  const amounts = matches
    .map((match) => Number(match.replace(/[^0-9.]/g, "")))
    .filter((amount) => Number.isFinite(amount) && amount > 0 && amount < 100000);
  if (amounts.length === 0) return null;
  return Math.max(...amounts);
}

function elementText(el: Element): string {
  return (el.textContent ?? "").replace(/\s+/g, " ").trim();
}

function readAmount(): number | null {
  const totalSelectors = [
    "[data-total]",
    "[data-testid*='total' i]",
    "[class*='total' i]",
    "[id*='total' i]",
    "[aria-label*='total' i]",
    "[class*='subtotal' i]",
    "[id*='subtotal' i]",
  ];
  const candidates = totalSelectors
    .flatMap((selector) => Array.from(document.querySelectorAll(selector)))
    .map(elementText)
    .filter((text) => /total|amount|due|pay|CA\$|C\$|\$/i.test(text))
    .slice(0, 40);

  for (const text of candidates) {
    const parsed = parseMoney(text);
    if (parsed) return parsed;
  }

  const inputs = Array.from(
    document.querySelectorAll<HTMLInputElement>("input[name*='amount' i], input[id*='amount' i]"),
  );
  for (const input of inputs) {
    const parsed = parseMoney(input.value);
    if (parsed) return parsed;
  }

  return null;
}

function centsToMoney(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function percentFromCents(cents: number, amount: number | undefined): string {
  if (!amount || amount <= 0) return "";
  return `${((cents / 100 / amount) * 100).toFixed(1).replace(/\.0$/, "")}%`;
}

function injectOverlay(message: {
  cardId: string;
  card: string;
  runnerUp?: string;
  amount?: number;
  rewardCents: number;
  runnerUpCents?: number;
  category: string;
}): void {
  document.getElementById(OVERLAY_ID)?.remove();

  const host = document.createElement("div");
  host.id = OVERLAY_ID;
  const shadow = host.attachShadow({ mode: "open" });
  const wrapper = document.createElement("aside");
  const style = document.createElement("style");
  const rate = percentFromCents(message.rewardCents, message.amount);
  const estimate = message.amount ? ` (${centsToMoney(message.rewardCents)})` : "";
  const runner =
    message.runnerUp && message.runnerUpCents !== undefined
      ? `Runner-up: ${message.runnerUp}${message.amount ? ` (${centsToMoney(message.runnerUpCents)})` : ""}.`
      : "No runner-up available yet.";

  style.textContent = `
    :host {
      --onecard-ink: #0b0b0f;
      --onecard-muted: #5f6b7a;
      --onecard-border: rgba(148, 163, 184, 0.38);
      --onecard-blue: #0284c7;
      all: initial;
      position: fixed;
      z-index: 2147483647;
      top: max(12px, env(safe-area-inset-top));
      right: max(14px, env(safe-area-inset-right));
      font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }
    .card {
      box-sizing: border-box;
      width: min(332px, calc(100vw - 28px));
      max-height: calc(100vh - 24px);
      border: 1px solid var(--onecard-border);
      border-radius: 22px;
      background:
        radial-gradient(circle at 72% 18%, rgba(125, 211, 252, 0.24), transparent 34%),
        linear-gradient(180deg, #f7fbff 0%, #ffffff 43%, #f8fafc 100%);
      color: var(--onecard-ink);
      box-shadow: 0 16px 42px rgba(15, 23, 42, 0.18);
      overflow: auto;
    }
    .chrome {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      background: rgba(255, 255, 255, 0.76);
      border-bottom: 1px solid rgba(226, 232, 240, 0.78);
      padding: 16px 18px 14px;
      backdrop-filter: blur(14px);
    }
    .logo {
      display: block;
      width: 26px;
      height: 26px;
      flex: 0 0 auto;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 9px;
      min-width: 0;
      font-size: 17px;
      font-weight: 850;
      letter-spacing: -0.03em;
      color: var(--onecard-ink);
    }
    .body {
      padding: 18px 18px 20px;
    }
    .hero {
      display: grid;
      place-items: center;
      margin: 0 0 18px;
      min-height: 108px;
    }
    .onecard-face {
      position: relative;
      width: 168px;
      height: 106px;
      border-radius: 16px;
      overflow: hidden;
      background: linear-gradient(145deg, #1a1a1c 0%, #0a0a0b 42%, #18181b 100%);
      color: #fff;
      border: 1px solid rgba(255, 255, 255, 0.2);
      box-shadow: 0 18px 40px rgba(14, 116, 144, 0.25);
    }
    .onecard-face::before {
      content: "";
      position: absolute;
      inset: 0;
      background: linear-gradient(45deg, rgba(14, 165, 233, 0.12), transparent 45%, rgba(139, 92, 246, 0.1));
      pointer-events: none;
    }
    .onecard-inner {
      position: relative;
      display: flex;
      height: 100%;
      min-height: 0;
      flex-direction: column;
      box-sizing: border-box;
      padding: 15px;
    }
    .onecard-top,
    .onecard-bottom {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 8px;
      flex: 0 0 auto;
    }
    .onecard-chip {
      width: 28px;
      height: 19px;
      border-radius: 5px;
      background: linear-gradient(135deg, rgba(253, 230, 138, 0.95), rgba(245, 158, 11, 0.9));
      box-shadow: inset 0 0 0 1px rgba(90, 57, 9, 0.2);
    }
    .onecard-word {
      color: rgba(255, 255, 255, 0.42);
      font-size: 7px;
      font-weight: 850;
      letter-spacing: 0.22em;
      text-transform: uppercase;
    }
    .onecard-mid {
      display: flex;
      min-height: 0;
      flex: 1 1 auto;
      flex-direction: column;
      justify-content: center;
      padding: 9px 0 7px;
    }
    .onecard-mid span {
      color: rgba(255, 255, 255, 0.45);
      font-size: 7.5px;
      font-weight: 700;
      letter-spacing: 0.16em;
      text-transform: uppercase;
    }
    .onecard-mid strong {
      margin-top: 5px;
      color: #fff;
      font-size: 12px;
      font-weight: 800;
      letter-spacing: 0.04em;
      text-transform: uppercase;
    }
    .onecard-bottom {
      align-items: flex-end;
      color: rgba(255, 255, 255, 0.36);
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
      font-size: 7.5px;
    }
    .network {
      display: inline-flex;
      gap: 0;
    }
    .network i {
      display: block;
      width: 12px;
      height: 12px;
      border-radius: 999px;
      background: rgba(239, 68, 68, 0.95);
    }
    .network i + i {
      margin-left: -5px;
      background: rgba(251, 191, 36, 0.95);
    }
    .headline {
      margin: 0;
      color: #3d3d42;
      font-size: 21px;
      line-height: 1.12;
      font-weight: 850;
      letter-spacing: 0;
    }
    .rate {
      margin: 9px 0 0;
      color: var(--onecard-ink);
      font-size: 15px;
      line-height: 1.3;
      font-weight: 850;
    }
    .runner {
      margin: 14px 0 0;
      color: #4b4b50;
      font-size: 13px;
      line-height: 1.45;
    }
    .details {
      margin: 12px 0 0;
      border-left: 4px solid #38bdf8;
      background: rgba(240, 249, 255, 0.92);
      color: #075985;
      padding: 9px 10px;
      font-size: 12px;
      line-height: 1.4;
    }
    .actions {
      display: grid;
      gap: 10px;
      margin-top: 16px;
    }
    button {
      all: unset;
      box-sizing: border-box;
      cursor: pointer;
      min-height: 42px;
      border-radius: 999px;
      border: 1px solid rgba(148, 163, 184, 0.72);
      color: var(--onecard-ink);
      background: rgba(255, 255, 255, 0.72);
      font-size: 13px;
      font-weight: 800;
      line-height: 1;
      padding: 13px 14px;
      text-align: center;
    }
    button.close {
      border: 0;
      border-radius: 999px;
      min-height: auto;
      color: #5f6470;
      background: rgba(241, 245, 249, 0.85);
      font-size: 22px;
      padding: 0;
      width: 30px;
      height: 30px;
      display: inline-grid;
      place-items: center;
    }
    button.use-card {
      background: #0b0b0f;
      color: #fff;
      border-color: transparent;
    }
    button.use-card:hover {
      background: #27272a;
    }
    button.use-card:disabled {
      opacity: 0.5;
      cursor: default;
    }
    button:not(.use-card):hover {
      background: rgba(14, 165, 233, 0.08);
      color: var(--onecard-ink);
    }
    .status {
      margin: 12px 0 0;
      min-height: 18px;
      color: var(--onecard-muted);
      font-size: 12px;
      line-height: 1.35;
    }
    @media (max-width: 560px) {
      :host {
        top: max(10px, env(safe-area-inset-top));
        right: max(10px, env(safe-area-inset-right));
        left: max(10px, env(safe-area-inset-left));
      }
      .card {
        width: auto;
        max-height: calc(100vh - 20px);
      }
      .chrome {
        padding: 15px 16px 13px;
      }
      .body {
        padding: 17px 16px 18px;
      }
      .headline {
        font-size: 20px;
      }
    }
  `;

  const iconUrl = escapeHtml(chrome.runtime.getURL("assets/icons/icon-48.png"));
  wrapper.className = "card";
  wrapper.innerHTML = `
    <div class="chrome">
      <div class="brand">
        <img class="logo" src="${iconUrl}" width="26" height="26" alt="" aria-hidden="true" />
        <span>OneCard</span>
      </div>
      <button type="button" class="close" aria-label="Dismiss OneCard recommendation" data-onecard-dismiss>×</button>
    </div>
    <div class="body">
      <div class="hero" aria-hidden="true">
        <div class="onecard-face">
          <div class="onecard-inner">
            <div class="onecard-top">
              <span class="onecard-chip"></span>
              <span class="onecard-word">OneCard</span>
            </div>
            <div class="onecard-mid">
              <span>Universal wallet</span>
              <strong>John Smith</strong>
            </div>
            <div class="onecard-bottom">
              <span>Tap · Route · Earn</span>
              <span class="network"><i></i><i></i></span>
            </div>
          </div>
        </div>
      </div>
      <h2 class="headline">${escapeHtml(message.card)}</h2>
      <p class="rate">${rate ? `~${rate} back` : "Best card for this checkout"}${estimate ? ` ${escapeHtml(estimate)}` : ""}</p>
      <p class="runner">OneCard found your best card for this checkout. Pick this card manually when you pay.</p>
      <p class="details">${escapeHtml(runner)} Category: ${escapeHtml(message.category.replace(/_/g, " "))}.</p>
      <div class="actions">
        <button type="button" class="use-card" data-onecard-use>Use Card</button>
        <button type="button" data-onecard-dismiss>Dismiss</button>
      </div>
      <p class="status" aria-live="polite"></p>
    </div>
  `;
  wrapper.querySelectorAll("[data-onecard-dismiss]").forEach((button) => {
    button.addEventListener("click", () => host.remove());
  });

  const useCardBtn = wrapper.querySelector<HTMLButtonElement>("[data-onecard-use]");
  const statusEl = wrapper.querySelector<HTMLParagraphElement>(".status");
  useCardBtn?.addEventListener("click", () => {
    if (statusEl) statusEl.textContent = "Card selected. Pay using your physical OneCard.";
    if (useCardBtn) useCardBtn.disabled = true;
    window.setTimeout(() => host.remove(), 1400);
  });

  shadow.append(style, wrapper);
  document.documentElement.append(host);
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => {
    switch (char) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&quot;";
      default:
        return "&#39;";
    }
  });
}

// Raw card data (PAN, CVV, expiry) is never written to checkout pages.
// Card payment is completed via the physical OneCard or the OneCard app,
// which routes through Stripe tokenization — not through this extension.

async function showBestCard(force = false): Promise<{ ok: boolean; reason?: string }> {
  if (!force && !isCheckoutPage()) return { ok: false, reason: "This does not look like a checkout page yet." };
  const cards = await getStoredCards();
  const amount = readAmount();
  const recommendation = recommendCard({
    hostname: window.location.hostname,
    cards,
    amount,
  });
  if (!recommendation) return { ok: false, reason: "No card recommendation is available for this page." };

  injectOverlay({
    cardId: recommendation.winner.cardId,
    card: recommendation.winner.displayName,
    runnerUp: recommendation.runnerUp?.displayName,
    amount: recommendation.amount,
    rewardCents: recommendation.winner.estimatedRewardValueCents,
    runnerUpCents: recommendation.runnerUp?.estimatedRewardValueCents,
    category: recommendation.merchant.category,
  });
  return { ok: true };
}

async function run(): Promise<void> {
  await showBestCard(false);
}

void run();

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  const typed = message as { type?: string };
  if (typed.type !== "ONECARD_SHOW_BEST_CARD") return false;

  void showBestCard(true)
    .then(sendResponse)
    .catch(() => sendResponse({ ok: false, reason: "OneCard could not show a recommendation on this page." }));
  return true;
});
