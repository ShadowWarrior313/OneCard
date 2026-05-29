export type CreditBand = "building" | "fair" | "good" | "excellent";
export type RewardFocus = "cashback" | "travel" | "points" | "balanced";
export type Region = "CA" | "US";
export type OfferSource = "structured" | "scraped";

export type FinderOfferDetails = {
  annualFee?: string;
  additionalUserFee?: string;
  welcomeBonus?: string;
  minSpend?: string;
  rewardsRate?: string;
  offerExpiry?: string;
  introApr?: string;
};

export type FinderOffer = {
  providerId: string;
  providerName: string;
  title: string;
  url: string;
  score: number;
  reasons: string[];
  source: OfferSource;
  details: FinderOfferDetails;
  /** Local catalog id when known (for card art) */
  cardId?: string;
};

export type FinderProfile = {
  region: Region;
  isStudent: boolean;
  creditBand: CreditBand;
  creditScore?: number;
  rewardFocus: RewardFocus;
  openedCardsLast12Months: number;
};

export type FinderResponse = {
  fetchedAt: string;
  profile: FinderProfile;
  providersChecked: number;
  providersResponded: number;
  sources: { structured: number; scraped: number };
  offers: FinderOffer[];
  notes: string[];
};
