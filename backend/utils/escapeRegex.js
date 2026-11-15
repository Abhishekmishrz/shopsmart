// Turns user text into a safe regex: "shoes (red)" must not break the pattern
export const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
