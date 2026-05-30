import type { RecommendationResult } from "../engine/score";
import { renderRecommendation } from "../ui/Recommendation";

const ROOT_ID = "onecard-extension-recommendation";

export function removeRecommendation(): void {
  document.getElementById(ROOT_ID)?.remove();
}

export function injectRecommendation(result: RecommendationResult): void {
  removeRecommendation();

  const root = document.createElement("div");
  root.id = ROOT_ID;
  const shadow = root.attachShadow({ mode: "open" });
  const style = document.createElement("style");
  const container = document.createElement("div");

  style.textContent = `
    :host {
      all: initial;
      position: fixed;
      top: max(12px, env(safe-area-inset-top));
      right: max(14px, env(safe-area-inset-right));
      z-index: 2147483647;
      font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }
    .ocx-shell {
      width: min(332px, calc(100vw - 28px));
      max-height: calc(100vh - 24px);
      overflow: auto;
      background:
        radial-gradient(circle at 72% 18%, rgba(125, 211, 252, 0.24), transparent 34%),
        linear-gradient(180deg, #f7fbff 0%, #ffffff 43%, #f8fafc 100%);
      color: #0b0b0f;
      border: 1px solid rgba(148, 163, 184, 0.38);
      border-radius: 22px;
      box-shadow: 0 16px 42px rgba(15, 23, 42, 0.18);
    }
    .ocx-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      background: rgba(255, 255, 255, 0.76);
      border-bottom: 1px solid rgba(226, 232, 240, 0.78);
      padding: 16px 18px 14px;
      backdrop-filter: blur(14px);
    }
    .ocx-brand {
      display: inline-flex;
      align-items: center;
      gap: 9px;
      color: #0b0b0f;
      font-size: 17px;
      font-weight: 850;
      letter-spacing: -0.03em;
    }
    .ocx-logo-mark {
      display: inline-flex;
      width: 36px;
      height: 23px;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }
    .ocx-logo-mark svg {
      display: block;
      width: 36px;
      height: 23px;
    }
    button {
      all: unset;
      box-sizing: border-box;
      cursor: pointer;
      font: inherit;
    }
    .ocx-close {
      display: inline-grid;
      width: 30px;
      height: 30px;
      place-items: center;
      border-radius: 999px;
      background: rgba(241, 245, 249, 0.85);
      color: #475569;
      font-size: 22px;
      line-height: 1;
    }
    .ocx-body {
      padding: 18px 18px 20px;
    }
    .ocx-card-stage {
      display: grid;
      place-items: center;
      margin: 0 0 18px;
      min-height: 108px;
      perspective: 900px;
    }
    .ocx-onecard-face {
      position: relative;
      width: 168px;
      height: 106px;
      border-radius: 16px;
      overflow: hidden;
      background: linear-gradient(135deg, #14151a 0%, #06070a 54%, #222735 100%);
      border: 1px solid rgba(255, 255, 255, 0.2);
      box-shadow: 0 18px 40px rgba(14, 116, 144, 0.25);
      color: #fff;
      transform: rotate(-5deg);
    }
    .ocx-onecard-face::before {
      content: "";
      position: absolute;
      inset: 0;
      background: linear-gradient(45deg, rgba(14, 165, 233, 0.12), transparent 45%, rgba(139, 92, 246, 0.1));
      pointer-events: none;
    }
    .ocx-onecard-glow {
      position: absolute;
      inset: auto -22px -28px 54px;
      height: 68px;
      border-radius: 999px;
      background: rgba(14, 165, 233, 0.13);
      transform: rotate(-12deg);
    }
    .ocx-onecard-inner {
      position: relative;
      display: flex;
      height: 100%;
      min-height: 0;
      flex-direction: column;
      padding: 15px;
      box-sizing: border-box;
    }
    .ocx-onecard-top,
    .ocx-onecard-bottom {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 10px;
      flex: 0 0 auto;
    }
    .ocx-onecard-chip {
      width: 28px;
      height: 19px;
      border-radius: 5px;
      background: linear-gradient(135deg, rgba(253, 230, 138, 0.95), rgba(245, 158, 11, 0.9));
      box-shadow: inset 0 0 0 1px rgba(90, 57, 9, 0.2);
    }
    .ocx-onecard-word {
      color: rgba(255, 255, 255, 0.42);
      font-size: 7px;
      font-weight: 850;
      letter-spacing: 0.22em;
      text-transform: uppercase;
    }
    .ocx-onecard-mid {
      display: flex;
      min-height: 0;
      flex: 1 1 auto;
      flex-direction: column;
      justify-content: center;
      padding: 9px 0 7px;
    }
    .ocx-onecard-mid span {
      color: rgba(255, 255, 255, 0.45);
      font-size: 7.5px;
      font-weight: 700;
      letter-spacing: 0.16em;
      text-transform: uppercase;
    }
    .ocx-onecard-mid strong {
      margin-top: 5px;
      color: #fff;
      font-size: 12px;
      font-weight: 800;
      letter-spacing: 0.04em;
      text-transform: uppercase;
    }
    .ocx-onecard-bottom {
      align-items: flex-end;
      color: rgba(255, 255, 255, 0.36);
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
      font-size: 7.5px;
    }
    .ocx-onecard-network {
      display: inline-flex;
      gap: 0;
    }
    .ocx-onecard-network i {
      display: block;
      width: 12px;
      height: 12px;
      border-radius: 999px;
      background: rgba(239, 68, 68, 0.95);
    }
    .ocx-onecard-network i + i {
      margin-left: -5px;
      background: rgba(251, 191, 36, 0.95);
    }
    .ocx-kicker {
      margin: 0 0 8px;
      color: #0284c7;
      font-size: 10px;
      font-weight: 800;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }
    h2 {
      margin: 0;
      color: #3d3d42;
      font-size: 21px;
      line-height: 1.12;
      font-weight: 850;
      letter-spacing: 0;
    }
    .ocx-rate {
      margin: 9px 0 0;
      color: #0b0b0f;
      font-size: 15px;
      line-height: 1.3;
      font-weight: 850;
    }
    .ocx-why {
      margin: 14px 0 0;
      color: #424248;
      font-size: 13px;
      line-height: 1.45;
    }
    .ocx-note {
      margin: 12px 0 0;
      border-left: 4px solid #38bdf8;
      background: rgba(240, 249, 255, 0.92);
      color: #075985;
      padding: 9px 10px;
      font-size: 12px;
      line-height: 1.4;
    }
    .ocx-manual {
      margin: 12px 0 0;
      color: #626773;
      font-size: 12px;
      line-height: 1.4;
    }
    .ocx-runners {
      margin-top: 16px;
      border-top: 1px solid rgba(226, 232, 240, 0.95);
      padding-top: 16px;
      color: #27272a;
      font-size: 12px;
    }
    summary {
      cursor: pointer;
      font-weight: 800;
    }
    ul {
      list-style: none;
      padding: 0;
      margin: 12px 0 0;
      display: grid;
      gap: 8px;
    }
    li {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 9px;
      color: #52525b;
    }
    .ocx-runner-card {
      flex: 0 0 auto;
      display: inline-grid;
      place-items: center;
      width: 27px;
      height: 18px;
      border-radius: 5px;
      background: linear-gradient(135deg, #111318, #27272a);
      box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.18);
    }
    .ocx-runner-card[data-network="amex"] {
      background: #17466f;
    }
    .ocx-runner-card[data-network="visa"] {
      background: #172554;
    }
    .ocx-runner-card[data-network="mastercard"] {
      background: #231f20;
    }
    .ocx-runner-card span {
      display: block;
      width: 7px;
      height: 5px;
      border-radius: 2px;
      background: #f4c857;
    }
    .ocx-runner-name {
      flex: 1 1 auto;
      min-width: 0;
    }
    strong {
      color: #0b0b0f;
      white-space: nowrap;
    }
    @media (max-width: 560px) {
      :host {
        top: max(10px, env(safe-area-inset-top));
        right: max(10px, env(safe-area-inset-right));
        left: max(10px, env(safe-area-inset-left));
      }
      .ocx-shell {
        width: auto;
        max-height: calc(100vh - 20px);
      }
      .ocx-header {
        padding: 15px 16px 13px;
      }
      .ocx-body {
        padding: 17px 16px 18px;
      }
      h2 {
        font-size: 20px;
      }
      .ocx-card-stage {
        margin-bottom: 16px;
      }
      .ocx-onecard-face {
        width: 158px;
        height: 100px;
      }
    }
  `;

  container.innerHTML = renderRecommendation(result);
  container.querySelector("[data-onecard-close]")?.addEventListener("click", removeRecommendation);
  shadow.append(style, container);
  document.documentElement.append(root);
}
