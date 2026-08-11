import type { AppSettings, CompResult, DealAnalysis } from "../types";
const money = (n: number) => Math.round(n * 100) / 100;

export function calculateDeal(comps: CompResult[], askingPrice: number, settings: AppSettings): DealAnalysis {
  const marketValue = comps.reduce((s, c) => s + c.medianPrice, 0);
  const conservativeValue = comps.reduce((s, c) => s + c.medianPrice * (1 - settings.conservativeDiscount / 100), 0);
  const sellingFees = conservativeValue * settings.ebayFeePercent / 100 + settings.perOrderFee;
  const totalSellingCosts = sellingFees + settings.shippingCost + settings.suppliesCost;
  const netProceeds = conservativeValue - totalSellingCosts;
  const expectedProfit = netProceeds - askingPrice;
  const roi = askingPrice > 0 ? expectedProfit / askingPrice * 100 : 0;
  const maxBuyPrice = netProceeds / (1 + settings.desiredRoi / 100);
  const idealBuyPrice = maxBuyPrice * .82;
  const verdict = expectedProfit < 0 || (askingPrice > 0 && roi < settings.desiredRoi * .65)
    ? "PASS" : askingPrice <= idealBuyPrice && roi >= settings.desiredRoi ? "BUY" : "OFFER";
  return {
    marketValue: money(marketValue), conservativeValue: money(conservativeValue),
    sellingFees: money(sellingFees), shipping: settings.shippingCost, supplies: settings.suppliesCost,
    totalSellingCosts: money(totalSellingCosts), netProceeds: money(netProceeds), askingPrice,
    expectedProfit: money(expectedProfit), roi: money(roi), idealBuyPrice: money(Math.max(0, idealBuyPrice)),
    maxBuyPrice: money(Math.max(0, maxBuyPrice)), verdict,
  };
}
