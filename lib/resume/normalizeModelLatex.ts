const BEGIN_DOCUMENT_RE = /\\begin\s*\{document\}/;
const END_DOCUMENT_RE = /\\end\s*\{document\}/;

export class InvalidResumeLatexError extends Error {
  readonly name = "InvalidResumeLatexError";

  constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

function stripMarkdownFences(text: string): string {
  const trimmed = text.trim();

  const fenced = trimmed.match(
    /```(?:latex|tex)?[ \t]*\r?\n([\s\S]*?)\r?\n[ \t]*```/i,
  );
  if (fenced) {
    return fenced[1].trim();
  }

  if (trimmed.startsWith("```")) {
    return trimmed
      .replace(/^```[^\n\r]*\r?\n?/, "")
      .replace(/\r?\n```[ \t]*$/, "")
      .trim();
  }

  return trimmed;
}

/**
 * Strip markdown fences and keep only `\begin{document}...\end{document}`.
 * Drops an accidental preamble (everything before `\begin{document}`).
 */
export function normalizeModelLatex(raw: string): string {
  if (typeof raw !== "string" || !raw.trim()) {
    throw new InvalidResumeLatexError("Model output is empty");
  }

  const unfenced = stripMarkdownFences(raw);
  const beginMatch = BEGIN_DOCUMENT_RE.exec(unfenced);
  if (!beginMatch) {
    throw new InvalidResumeLatexError(
      "Model output is missing \\begin{document}",
    );
  }

  const fromBegin = unfenced.slice(beginMatch.index);
  const endMatch = END_DOCUMENT_RE.exec(fromBegin);
  if (!endMatch) {
    throw new InvalidResumeLatexError(
      "Model output is missing \\end{document}",
    );
  }

  return fromBegin.slice(0, endMatch.index + endMatch[0].length).trim();
}
