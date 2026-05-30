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
            <svg viewBox="0 0 88 56" role="img">
              <path d="M13 17.5 45 8.8c5-1.4 10.1 1.6 11.5 6.6l6.7 24.9c1.3 5-1.6 10.1-6.6 11.5L24.5 60.5c-5 1.4-10.1-1.6-11.5-6.6L6.3 29c-1.3-5 1.7-10.2 6.7-11.5Z" fill="#d8dee7"/>
              <path d="M23.5 13.8 58 7.7c5.2-.9 10.1 2.6 11 7.8l4.2 24.1c.9 5.2-2.6 10.1-7.8 11L30.9 56.7c-5.2.9-10.1-2.6-11-7.8l-4.2-24.1c-.9-5.2 2.6-10.1 7.8-11Z" fill="#aeb7c4"/>
              <path d="M34.9 8.9 70.8 5c5.3-.6 10 3.2 10.6 8.5l2.7 25.2c.6 5.3-3.2 10-8.5 10.6L39.7 53.2c-5.3.6-10-3.2-10.6-8.5l-2.7-25.2c-.6-5.3 3.2-10 8.5-10.6Z" fill="#7d8793"/>
              <rect x="38" y="5" width="44" height="46" rx="8" transform="rotate(7 38 5)" fill="#08090c"/>
              <rect x="64" y="18" width="10" height="12" rx="2" transform="rotate(7 64 18)" fill="#ffffff"/>
            </svg>
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
