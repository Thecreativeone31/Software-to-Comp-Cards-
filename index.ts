export type Verdict = "BUY" | "OFFER" | "PASS";

export interface CardIdentification {
  player: string;
  sport: string;
  year: number;
  manufacturer: string;
  set: string;
  cardNumber: string;
  parallel: string;
  serialNumber: string | null;
  rookie: boolean;
  autograph: boolean;
  memorabilia: boolean;
  gradingCompany: string | null;
  grade: string | null;
  confidence: number;
}

export interface DetectedCard extends CardIdentification {
  id: string;
  imageUrl?: string;
  searchQuery: string;
}

export interface CompResult {
  cardId: string;
  recentSales: number[];
  medianPrice: number;
  averagePrice: number;
  lowPrice: number;
  highPrice: number;
  sampleSize: number;
  confidence: number;
  source: string;
  conservativeValue: number;
}

export interface AppSettings {
  marketplace: string;
  desiredRoi: number;
  ebayFeePercent: number;
  perOrderFee: number;
  shippingCost: number;
  suppliesCost: number;
  conservativeDiscount: number;
  defaultCondition: string;
  currency: string;
}

export interface SaleEstimate {
  marketValue: number;
  conservativeValue: number;
  sellingFees: number;
  shipping: number;
  supplies: number;
  totalSellingCosts: number;
  netProceeds: number;
}

export interface DealAnalysis extends SaleEstimate {
  askingPrice: number;
  expectedProfit: number;
  roi: number;
  idealBuyPrice: number;
  maxBuyPrice: number;
  verdict: Verdict;
}

export interface SavedAnalysis {
  id: string;
  date: string;
  cards: DetectedCard[];
  comps: CompResult[];
  askingPrice: number;
  deal: DealAnalysis;
}
