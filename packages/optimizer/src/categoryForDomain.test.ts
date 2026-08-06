import { describe, expect, it } from "vitest";
import { categoryForDomain, hostMatchesDomainRule } from "./index.js";

describe("hostMatchesDomainRule", () => {
  it("matches bare brands on DNS label boundaries only", () => {
    expect(hostMatchesDomainRule("gap.com", "gap")).toBe(true);
    expect(hostMatchesDomainRule("m.gap.ca", "gap")).toBe(true);
    expect(hostMatchesDomainRule("united-airlines.com", "united")).toBe(true);

    expect(hostMatchesDomainRule("singaporeair.com", "gap")).toBe(false);
    expect(hostMatchesDomainRule("agape.com", "gap")).toBe(false);
    expect(hostMatchesDomainRule("doorbell.com", "bell")).toBe(false);
    expect(hostMatchesDomainRule("isabelle.com", "bell")).toBe(false);
    expect(hostMatchesDomainRule("powershellgallery.com", "shell")).toBe(false);
    expect(hostMatchesDomainRule("travis.com", "avis")).toBe(false);
    expect(hostMatchesDomainRule("corona.com", "rona")).toBe(false);
    expect(hostMatchesDomainRule("cola.com", "ola")).toBe(false);
    expect(hostMatchesDomainRule("coaching.com", "coach")).toBe(false);
  });

  it("matches dotted rules at label boundaries (not mid-label embeds)", () => {
    expect(hostMatchesDomainRule("article.com", "article.com")).toBe(true);
    expect(hostMatchesDomainRule("www.article.com", "article.com")).toBe(true);
    expect(hostMatchesDomainRule("particle.com", "article.com")).toBe(false);

    expect(hostMatchesDomainRule("music.apple.com", "music.apple")).toBe(true);
    expect(hostMatchesDomainRule("metro.ca", "metro.ca")).toBe(true);
  });
});

describe("categoryForDomain", () => {
  it("does not classify Singapore Airlines checkout as Gap clothing", () => {
    // Regression: host.includes("gap") matched inside "singaporeair".
    const category = categoryForDomain("singaporeair.com");
    expect(category.merchantId).not.toBe("gap");
    expect(category.category).not.toBe("clothing");
  });

  it("still maps known brands correctly", () => {
    expect(categoryForDomain("walmart.ca").merchantId).toBe("walmart_grocery");
    expect(categoryForDomain("gap.com").merchantId).toBe("gap");
    expect(categoryForDomain("bell.ca").merchantId).toBe("bell");
    expect(categoryForDomain("shell.ca").category).toBe("gas");
    expect(categoryForDomain("ubereats.com").merchantId).toBe("uber_eats");
    expect(categoryForDomain("uber.com").merchantId).toBe("uber");
    expect(categoryForDomain("aircanada.com").category).toBe("travel");
  });

  it("does not treat particle.com as Article furniture", () => {
    const category = categoryForDomain("particle.com");
    expect(category.merchantId).not.toBe("article");
    expect(category.category).toBe("other");
  });

  it("does not treat false bell/shell substrings as recurring bills / gas", () => {
    expect(categoryForDomain("doorbell.com").category).toBe("other");
    expect(categoryForDomain("powershellgallery.com").category).toBe("other");
  });
});
