import { getCardsByIds } from "@onecard/optimizer";
import { getSelectedCardIds } from "../shared/storage";

const list = document.querySelector<HTMLDivElement>("#card-list")!;
const statusEl = document.querySelector<HTMLParagraphElement>("#status")!;
const addCardsButton = document.querySelector<HTMLAnchorElement>("#add-cards")!;
const useBestCardButton = document.querySelector<HTMLButtonElement>("#use-best-card")!;

let selectedIds: string[] = [];

function setStatus(message: string, timeout = 1800): void {
  statusEl.textContent = message;
  window.setTimeout(() => {
    if (statusEl.textContent === message) statusEl.textContent = "";
  }, timeout);
}

function rewardSummary(cardId: string): string {
  const card = getCardsByIds([cardId])[0];
  if (!card) return "";
  const topRules = [...card.rewards]
    .filter((rule) => rule.category !== "other")
    .sort((a, b) => b.multiplier - a.multiplier)
    .slice(0, 3);
  const other = card.rewards.find((rule) => rule.category === "other");
  const parts = topRules.map((rule) => `${rule.multiplier}x ${rule.category.replace(/_/g, " ")}`);
  if (other) parts.push(`${other.multiplier}x other`);
  return parts.join(" · ");
}

function render(): void {
  const cards = getCardsByIds(selectedIds);

  if (cards.length === 0) {
    list.innerHTML = `
      <div class="empty-state">
        <p class="empty-title">No cards in your wallet yet.</p>
        <p class="empty-copy">Add your reward cards on the OneCard website, then reopen this extension.</p>
      </div>
    `;
    return;
  }

  list.innerHTML = cards
    .map((card) => {
      const network = card.network ? card.network.toUpperCase() : "Any network";
      return `
        <article class="card-row">
          <span class="card-thumb" aria-hidden="true">
            <span class="card-chip"></span>
            <span class="card-lines"></span>
          </span>
          <span class="card-copy">
            <span class="card-title">${escapeHtml(card.displayName)}</span>
            <span class="card-meta">${escapeHtml(card.issuer)} · ${escapeHtml(network)} · ${escapeHtml(card.currency)}</span>
            <span class="card-rewards">${escapeHtml(rewardSummary(card.cardId))}</span>
          </span>
        </article>
      `;
    })
    .join("");
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

addCardsButton.addEventListener("click", () => {
  setStatus("Opening OneCard...", 900);
});

useBestCardButton.addEventListener("click", async () => {
  useBestCardButton.disabled = true;
  setStatus("Showing best card...");

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) {
      setStatus("Open a checkout tab first.", 2600);
      return;
    }

    const response = await chrome.tabs.sendMessage<{ ok: boolean; reason?: string }>(tab.id, {
      type: "ONECARD_SHOW_BEST_CARD",
    });
    if (response?.ok) {
      setStatus("Recommendation shown on this page.", 1600);
      window.setTimeout(() => window.close(), 450);
    } else {
      setStatus(response?.reason ?? "OneCard could not show a recommendation here.", 3200);
    }
  } catch {
    setStatus("Refresh this page, then try Use best card again.", 3200);
  } finally {
    useBestCardButton.disabled = false;
  }
});

async function init(): Promise<void> {
  selectedIds = await getSelectedCardIds();
  render();
}

void init();
