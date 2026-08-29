export type ContextBand = "standard" | "extended" | "long";

export type CreditPeriod = "day" | "month";

export type CreditTask =
  | { kind: "chat"; textParts: string[] }
  | { kind: "quiz"; textParts: string[] }
  | { kind: "flashcards"; textParts: string[] }
  | { kind: "image" }
  | { kind: "resume"; textParts: string[] };

export type PriceResult = {
  credits: number;
  band: ContextBand | null;
  characters: number;
};

export type UsageSnapshot = {
  used: number;
  limit: number;
  remaining: number;
  periodKey: string;
  resetsAt: string;
  period: CreditPeriod;
};

export type CreditReservation = {
  userId: string;
  periodKey: string;
  credits: number;
};

export class InsufficientCreditsError extends Error {
  readonly name = "InsufficientCreditsError";
  readonly code = "INSUFFICIENT_CREDITS" as const;
  readonly status = 402 as const;
  readonly remaining: number;
  readonly limit: number;
  readonly resetsAt: string;

  constructor(remaining: number, limit: number, resetsAt: string) {
    super("Insufficient credits");
    this.remaining = remaining;
    this.limit = limit;
    this.resetsAt = resetsAt;
    Object.setPrototypeOf(this, new.target.prototype);
  }

  toResponseBody() {
    return {
      error: this.message,
      code: this.code,
      remaining: this.remaining,
      limit: this.limit,
      resetsAt: this.resetsAt,
    };
  }
}

export class ContextTooLongError extends Error {
  readonly name = "ContextTooLongError";
  readonly status = 400 as const;
  readonly characters: number;
  readonly max: number;

  constructor(characters: number, max: number) {
    super(`Context exceeds the ${max} character limit`);
    this.characters = characters;
    this.max = max;
    Object.setPrototypeOf(this, new.target.prototype);
  }

  toResponseBody() {
    return {
      error: this.message,
      characters: this.characters,
      max: this.max,
    };
  }
}
