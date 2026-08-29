import type { ContextBand } from "./types";
import { ContextTooLongError } from "./types";

export const MAX_CONTEXT_CHARS = 40_000;
const STANDARD_MAX = 12_000;
const EXTENDED_MAX = 32_000;

export function measureText(parts: string[]): number {
  let total = 0;
  for (const part of parts) {
    if (part) {
      total += part.length;
    }
  }
  return total;
}

export function bandFor(count: number): ContextBand {
  if (count > MAX_CONTEXT_CHARS) {
    throw new ContextTooLongError(count, MAX_CONTEXT_CHARS);
  }
  if (count <= STANDARD_MAX) {
    return "standard";
  }
  if (count <= EXTENDED_MAX) {
    return "extended";
  }
  return "long";
}

/**
 * Text actually sent to the model: non-empty content strings only.
 * Skips empty assistant placeholders and image/base64 parts.
 */
export function extractChatTextParts(
  messages: ReadonlyArray<{ role?: string; content?: unknown }>,
): string[] {
  const parts: string[] = [];
  for (const message of messages) {
    const texts = contentToTextParts(message.content).filter((text) => text.length > 0);
    if (texts.length === 0) {
      continue;
    }
    parts.push(...texts);
  }
  return parts;
}

function contentToTextParts(content: unknown): string[] {
  if (typeof content === "string") {
    return [content];
  }
  if (!Array.isArray(content)) {
    return [];
  }

  const parts: string[] = [];
  for (const part of content) {
    if (
      part &&
      typeof part === "object" &&
      "type" in part &&
      part.type === "text" &&
      "text" in part &&
      typeof part.text === "string"
    ) {
      parts.push(part.text);
    }
  }
  return parts;
}
