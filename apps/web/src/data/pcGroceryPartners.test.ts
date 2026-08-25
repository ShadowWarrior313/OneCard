import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { PC_GROCERY_MERCHANTS } from "./merchantPartners.ts";
import snapshot from "./cardRewards.snapshot.json" with { type: "json" };

const PC_CARD_IDS = [
  "pc_mastercard",
  "pc_world_mc",
  "pc_world_elite_mc",
  "pc_insiders_we_mc",
] as const;

describe("PC Financial grocery partners", () => {
  it("does not list Walmart as a Loblaw/PC Optimum grocery banner", () => {
    assert.equal(PC_GROCERY_MERCHANTS.includes("walmart_grocery"), false);
    assert.ok(PC_GROCERY_MERCHANTS.includes("loblaws"));
    assert.ok(PC_GROCERY_MERCHANTS.includes("superstore"));
  });

  it("does not give PC cards a Walmart grocery merchant bonus", () => {
    for (const cardId of PC_CARD_IDS) {
      const card = (snapshot as Array<{ id: string; rewards: Array<{ merchantIds?: string[] }> }>).find(
        (entry) => entry.id === cardId,
      );
      assert.ok(card, `missing snapshot card ${cardId}`);
      for (const rule of card.rewards) {
        assert.equal(
          rule.merchantIds?.includes("walmart_grocery") ?? false,
          false,
          `${cardId} still lists walmart_grocery as a partner merchant`,
        );
      }
    }
  });
});
