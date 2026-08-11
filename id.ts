export const makeId = () =>
  typeof globalThis.crypto?.randomUUID === "function"
    ? globalThis.crypto.randomUUID()
    : `cs-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
