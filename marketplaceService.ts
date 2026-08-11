export interface MarketplaceProvider {
  buildSearchUrl(query: string): string;
}
export const marketplaceService: MarketplaceProvider = {
  buildSearchUrl: (query) => `https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(query)}&LH_Sold=1&LH_Complete=1`,
};
// TODO: Add server-side eBay Browse API and approved sold-data provider integrations.
