import type { RecommendationResult } from "../engine/score";
import { CATEGORY_LABELS } from "../engine/rewards-rules";

function money(n: number | undefined): string {
  return n == null ? "" : ` (+$${n.toFixed(2)} est.)`;
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

export function renderRecommendation(result: RecommendationResult): string {
  const winner = result.winner;
  const logoUrl = escapeHtml(chrome.runtime.getURL("assets/icons/icon-48.png"));
  const runnerRows = result.runnersUp
    .map(
      (score) => `
        <li>
          <span class="ocx-runner-card" data-network="${escapeHtml(score.card.network)}" aria-hidden="true">
            <span></span>
          </span>
          <span class="ocx-runner-name">${escapeHtml(score.card.displayName)}</span>
          <strong>${score.rule.rate}${score.rule.unit}${money(score.estimatedValue)}</strong>
        </li>
      `,
    )
    .join("");

  return `
    <div class="ocx-shell" role="dialog" aria-label="OneCard checkout recommendation">
      <div class="ocx-header">
        <div class="ocx-brand">
          <span class="ocx-logo-mark" aria-hidden="true">
            <img src="${logoUrl}" width="36" height="36" alt="" />
          </span>
          <span>OneCard</span>
        </div>
        <button class="ocx-close" type="button" aria-label="Dismiss recommendation" data-onecard-close>×</button>
      </div>

      <div class="ocx-body">
        <div class="ocx-card-stage" aria-hidden="true">
          <div class="ocx-onecard-face">
            <div class="ocx-onecard-glow"></div>
            <div class="ocx-onecard-inner">
              <div class="ocx-onecard-top">
                <span class="ocx-onecard-chip"></span>
                <span class="ocx-onecard-word">OneCard</span>
              </div>
              <div class="ocx-onecard-mid">
                <span>Universal wallet</span>
                <strong>John Smith</strong>
              </div>
              <div class="ocx-onecard-bottom">
                <span>Tap · Route · Earn</span>
                <span class="ocx-onecard-network"><i></i><i></i></span>
              </div>
            </div>
          </div>
        </div>
        <p class="ocx-kicker">Best card</p>
        <h2>${escapeHtml(winner.card.displayName)}</h2>
        <p class="ocx-rate">${winner.rule.rate}${winner.rule.unit} on ${escapeHtml(CATEGORY_LABELS[result.rewardCategory])}${money(winner.estimatedValue)}</p>
        <p class="ocx-why">${escapeHtml(result.why)}</p>
        ${
          result.mismatchNote
            ? `<p class="ocx-note">${escapeHtml(result.mismatchNote)}</p>`
            : ""
        }
        <p class="ocx-manual">Recommendation only. You still choose and pay manually.</p>
        <details class="ocx-runners">
          <summary>See other cards</summary>
          <ul>${runnerRows}</ul>
        </details>
      </div>
    </div>
  `;
}
