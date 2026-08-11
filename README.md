# CardScout

CardScout is a mobile-first sports card buying assistant. Upload a card photo or lot screenshot, review the detected cards, see rough comparable sales, and calculate realistic resale proceeds before you buy.

## Features

- Camera capture, image upload, desktop drag-and-drop, and manual entry
- Multi-card detection with explicit confidence scores and low-confidence warnings
- Editable card details before comping
- Demo sold-comparable engine with median, range, sample size, and conservative value
- Fee, shipping, supplies, net proceeds, profit, ROI, ideal offer, and maximum-buy calculations
- Clear **BUY / OFFER / PASS** verdicts based on deal economics—not headline value alone
- Lot rankings for best cards, bulk, highest confidence, and cards needing verification
- Estimated liquidity grades with transparent limitations
- Device-local history and editable settings
- Responsive, accessible dark interface optimized for one-handed phone use

## Tech stack

- React 19 and TypeScript
- Vite-powered Vinext application runtime
- Tailwind CSS
- Lucide React icons
- localStorage persistence

## Run locally

Requirements: Node.js 22.13 or newer.

```bash
npm install
npm run dev
```

The same project works with Bun:

```bash
bun install
bun run dev
```

Create a production build with:

```bash
npm run build
```

## Demo mode

No API key is required. The recognition service returns realistic sample cards based on the uploaded file, and the comp service generates deterministic mock sold prices based on card attributes. All demo results are explicitly labeled; the application does not claim that simulated sales are live marketplace data.

To see the full eight-card lot workflow, upload an image with `lot` in its filename.

## Service architecture

- `src/services/cardRecognitionService.ts` defines the swappable vision-provider interface.
- `src/services/compService.ts` defines the swappable comparable-sales provider.
- `src/services/marketplaceService.ts` owns marketplace search links and future API integration.
- `src/lib/dealCalculator.ts` contains provider-independent deal mathematics.

### Future AI integration

A future server or serverless endpoint can accept the uploaded image and call an OpenAI vision-capable model, returning the existing `DetectedCard` shape. A local development environment may name an API variable `VITE_OPENAI_API_KEY`, but **never expose a secret key in production client code**. Production requests must pass through a secure server-side proxy.

### Future marketplace integration

Implement a provider adapter backed by the eBay Browse API and/or an approved sold-comparable data provider. Do not treat active asking prices as sales. Authentication credentials must remain server-side.

## Editable assumptions

The included fee, per-order, shipping, supplies, ROI, and conservative-discount values are examples. Marketplace fees vary by category, account, promotion, order size, and time. Users should enter their own current costs in Settings.

## Known MVP limitations

- Recognition and pricing are simulated until live providers are connected.
- A single front image may not prove an exact parallel, short print, condition, or authenticity.
- The liquidity score is an estimate based on card attributes, sample size, and confidence—not true sell-through velocity.
- History is stored only in the current browser.
- Currency formatting currently displays USD.

## Next steps

1. Add a secure image-analysis endpoint and card-back refinement.
2. Connect compliant sold-price data and matching-quality scoring.
3. Add image-level bounding boxes and crop confirmation for large lots.
4. Add accounts, cloud history, inventory export, and realized-profit tracking.
5. Validate fee presets against marketplace categories without presenting any rate as universal.

CardScout provides rough decision support, not guaranteed prices or financial advice.
