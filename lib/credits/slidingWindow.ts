import { extractChatTextParts, measureText } from "./contextMeter";
import { ContextTooLongError } from "./types";

export type SlidingMessage = {
  role?: string;
  content?: unknown;
};

function messageChars(message: SlidingMessage): number {
  return measureText(extractChatTextParts([message]));
}

function messageText(message: SlidingMessage): string {
  return extractChatTextParts([message]).join("");
}

function isEmptyAssistantPlaceholder(message: SlidingMessage): boolean {
  if (message.role !== "assistant") {
    return false;
  }
  if (hasNonTextParts(message.content)) {
    return false;
  }
  return messageChars(message) === 0;
}

function hasNonTextParts(content: unknown): boolean {
  if (!Array.isArray(content)) {
    return false;
  }
  return content.some(
    (part) =>
      part &&
      typeof part === "object" &&
      "type" in part &&
      part.type !== "text",
  );
}

/**
 * Last user message is the current turn; everything before is prior.
 * Strips empty assistant placeholders. When generate.ts appends a file-enriched
 * user message on top of the client history, drops the duplicate typed-text
 * user message so it is not counted twice.
 */
export function splitCurrentTurn<T extends SlidingMessage>(
  messages: ReadonlyArray<T>,
): { prior: T[]; current: T } {
  const stripped = messages.filter((message) => !isEmptyAssistantPlaceholder(message));

  let currentIndex = -1;
  for (let i = stripped.length - 1; i >= 0; i--) {
    if (stripped[i].role === "user") {
      currentIndex = i;
      break;
    }
  }

  if (currentIndex === -1) {
    throw new Error("No user message to use as the current turn");
  }

  const current = stripped[currentIndex];
  let prior = stripped.slice(0, currentIndex);

  const previous = prior[prior.length - 1];
  if (previous?.role === "user") {
    const previousText = messageText(previous);
    const currentTurnText = messageText(current);
    if (!previousText || currentTurnText.startsWith(previousText)) {
      prior = prior.slice(0, -1);
    }
  }

  return { prior, current };
}

/**
 * Keep the newest whole prior messages that fit in maxChars minus the current
 * turn. Drops a message entirely if it does not fit; never mid-slices.
 * Rejects when the current turn alone exceeds the window.
 */
export function slideToWindow<T extends SlidingMessage>(
  prior: ReadonlyArray<T>,
  current: T,
  maxChars: number,
): T[] {
  const currentChars = messageChars(current);
  if (currentChars > maxChars) {
    throw new ContextTooLongError(currentChars, maxChars);
  }

  let remaining = maxChars - currentChars;
  const kept: T[] = [];

  for (let i = prior.length - 1; i >= 0; i--) {
    const chars = messageChars(prior[i]);
    if (chars > remaining) {
      break;
    }
    kept.unshift(prior[i]);
    remaining -= chars;
  }

  return [...kept, current];
}
