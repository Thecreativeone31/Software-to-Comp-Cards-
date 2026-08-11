import type { CompResult, DetectedCard } from "../types";

export interface CompProvider { getComps(card: DetectedCard): Promise<CompResult>; }
const hash = (s: string) => [...s].reduce((a, c) => ((a << 5) - a + c.charCodeAt(0)) | 0, 0);
const round = (n: number) => Math.round(n * 100) / 100;

class MockCompService implements CompProvider {
  async getComps(card: DetectedCard): Promise<CompResult> {
    const seed = Math.abs(hash(card.player + card.year + card.parallel));
    let base = 4 + (seed % 1900) / 100;
    if (card.rookie) base *= 1.35;
    if (card.autograph) base *= 2.8;
    if (card.serialNumber) base *= 1.7;
    if (card.grade) base *= 1.65;
    const sampleSize = 3 + (seed % 6);
    const recentSales = Array.from({ length: sampleSize }, (_, i) => round(base * (.78 + ((seed >> (i % 8)) % 42) / 100)));
    const sorted = [...recentSales].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    const medianPrice = sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
    const averagePrice = recentSales.reduce((a, b) => a + b, 0) / recentSales.length;
    return {
      cardId: card.id, recentSales, medianPrice: round(medianPrice), averagePrice: round(averagePrice),
      lowPrice: sorted[0], highPrice: sorted.at(-1)!, sampleSize,
      confidence: Math.min(card.confidence, .9), source: "Demo sold-price model",
      conservativeValue: round(medianPrice * .88),
    };
  }
}

// TODO: Add provider adapters for eBay and licensed sold-comparable data.
export const compService: CompProvider = new MockCompService();
