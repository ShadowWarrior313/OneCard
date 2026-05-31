import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const additionsPath = join(root, "src/data/cardCatalogAdditions.json");
const snapshotPath = join(root, "src/data/cardRewards.snapshot.json");
const additions = JSON.parse(readFileSync(additionsPath, "utf8"));
const snapshot = JSON.parse(readFileSync(snapshotPath, "utf8"));
const ids = new Set(snapshot.map((card) => card.id));

for (const addition of additions) {
  if (ids.has(addition.id)) continue;
  snapshot.push({
    id: addition.id,
    issuer: addition.issuer,
    name: addition.name,
    network: addition.network,
    pointValueCAD: 0.01,
    currency: "issuer rewards",
    ratesAsOf: addition.scrapedAt,
    sourceUrl: addition.sourceUrl,
    verify: true,
    rewards: [{ category: "other", multiplier: 1 }],
  });
  ids.add(addition.id);
}

writeFileSync(snapshotPath, `${JSON.stringify(snapshot, null, 2)}\n`);
console.log(`Synced ${additions.length} official-source additions. Snapshot now has ${snapshot.length} cards.`);
