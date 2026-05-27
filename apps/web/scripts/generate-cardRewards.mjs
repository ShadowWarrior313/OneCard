import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const snapshot = JSON.parse(
  readFileSync(join(__dirname, "../src/data/cardRewards.snapshot.json"), "utf8"),
);

const SEED_IDS = new Set([
  "amex_cobalt",
  "cibc_dividend_infinite",
  "scotia_momentum",
  "rbc_ion",
]);

const legacy = snapshot.filter((c) => !SEED_IDS.has(c.id));

const out = `/** AUTO-GENERATED legacy card entries — do not edit by hand. Regenerate via \`node scripts/generate-cardRewards.mjs\`. */
export const LEGACY_CARD_ENTRIES = ${JSON.stringify(legacy, null, 2)} as const;
`;

writeFileSync(join(__dirname, "../src/data/cardRewards.legacy.ts"), out);
console.log("Wrote", legacy.length, "legacy entries");
