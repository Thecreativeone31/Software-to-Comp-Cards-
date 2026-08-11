import { demoCards } from "../data/demoCards";
import type { DetectedCard } from "../types";
import { makeId } from "../lib/id";

export interface CardRecognitionProvider {
  analyze(image: File): Promise<{ cards: DetectedCard[] }>;
}

const queryFor = (c: typeof demoCards[number]) =>
  [c.year, c.manufacturer, c.set, c.player, c.cardNumber, c.parallel, c.serialNumber, c.rookie ? "RC" : "", c.autograph ? "auto" : ""].filter(Boolean).join(" ");

export class MockCardRecognitionService implements CardRecognitionProvider {
  async analyze(image: File): Promise<{ cards: DetectedCard[] }> {
    if (!image.type.startsWith("image/")) throw new Error("UNSUPPORTED_FILE");
    if (image.size > 12 * 1024 * 1024) throw new Error("LARGE_IMAGE");
    await new Promise((resolve) => setTimeout(resolve, 1100));
    const count = Math.min(8, Math.max(1, image.name.toLowerCase().includes("lot") ? 8 : 3));
    const start = image.name.length % demoCards.length;
    return {
      cards: Array.from({ length: count }, (_, i) => {
        const card = demoCards[(start + i) % demoCards.length];
        return { ...card, id: makeId(), searchQuery: queryFor(card) };
      }),
    };
  }
}

// TODO: Proxy OpenAI vision calls through a secure serverless endpoint.
export const cardRecognitionService: CardRecognitionProvider = new MockCardRecognitionService();

export const createManualCard = (): DetectedCard => ({
  id: makeId(), player: "", sport: "Basketball", year: new Date().getFullYear(),
  manufacturer: "", set: "", cardNumber: "", parallel: "", serialNumber: null,
  rookie: false, autograph: false, memorabilia: false, gradingCompany: null, grade: null,
  confidence: 1, searchQuery: "",
});
